import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  verificationCode: z.string().optional(),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const API_URL = 'https://localhost:7217';

export const ForgotPasswordForm = () => {
  const navigate = useNavigate();
  const [showVerification, setShowVerification] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [isCounting, setIsCounting] = useState(false);
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // Callback cho reCAPTCHA
  const onRecaptchaVerify = useCallback((token: string) => {
    setRecaptchaToken(token);
  }, []);

  const onRecaptchaExpired = useCallback(() => {
    setRecaptchaToken(null);
    toast.error('reCAPTCHA đã hết hạn', { description: 'Lỗi' });
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
    script.async = true;
    script.defer = true;

    // Hàm được gọi khi script tải xong
    (window as any).onRecaptchaLoad = () => {
      setRecaptchaLoaded(true);
      window.grecaptcha.render('recaptcha-container', {
        sitekey: '6LdIA0orAAAAAB-3smkOKHc3MRmSw85-XrOMnST3',
        callback: onRecaptchaVerify,
        'expired-callback': onRecaptchaExpired,
      });
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
      delete (window as any).onRecaptchaLoad;
    };
  }, [onRecaptchaVerify, onRecaptchaExpired]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCounting && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0) {
      setIsCounting(false);
    }
    return () => clearInterval(timer);
  }, [isCounting, countdown]);

  const verifyRecaptchaMutation = useMutation({
    mutationFn: async (token: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(`${API_URL}/api/Account/VerifyRecaptcha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ RecaptchaToken: token }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error('Lỗi xác minh reCAPTCHA');
      return response.json();
    },
    onError: () => toast.error('Không thể xác minh reCAPTCHA', { description: 'Lỗi' }),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(`${API_URL}/api/Account/ForgotPasswordCustomer?email=${encodeURIComponent(email)}`);
      if (!response.ok) throw new Error('Lỗi gửi mã xác minh');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setShowVerification(true);
        setCountdown(60);
        setIsCounting(true);
        toast.success(data.message, { description: 'Thành công' });
      } else {
        toast.error(data.message, { description: 'Lỗi' });
      }
    },
    onError: () => toast.error('Không thể gửi mã xác minh', { description: 'Lỗi' }),
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      const response = await fetch(`${API_URL}/api/Account/VerifyResetPasswordCode?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
      if (!response.ok) throw new Error('Lỗi xác minh mã');
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success(data.message, { description: 'Thành công' });
        navigate(`/reset-password?email=${encodeURIComponent(variables.email)}`);
      } else {
        toast.error(data.message, { description: 'Lỗi' });
      }
    },
    onError: () => toast.error('Không thể xác minh mã', { description: 'Lỗi' }),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    if (!recaptchaToken) {
      toast.error('Vui lòng hoàn thành reCAPTCHA', { description: 'Lỗi' });
      return;
    }
    const recaptchaResult = await verifyRecaptchaMutation.mutateAsync(recaptchaToken);
    if (!recaptchaResult.success) {
      toast.error(recaptchaResult.message, { description: 'Lỗi' });
      setRecaptchaToken(null);
      if (recaptchaLoaded) {
        window.grecaptcha?.reset();
      }
      return;
    }

    if (showVerification) {
      verifyCodeMutation.mutate({ email: data.email, code: data.verificationCode || '' });
    } else {
      forgotPasswordMutation.mutate(data.email);
    }
    setRecaptchaToken(null);
    if (recaptchaLoaded) {
      window.grecaptcha?.reset();
    }
  };

  const handleResendCode = () => {
    if (isCounting) {
      toast.info('Vui lòng đợi hết thời gian đếm ngược', { description: 'Thông báo' });
      return;
    }
    forgotPasswordMutation.mutate(getValues('email'));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-angel mobile-safe-area">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Quên mật khẩu</CardTitle>
          <p className="text-sm text-muted-foreground">{showVerification ? 'Nhập mã xác minh' : 'Nhập email để nhận mã xác minh'}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Nhập email"
                {...register('email')}
                disabled={showVerification}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            {showVerification && (
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Mã xác minh</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="Nhập mã xác minh"
                  {...register('verificationCode')}
                  className={errors.verificationCode ? 'border-red-500' : ''}
                />
                {errors.verificationCode && <p className="text-sm text-red-500">{errors.verificationCode.message}</p>}
                <p className="text-sm text-muted-foreground">
                  Mã có hiệu lực trong: <strong>{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</strong>
                </p>
                <Button type="button" variant="link" onClick={handleResendCode} disabled={isCounting}>
                  Gửi lại mã
                </Button>
              </div>
            )}
            <div id="recaptcha-container" className="g-recaptcha"></div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary-dark" disabled={forgotPasswordMutation.isPending || verifyCodeMutation.isPending}>
              {showVerification ? 'Xác minh mã' : 'Gửi mã xác minh'}
            </Button>
          </form>
          <div className="text-center">
            <button onClick={() => navigate('/login')} className="text-sm text-primary hover:underline">
              Quay lại đăng nhập
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};