import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export const GoogleLoginSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const error = params.get('error');

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      toast.success('Đăng nhập Google thành công!', { description: 'Thành công' });
      navigate('/');
    } else if (error) {
      let errorMessage = 'Không thể đăng nhập qua Google. Vui lòng thử lại!';
      if (error.includes('Tài khoản đang bị tạm khóa')) {
        errorMessage = 'Tài khoản của bạn đang bị tạm khóa. Vui lòng liên hệ hỗ trợ!';
      } else if (error.includes('Xác thực Google thất bại')) {
        errorMessage = 'Xác thực Google thất bại. Vui lòng kiểm tra lại thông tin đăng nhập!';
      } else {
        errorMessage = decodeURIComponent(error);
      }
      toast.error(errorMessage, { description: 'Lỗi' });
      navigate('/login');
    } else {
      toast.error('Có lỗi xảy ra khi xử lý đăng nhập Google', { description: 'Lỗi' });
      navigate('/login');
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <p>Đang xử lý đăng nhập Google...</p>
    </div>
  );
};