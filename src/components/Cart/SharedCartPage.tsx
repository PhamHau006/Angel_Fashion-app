
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Clock, User } from 'lucide-react';

export const SharedCartPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [cartData, setCartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const data = searchParams.get('data');
      if (data) {
        // Decode properly to handle Unicode characters
        const encodedString = atob(data);
        const decodedString = decodeURIComponent(encodedString);
        const decodedData = JSON.parse(decodedString);
        setCartData(decodedData);
      } else {
        setError('Dữ liệu giỏ hàng không hợp lệ');
      }
    } catch (err) {
      setError('Không thể tải giỏ hàng được chia sẻ');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const addToMyCart = () => {
    // In a real app, you would add these items to the user's cart
    console.log('Adding items to cart:', cartData.items);
    navigate('/cart');
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full w-8 h-8 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }

  if (error || !cartData) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-96 p-4">
          <ShoppingCart size={64} className="text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Lỗi tải giỏ hàng</h2>
          <p className="text-gray-500 text-center mb-6">{error}</p>
          <Button onClick={() => navigate('/shop')}>
            Quay về cửa hàng
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const totalAmount = cartData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const sharedDate = new Date(cartData.timestamp);

  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center space-x-3 mb-2">
            <User size={20} className="text-gray-600" />
            <h1 className="text-xl font-bold">Giỏ hàng được chia sẻ</h1>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock size={16} className="mr-1" />
            Được chia sẻ lúc {sharedDate.toLocaleDateString('vi-VN')} {sharedDate.toLocaleTimeString('vi-VN')}
          </div>
        </div>

        {/* Shared Cart Items */}
        <div className="p-4 space-y-4">
          {cartData.items.map((item: any, index: number) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <ShoppingCart size={24} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm mb-1">{item.name}</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {item.size}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.color}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">{formatPrice(item.price)}</span>
                      <span className="text-sm text-gray-500">x{item.quantity}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t p-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Tổng sản phẩm:</span>
              <span>{cartData.items.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Tổng số lượng:</span>
              <span>{cartData.items.reduce((sum: number, item: any) => sum + item.quantity, 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Tổng cộng:</span>
              <span className="text-primary">{formatPrice(totalAmount)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Button className="w-full" onClick={addToMyCart}>
              Thêm tất cả vào giỏ hàng
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/shop')}>
              Tiếp tục mua sắm
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};
