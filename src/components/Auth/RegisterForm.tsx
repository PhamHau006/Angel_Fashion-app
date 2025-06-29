import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Capacitor } from '@capacitor/core';
import { getApiUrl } from '../../config/api';
// Định nghĩa schema với zod
const registerSchema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ và tên'),
  username: z.string().min(1, 'Vui lòng nhập tên tài khoản').regex(/^[a-zA-Z0-9_]+$/, 'Tên tài khoản không được chứa ký tự đặc biệt'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/,
    'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt'
  ),
  confirmPassword: z.string(),
  verificationCode: z.string().min(6, 'Mã xác minh phải có 6 chữ số'),
  agreeTerms: z.boolean().refine(val => val === true, 'Vui lòng đồng ý với điều khoản sử dụng'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// API URL configuration cho mobile và web
const API_URL = getApiUrl();

export const RegisterForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  // Form hook
  const { register, handleSubmit, formState: { errors }, setError, getValues } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Debug info
  useEffect(() => {
    console.log('Register API_URL:', API_URL);
    console.log('Platform:', Capacitor.getPlatform());
    console.log('IsNative:', Capacitor.isNativePlatform());
  }, []);

  // Tải reCAPTCHA script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    document.head.appendChild(script);

    window.onRecaptchaVerify = (token: string) => setRecaptchaToken(token);
    window.onRecaptchaExpired = () => {
      setRecaptchaToken(null);
      toast.error('reCAPTCHA đã hết hạn', { description: 'Lỗi' });
    };

    return () => {
      document.head.removeChild(script);
      delete window.onRecaptchaVerify;
      delete window.onRecaptchaExpired;
      window.grecaptcha?.reset();
    };
  }, []);

  // API mutations
  const checkUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      console.log('Checking username with:', API_URL);
      try {
        const response = await fetch(`${API_URL}/api/Account/checkUsername?username=${encodeURIComponent(username)}`);
        console.log('Check username response status:', response.status);
        
        if (!response.ok) throw new Error('Lỗi kiểm tra tên tài khoản');
        return response.json();
      } catch (error) {
        console.error('Check username error:', error);
        throw error;
      }
    },
    onError: (error) => {
      console.error('Check username mutation error:', error);
      toast.error('Không thể kiểm tra tên tài khoản', { description: 'Lỗi' });
    }
  });

  const checkEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      console.log('Checking email with:', API_URL);
      try {
        const response = await fetch(`${API_URL}/api/Account/checkEmail?email=${encodeURIComponent(email)}`);
        console.log('Check email response status:', response.status);
        
        if (!response.ok) throw new Error('Lỗi kiểm tra email');
        return response.json();
      } catch (error) {
        console.error('Check email error:', error);
        throw error;
      }
    },
    onError: (error) => {
      console.error('Check email mutation error:', error);
      toast.error('Không thể kiểm tra email', { description: 'Lỗi' });
    }
  });

  const sendVerificationCodeMutation = useMutation({
    mutationFn: async (email: string) => {
      console.log('Sending verification code with:', API_URL);
      try {
        const response = await fetch(`${API_URL}/api/Account/SendVerificationCode?email=${encodeURIComponent(email)}`);
        console.log('Send verification code response status:', response.status);
        
        if (!response.ok) throw new Error('Lỗi gửi mã xác minh');
        return response.json();
      } catch (error) {
        console.error('Send verification code error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Send verification code success:', data);
      if (data.success) {
        toast.success(data.message, { description: 'Thành công' });
      } else {
        toast.error(data.message, { description: 'Lỗi' });
      }
    },
    onError: (error) => {
      console.error('Send verification code mutation error:', error);
      toast.error('Không thể gửi mã xác minh', { description: 'Lỗi' });
    }
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      console.log('Verifying email with:', API_URL);
      try {
        const response = await fetch(`${API_URL}/api/Account/VerifyEmail?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
        console.log('Verify email response status:', response.status);
        
        if (!response.ok) throw new Error('Lỗi xác minh email');
        return response.json();
      } catch (error) {
        console.error('Verify email error:', error);
        throw error;
      }
    },
    onError: (error) => {
      console.error('Verify email mutation error:', error);
      toast.error('Không thể xác minh email', { description: 'Lỗi' });
    }
  });

  const verifyRecaptchaMutation = useMutation({
    mutationFn: async (token: string) => {
      console.log('Verifying reCAPTCHA with:', API_URL);
      try {
        const response = await fetch(`${API_URL}/api/Account/VerifyRecaptcha`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ RecaptchaToken: token }),
        });
        console.log('Verify reCAPTCHA response status:', response.status);
        
        if (!response.ok) throw new Error('Lỗi xác minh reCAPTCHA');
        return response.json();
      } catch (error) {
        console.error('Verify reCAPTCHA error:', error);
        throw error;
      }
    },
    onError: (error) => {
      console.error('Verify reCAPTCHA mutation error:', error);
      toast.error('Không thể xác minh reCAPTCHA', { description: 'Lỗi' });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      console.log('Registering with:', API_URL);
      try {
        const response = await fetch(`${API_URL}/api/Account/Register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            HoTen: data.fullName,
            TenTaiKhoan: data.username,
            Email: data.email,
            MatKhau: data.password,
            RecaptchaToken: recaptchaToken,
          }),
        });
        console.log('Register response status:', response.status);
        
        if (!response.ok) throw new Error('Lỗi đăng ký');
        return response.json();
      } catch (error) {
        console.error('Register error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Register success:', data);
      if (data.success) {
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.', { description: 'Thành công' });
        navigate('/login');
      } else {
        toast.error(data.message, { description: 'Lỗi' });
      }
    },
    onError: (error) => {
      console.error('Register mutation error:', error);
      toast.error('Đăng ký thất bại', { description: 'Lỗi' });
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    console.log('Form submit with API_URL:', API_URL);
    
    try {
      // Kiểm tra username
      const usernameCheck = await checkUsernameMutation.mutateAsync(data.username);
      if (!usernameCheck.success) {
        setError('username', { message: usernameCheck.message });
        return;
      }

      // Kiểm tra email
      const emailCheck = await checkEmailMutation.mutateAsync(data.email);
      if (!emailCheck.success) {
        setError('email', { message: emailCheck.message });
        return;
      }

      // Xác minh email
      const verifyEmailResult = await verifyEmailMutation.mutateAsync({ email: data.email, code: data.verificationCode });
      if (!verifyEmailResult.success) {
        setError('verificationCode', { message: verifyEmailResult.message });
        return;
      }

      // Xác minh reCAPTCHA
      if (!recaptchaToken) {
        toast.error('Vui lòng hoàn thành reCAPTCHA', { description: 'Lỗi' });
        return;
      }
      const recaptchaResult = await verifyRecaptchaMutation.mutateAsync(recaptchaToken);
      if (!recaptchaResult.success) {
        toast.error(recaptchaResult.message, { description: 'Lỗi' });
        return;
      }

      // Đăng ký
      registerMutation.mutate(data);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center p-4 mobile-safe-area">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">Đăng ký</CardTitle>
            <p className="text-pink-100">Tạo tài khoản Angel Fashion</p>
            {/* Debug info */}
            <div className="text-xs text-pink-200 mt-2">
              API: {API_URL}
            </div>
            <div className="text-xs text-pink-200">
              Platform: {Capacitor.getPlatform()} | Native: {Capacitor.isNativePlatform().toString()}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input 
                  id="fullName" 
                  {...register('fullName')} 
                  placeholder="Nhập họ và tên" 
                  className={errors.fullName ? 'border-red-500' : ''} 
                />
                {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
              </div>
              
              <div>
                <Label htmlFor="username">Tên tài khoản</Label>
                <Input 
                  id="username" 
                  {...register('username')} 
                  placeholder="Nhập tên tài khoản" 
                  className={errors.username ? 'border-red-500' : ''} 
                />
                {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  {...register('email')} 
                  placeholder="Nhập email" 
                  className={errors.email ? 'border-red-500' : ''} 
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => sendVerificationCodeMutation.mutate(getValues('email'))}
                  disabled={sendVerificationCodeMutation.isPending}
                >
                  {sendVerificationCodeMutation.isPending ? 'Đang gửi...' : 'Gửi mã xác minh'}
                </Button>
              </div>
              
              <div>
                <Label htmlFor="verificationCode">Mã xác minh</Label>
                <Input 
                  id="verificationCode" 
                  {...register('verificationCode')} 
                  placeholder="Nhập mã xác minh" 
                  className={errors.verificationCode ? 'border-red-500' : ''} 
                />
                {errors.verificationCode && <p className="text-sm text-red-500">{errors.verificationCode.message}</p>}
              </div>
              
              <div>
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Nhập mật khẩu"
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    placeholder="Nhập lại mật khẩu"
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" {...register('agreeTerms')} />
                <Label htmlFor="terms" className="text-sm">
                  Tôi đồng ý với <span className="text-primary">điều khoản sử dụng</span> và <span className="text-primary">chính sách bảo mật</span>
                </Label>
              </div>
              {errors.agreeTerms && <p className="text-sm text-red-500">{errors.agreeTerms.message}</p>}
              
              <div 
                className="g-recaptcha" 
                data-sitekey="6LdIA0orAAAAAB-3smkOKHc3MRmSw85-XrOMnST3" 
                data-callback="onRecaptchaVerify" 
                data-expired-callback="onRecaptchaExpired"
              ></div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-pink-500 to-blue-500" 
                disabled={registerMutation.isPending || checkUsernameMutation.isPending || checkEmailMutation.isPending || sendVerificationCodeMutation.isPending || verifyEmailMutation.isPending || verifyRecaptchaMutation.isPending}
              >
                {registerMutation.isPending || checkUsernameMutation.isPending || checkEmailMutation.isPending || sendVerificationCodeMutation.isPending || verifyEmailMutation.isPending || verifyRecaptchaMutation.isPending
                  ? 'Đang xử lý...' 
                  : 'Đăng ký'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Đã có tài khoản? <button onClick={() => navigate('/login')} className="text-primary font-medium hover:underline">Đăng nhập ngay</button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};