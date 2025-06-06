
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

interface ShippingInfo {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  note: string;
}

interface OrderSummaryProps {
  cartItems: CartItem[];
  shippingInfo: ShippingInfo;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  total: number;
  formatPrice: (price: number) => string;
}

export const OrderSummary = ({
  cartItems,
  shippingInfo,
  paymentMethod,
  subtotal,
  shipping,
  total,
  formatPrice
}: OrderSummaryProps) => {
  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'cod':
        return 'Thanh toán khi nhận hàng (COD)';
      case 'vnpay':
        return 'VNPay';
      default:
        return method;
    }
  };

  return (
    <div className="space-y-4">
      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🛍️</span>
            <span>Sản phẩm đặt hàng ({cartItems.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex space-x-3">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-medium text-sm mb-1">{item.name}</h3>
                <div className="flex items-center space-x-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {item.size}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {item.color}
                  </Badge>
                  <span className="text-xs text-gray-500">x{item.quantity}</span>
                </div>
                <span className="font-bold text-primary">{formatPrice(item.price * item.quantity)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Shipping Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📍</span>
            <span>Thông tin giao hàng</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Người nhận:</span>
              <span className="font-medium">{shippingInfo.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Số điện thoại:</span>
              <span className="font-medium">{shippingInfo.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Địa chỉ:</span>
              <span className="font-medium text-right">
                {shippingInfo.address}, {shippingInfo.ward}, {shippingInfo.district}, {shippingInfo.city}
              </span>
            </div>
            {shippingInfo.note && (
              <div className="flex justify-between">
                <span className="text-gray-600">Ghi chú:</span>
                <span className="font-medium text-right">{shippingInfo.note}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>💳</span>
            <span>Phương thức thanh toán</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">
              {paymentMethod === 'cod' ? '💵' : '💳'}
            </span>
            <span className="font-medium">{getPaymentMethodName(paymentMethod)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>📊</span>
            <span>Tổng kết đơn hàng</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Phí vận chuyển:</span>
              <span>{formatPrice(shipping)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Tổng cộng:</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
