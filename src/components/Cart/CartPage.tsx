import React, { useState } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRShareCart } from './QRShareCart';

export const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Áo thun Angel Basic White',
      price: 299000,
      originalPrice: 399000,
      image: '/placeholder.svg',
      size: 'M',
      color: 'Trắng',
      quantity: 2,
    },
    {
      id: 2,
      name: 'Váy Angel Summer Pink',
      price: 599000,
      originalPrice: 799000,
      image: '/placeholder.svg',
      size: 'S',
      color: 'Hồng',
      quantity: 1,
    },
  ]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 30000;
  const total = subtotal + shipping;

  if (cartItems.length === 0) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-96 p-4">
          <ShoppingBag size={64} className="text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Giỏ hàng trống</h2>
          <p className="text-gray-500 text-center mb-6">
            Hãy thêm sản phẩm bạn yêu thích vào giỏ hàng
          </p>
          <Button onClick={() => navigate('/shop')}>
            Tiếp tục mua sắm
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="pb-32">
        {/* Header */}
        <div className="bg-white sticky top-0 z-40 border-b p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Giỏ hàng ({cartItems.length})</h1>
            <QRShareCart cartItems={cartItems} />
          </div>
        </div>

        {/* Cart Items */}
        <div className="p-4 space-y-4">
          {cartItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex space-x-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
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
                      <div>
                        <span className="font-bold text-primary">{formatPrice(item.price)}</span>
                        {item.originalPrice && (
                          <span className="text-xs text-gray-500 line-through ml-2">
                            {formatPrice(item.originalPrice)}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                  <span className="font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t p-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Phí vận chuyển:</span>
              <span>{formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Tổng cộng:</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
          </div>
          <Button className="w-full" onClick={() => navigate('/checkout')}>
            Thanh toán
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};
