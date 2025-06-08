import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Vui lòng nhập email hoặc tên tài khoản').refine(
    (value) => {
      if (value.includes('@')) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }
      return value.trim().length > 0;
    },
    { message: 'Email không hợp lệ' }
  ),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type LoginForm = z.infer<typeof loginSchema>;

const API_URL = 'https://localhost:7217';

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await fetch(`${API_URL}/api/Account/LoginCustomer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Email_TenTaiKhoan: data.emailOrUsername,
          MatKhau: data.password,
        }),
      });
      if (!response.ok) throw new Error('Lỗi đăng nhập');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        toast.success('Đăng nhập thành công!', { description: 'Thành công' });
        navigate('/');
      } else {
        toast.error(data.message, { description: 'Lỗi' });
      }
    },
    onError: () => toast.error('Đăng nhập thất bại', { description: 'Lỗi' }),
  });

  const handleGoogleLogin = () => {
    console.log('Redirecting to Google login...');
    window.location.href = `${API_URL}/api/Account/LoginGoogleCustom`;
  };

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Allura&display=swap');

          .logo-container {
            display: flex;
            justify-content: center;
            margin-bottom: 1rem;
            padding: 10px;
            border-radius: 8px;
            
          }

          .logo-container svg {
            max-width: 700px;
            width: 100%;
            height: auto;
            overflow: visible;
            filter: brightness(1); /* Giảm độ sáng để dễ nhìn hơn */
          }

          .angel-text {
            fill: url(#start);
            stroke: #ffffff;
            stroke-width: 2;
            filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5)); /* Giảm độ sáng của bóng */
            font-family: 'Allura', cursive;
            font-weight: 400;
            font-size: 140px;
            letter-spacing: 6px;
            paint-order: stroke fill;
            user-select: none;
          }

          .wing {
            fill: url(#start);
            opacity: 0.85;
            filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3)); /* Giảm độ sáng của bóng */
            transform-origin: center;
            animation: gentleFloat 4.5s ease-in-out infinite;
            shape-rendering: geometricPrecision;
          }

          .wing-right {
            animation-delay: 0.25s;
          }

          @keyframes gentleFloat {
            0%, 100% {
              transform: translateY(0) rotate(0deg);
              opacity: 0.85;
            }
            50% {
              transform: translateY(-7px) rotate(4deg);
              opacity: 1;
            }
          }
            
        `}
      </style>
      <div className="min-h-screen flex items-center justify-center p-4 gradient-angel mobile-safe-area">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="logo-container">
              <svg viewBox="0 0 700 250" role="img" aria-label="Angel soft curvy logo with wings and animated gradient">
                <defs>
                  <linearGradient id="start" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="20%" stopColor="#EC4E79">
                      <animate attributeName="stop-color" values="#EC4E79; #ABA2B7; #5CCAE7; #ABA2B7; #EC4E79;" dur="6s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="40%" stopColor="#ABA2B7">
                      <animate attributeName="stop-color" values="#ABA2B7; #5CCAE7; #EC4E79; #5CCAE7; #ABA2B7;" dur="6s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="55%" stopColor="#5CCAE7">
                      <animate attributeName="stop-color" values="#5CCAE7; #ABA2B7; #EC4E79; #ABA2B7; #5CCAE7;" dur="6s" repeatCount="indefinite" />
                    </stop>
                  </linearGradient>
                </defs>
                <path className="wing left" d="M160 130 C110 90, 90 180, 150 170 C130 150, 140 110, 160 130 Z" />
                <path className="wing left" d="M150 140 C120 120, 110 170, 150 160 C140 140, 130 120, 150 140 Z" opacity="0.5" />
                <path className="wing right wing-right" d="M540 130 C590 90, 610 180, 550 170 C570 150, 560 110, 540 130 Z" />
                <path className="wing right wing-right" d="M550 140 C580 120, 590 170, 550 160 C560 140, 570 120, 550 140 Z" opacity="0.5" />
                <text x="50%" y="60%" dominantBaseline="middle" textAnchor="middle" className="angel-text">
                  Angel
                </text>
              </svg>
            </div>
        
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailOrUsername">Email hoặc Tên tài khoản</Label>
                <Input
                  id="emailOrUsername"
                  type="text"
                  placeholder="Email hoặc tên tài khoản"
                  {...register('emailOrUsername')}
                  className={errors.emailOrUsername ? 'border-red-500' : ''}
                />
                {errors.emailOrUsername && <p className="text-sm text-red-500">{errors.emailOrUsername.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary-dark" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? 'Đang xử lý...' : 'Đăng nhập'}
              </Button>
            </form>
            <div className="text-center">
              <button onClick={() => window.location.href = '/forgot-password'} className="text-sm text-primary hover:underline">
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập bằng Google
            </Button>
            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Chưa có tài khoản? <button onClick={() => window.location.href = '/register'} className="text-primary hover:underline">Đăng ký ngay</button>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};