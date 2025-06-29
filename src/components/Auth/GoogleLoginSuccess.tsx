import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { CapacitorHttp } from '@capacitor/core';
import { getApiUrl } from '../../config/api';

const API_URL = getApiUrl();

export const GoogleLoginSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleGoogleLogin = async () => {
      try {
        const deviceInfo = await Device.getInfo();
        const deviceId = await Device.getId();
        console.log('Device info:', { ...deviceInfo, deviceId: deviceId.identifier });

        const params = new URLSearchParams(location.search);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const error = params.get('error');

        if (accessToken && refreshToken) {
          const loginPayload = {
            access_token: accessToken,
            refresh_token: refreshToken,
            device_id: deviceId.identifier,
            device_name: deviceInfo.name || 'UnknownDevice',
            platform: Capacitor.getPlatform(),
          };

          let response;
          if (Capacitor.isNativePlatform()) {
            console.log('Using CapacitorHttp for mobile Google login...');
            response = await CapacitorHttp.post({
              url: `${API_URL}/api/Account/MobileGoogleLogin`,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
              data: loginPayload,
            });

            if (response.status !== 200) {
              throw new Error(`HTTP ${response.status}: ${response.data?.message || 'Unknown error'}`);
            }
          } else {
            console.log('Using fetch for web Google login...');
            response = await fetch(`${API_URL}/api/Account/MobileGoogleLogin`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify(loginPayload),
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
          }

          const result = await (Capacitor.isNativePlatform() ? response.data : response.json());
          localStorage.setItem('accessToken', result.data.accessToken);
          localStorage.setItem('refreshToken', result.data.refreshToken);
          toast.success('Đăng nhập Google thành công!', { description: 'Thành công' });
          navigate('/');
        } else if (error) {
          let errorMessage = decodeURIComponent(error);
          toast.error(errorMessage, { description: 'Lỗi' });
          navigate('/login');
        } else {
          toast.error('Có lỗi xảy ra khi xử lý đăng nhập Google', { description: 'Lỗi' });
          navigate('/login');
        }
      } catch (error) {
        console.error('Error in Google login:', error);
        toast.error('Lỗi đăng nhập Google: ' + error.message, { description: 'Lỗi' });
        navigate('/login');
      }
    };

    handleGoogleLogin();
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-angel mobile-safe-area">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-lg font-medium">Đang xử lý đăng nhập Google...</p>
        <div className="text-xs text-gray-500 space-y-1">
          <div>Platform: {Capacitor.getPlatform()}</div>
          <div>Native: {Capacitor.isNativePlatform().toString()}</div>
          <div>Location: {location.pathname}{location.search}</div>
        </div>
      </div>
    </div>
  );
};