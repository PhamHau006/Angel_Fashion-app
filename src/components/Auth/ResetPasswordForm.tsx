import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Capacitor } from '@capacitor/core';
import { getApiUrl } from '../../config/api';
const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/,
    'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt'
  ),
  confirmPassword: z.string(),
  loginAfterReset: z.boolean(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

// API URL configuration cho mobile và web
const API_URL = getApiUrl();

export const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = new URLSearchParams(location.search).get('email') || '';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Debug info
  useEffect(() => {
    console.log('ResetPassword API_URL:', API_URL);
    console.log('Platform:', Capacitor.getPlatform());
    console.log('IsNative:', Capacitor.isNativePlatform());
    console.log('Email from URL:', email);
  }, [email]);

  const checkPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      console.log('Checking password with:', API_URL);
      try {
        const response = await fetch(`${API_URL}/api/Account/CheckPassword?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
        console.log('Check password response status:', response.status);
        
        if (!response.ok) throw new Error('Lỗi kiểm tra mật khẩu');
        return response.json();
      } catch (error) {
        console.error('Check password error:', error);
        throw error;
      }
    },
    onError: (error) => {
      console.error('Check password mutation error:', error);
      toast.error('Không thể kiểm tra mật khẩu', { description: 'Lỗi' });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordForm) => {
      console.log('Resetting password with:', API_URL);
      try {
        const response = await fetch(`${API_URL}/api/Account/ResetPasswordCustomer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            newPassword: data.newPassword,
            loginAfterReset: data.loginAfterReset,
          }),
        });
        console.log('Reset password response status:', response.status);
        
        if (!response.ok) throw new Error('Lỗi đặt lại mật khẩu');
        return response.json();
      } catch (error) {
        console.error('Reset password error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Reset password success:', data);
      if (data.success) {
        if (data.data && data.loginAfterReset) {
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          toast.success('Đặt lại mật khẩu và đăng nhập thành công!', { description: 'Thành công' });
          navigate('/');
        } else {
          toast.success('Đặt lại mật khẩu thành công!', { description: 'Thành công' });
          navigate('/login');
        }
      } else {
        toast.error(data.message, { description: 'Lỗi' });
      }
    },
    onError: (error) => {
      console.error('Reset password mutation error:', error);
      toast.error('Đặt lại mật khẩu thất bại', { description: 'Lỗi' });
    }
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    console.log('Form submit with API_URL:', API_URL);
    
    try {
      const passwordCheck = await checkPasswordMutation.mutateAsync(data.newPassword);
      if (!passwordCheck.success) {
        toast.error(passwordCheck.message, { description: 'Lỗi' });
        return;
      }
      resetPasswordMutation.mutate(data);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  if (!email) {
    navigate('/forgot-password');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-angel mobile-safe-area">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Đặt lại mật khẩu</CardTitle>
          <p className="text-sm text-muted-foreground">Nhập mật khẩu mới cho tài khoản của bạn</p>
          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-2">
            API: {API_URL} | Platform: {Capacitor.getPlatform()} | Native: {Capacitor.isNativePlatform().toString()}
          </div>
          <div className="text-xs text-gray-500">
            Email: {email}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu mới"
                  {...register('newPassword')}
                  className={errors.newPassword ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.newPassword && <p className="text-sm text-red-500">{errors.newPassword.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="loginAfterReset" 
                {...register('loginAfterReset')} 
                className="rounded border-gray-300" 
              />
              <Label htmlFor="loginAfterReset" className="text-sm">
                Đăng nhập ngay sau khi đổi mật khẩu
              </Label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary-dark" 
              disabled={resetPasswordMutation.isPending || checkPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending || checkPasswordMutation.isPending 
                ? 'Đang xử lý...' 
                : 'Đổi mật khẩu'}
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