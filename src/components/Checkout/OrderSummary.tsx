import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Gift, Package } from 'lucide-react';
import { getImageUrl } from '../../config/api';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
  originalPrice?: number;
  savings?: number;
  isCombo?: boolean;
  comboDetails?: Array<{
    id: number;
    tenSanPham: string;
    mauSac: string;
    kichThuoc: string;
    soLuong: number;
    donGia: number;
  }>;
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
  savings?: number;
  formatPrice: (price: number) => string;
}

export const OrderSummary = ({
  cartItems,
  shippingInfo,
  paymentMethod,
  subtotal,
  shipping,
  total,
  savings = 0,
  formatPrice
}: OrderSummaryProps) => {
  const getPaymentMethodName = (method: string) => {
    switch (method.toLowerCase()) {
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
            <div key={item.id} className="relative">
              {/* Item type badge */}
              <div className="absolute top-0 right-0">
                {item.isCombo ? (
                  <Badge className="bg-purple-500 text-white text-xs">
                    <Gift size={10} className="mr-1" />
                    Combo
                  </Badge>
                ) : (
                  <Badge className="bg-blue-500 text-white text-xs">
                    <Package size={10} className="mr-1" />
                    Sản phẩm
                  </Badge>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <img
                  src={getImageUrl(item.image)}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-medium text-sm mb-1 line-clamp-2">{item.name}</h3>
                  
                  {/* Product variants */}
                  {item.size && item.color && (
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {item.size}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.color}
                      </Badge>
                      <span className="text-xs text-gray-500">x{item.quantity}</span>
                    </div>
                  )}

                  {/* Combo details */}
                  {item.comboDetails && item.comboDetails.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-1">
                        Bao gồm {item.comboDetails.length} sản phẩm:
                      </p>
                      <div className="space-y-1">
                        {item.comboDetails.slice(0, 3).map((comboItem, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            • {comboItem.tenSanPham} ({comboItem.mauSac}, {comboItem.kichThuoc}) x{comboItem.soLuong}
                          </div>
                        ))}
                        {item.comboDetails.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{item.comboDetails.length - 3} sản phẩm khác
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-right">
                    <span className="font-bold text-primary">{formatPrice(item.price * item.quantity)}</span>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <div className="text-xs text-gray-500 line-through">
                        {formatPrice(item.originalPrice * item.quantity)}
                      </div>
                    )}
                    {item.savings && item.savings > 0 && (
                      <div className="text-xs text-green-600">
                        Tiết kiệm {formatPrice(item.savings * item.quantity)}
                      </div>
                    )}
                  </div>
                </div>
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
                {shippingInfo.address}
                {shippingInfo.ward && `, ${shippingInfo.ward}`}
                {shippingInfo.district && `, ${shippingInfo.district}`}
                {shippingInfo.city && `, ${shippingInfo.city}`}
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
              {paymentMethod.toLowerCase() === 'cod' ? '💵' : '💳'}
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
            {savings > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Tiết kiệm:</span>
                <span>-{formatPrice(savings)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Phí vận chuyển:</span>
              <span className={shipping === 0 ? 'text-green-600' : ''}>
                {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
              </span>
            </div>
            {shipping === 0 && subtotal > 500000 && (
              <div className="text-xs text-green-600">
                🎉 Miễn phí vận chuyển cho đơn hàng trên 500k!
              </div>
            )}
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