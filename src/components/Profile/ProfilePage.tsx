
import React from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Heart, 
  ShoppingBag, 
  Star, 
  Gift, 
  CreditCard, 
  MapPin, 
  Bell,
  ChevronRight,
  Edit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
  const navigate = useNavigate();

  const userStats = [
    { label: 'Đơn hàng', value: '12', icon: ShoppingBag },
    { label: 'Yêu thích', value: '24', icon: Heart },
    { label: 'Đánh giá', value: '8', icon: Star },
    { label: 'Điểm thưởng', value: '1,250', icon: Gift },
  ];

  const menuItems = [
    { 
      title: 'Đơn hàng của tôi', 
      icon: ShoppingBag, 
      action: () => navigate('/orders'),
      badge: '2 đang xử lý'
    },
    { 
      title: 'Sản phẩm yêu thích', 
      icon: Heart, 
      action: () => navigate('/favorites')
    },
    { 
      title: 'Thông tin thanh toán', 
      icon: CreditCard, 
      action: () => navigate('/payment-info')
    },
    { 
      title: 'Địa chỉ giao hàng', 
      icon: MapPin, 
      action: () => navigate('/addresses')
    },
    { 
      title: 'Thông báo', 
      icon: Bell, 
      action: () => navigate('/notifications'),
      badge: '3 mới'
    },
  ];

  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-primary via-secondary to-accent p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <User size={32} />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Nguyễn Minh Thu</h1>
              <p className="text-white/80">thu.nguyen@email.com</p>
              <Badge className="mt-2 bg-white/20 text-white border-white/30">
                Thành viên VIP
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate('/edit-profile')}>
              <Edit size={20} />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 -mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-4">
                {userStats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <stat.icon size={20} className="text-primary" />
                    </div>
                    <div className="text-lg font-bold">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-3">
          {menuItems.map((item, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4" onClick={item.action}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <item.icon size={20} className="text-gray-600" />
                    </div>
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="p-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Đơn hàng gần đây</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <img
                    src="/placeholder.svg"
                    alt="Product"
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Áo thun Angel Basic</p>
                    <p className="text-xs text-gray-500">Đang giao hàng</p>
                  </div>
                  <Badge className="bg-blue-500">
                    Theo dõi
                  </Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <img
                    src="/placeholder.svg"
                    alt="Product"
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Váy Angel Summer</p>
                    <p className="text-xs text-gray-500">Đã giao thành công</p>
                  </div>
                  <Badge variant="outline">
                    Đánh giá
                  </Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-3" onClick={() => navigate('/orders')}>
                Xem tất cả đơn hàng
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
};
