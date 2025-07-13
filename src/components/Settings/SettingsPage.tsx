import React, { useState, useEffect } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Globe, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  User,
  CreditCard,
  LogIn
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const API_URL = 'https://localhost:7217'; // Thay bằng URL API của bạn

export const SettingsPage = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('accessToken')); // Kiểm tra token

  useEffect(() => {
    // Cập nhật trạng thái đăng nhập nếu token thay đổi
    const checkLoginStatus = () => {
      setIsLoggedIn(!!localStorage.getItem('accessToken'));
    };
    checkLoginStatus();
    window.addEventListener('storage', checkLoginStatus);
    return () => window.removeEventListener('storage', checkLoginStatus);
  }, []);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      // Không có token, chỉ cần chuyển hướng đến login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsLoggedIn(false);
      navigate('/login');
      return;
    }

    try {
      // Gọi API để đăng xuất
      const response = await fetch(`${API_URL}/api/Account/Logout`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(refreshToken),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Đăng xuất thành công', { description: 'Thành công' });
      } else {
        toast.error(data.message || 'Đăng xuất thất bại', { description: 'Lỗi' });
      }
    } catch (error) {
      toast.error('Đăng xuất thành công');
    } finally {
      // Xóa token khỏi localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsLoggedIn(false);
      navigate('/login');
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const settingsGroups = [
    {
      title: 'Tài khoản',
      items: [
        {
          title: 'Chỉnh sửa thông tin cá nhân',
          icon: User,
          action: () => navigate('/edit-profile'),
        },
        {
          title: 'Thông tin thanh toán',
          icon: CreditCard,
          action: () => navigate('/payment-info'),
        },
      ],
    },
    {
      title: 'Giao diện',
      items: [
        {
          title: 'Chế độ tối',
          icon: darkMode ? Moon : Sun,
          action: () => setDarkMode(!darkMode),
          toggle: true,
          value: darkMode,
        },
      ],
    },
    {
      title: 'Thông báo',
      items: [
        {
          title: 'Thông báo đẩy',
          icon: Bell,
          action: () => setNotifications(!notifications),
          toggle: true,
          value: notifications,
        },
        {
          title: 'Thông báo email',
          icon: Bell,
          action: () => setEmailNotifications(!emailNotifications),
          toggle: true,
          value: emailNotifications,
        },
      ],
    },
    {
      title: 'Khác',
      items: [
        {
          title: 'Bảo mật và quyền riêng tư',
          icon: Shield,
          action: () => navigate('/privacy'),
        },
        {
          title: 'Ngôn ngữ',
          icon: Globe,
          action: () => navigate('/language'),
          subtitle: 'Tiếng Việt',
        },
        {
          title: 'Trợ giúp & Hỗ trợ',
          icon: HelpCircle,
          action: () => navigate('/help'),
        },
      ],
    },
  ];

  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <h1 className="text-xl font-bold">Cài đặt</h1>
        </div>

        {/* Settings Groups */}
        <div className="p-4 space-y-6">
          {settingsGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {group.title}
              </h2>
              <Card>
                <CardContent className="p-0">
                  {group.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 ${
                        itemIndex !== group.items.length - 1 ? 'border-b' : ''
                      }`}
                      onClick={item.action}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <item.icon size={20} className="text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          {item.subtitle && (
                            <p className="text-sm text-gray-500">{item.subtitle}</p>
                          )}
                        </div>
                      </div>
                      {item.toggle ? (
                        <Switch
                          checked={item.value}
                          onCheckedChange={item.action}
                        />
                      ) : (
                        <ChevronRight size={16} className="text-gray-400" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Login/Logout Button */}
        <div className="p-4">
          <Card>
            <CardContent className="p-4">
              <Button
                variant={isLoggedIn ? "destructive" : "default"}
                className="w-full"
                onClick={isLoggedIn ? handleLogout : handleLoginRedirect}
              >
                {isLoggedIn ? (
                  <>
                    <LogOut size={20} className="mr-2" />
                    Đăng xuất
                  </>
                ) : (
                  <>
                    <LogIn size={20} className="mr-2" />
                    Đăng nhập
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* App Info */}
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500">Angel Fashion</p>
          <p className="text-xs text-gray-400">Phiên bản 1.0.0</p>
        </div>
      </div>
    </MobileLayout>
  );
};