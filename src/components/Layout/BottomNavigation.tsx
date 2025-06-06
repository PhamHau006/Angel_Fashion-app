
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, MessageSquare, Settings, User } from 'lucide-react';

export const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Trang chủ', path: '/' },
    { icon: ShoppingBag, label: 'Cửa hàng', path: '/shop' },
    { icon: MessageSquare, label: 'Tin nhắn', path: '/messenger' },
    { icon: User, label: 'Tài khoản', path: '/profile' },
    { icon: Settings, label: 'Cài đặt', path: '/settings' },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-1 transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-gray-500 hover:text-primary'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
