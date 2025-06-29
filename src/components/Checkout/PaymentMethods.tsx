import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface PaymentMethodsProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
}

export const PaymentMethods = ({ paymentMethod, setPaymentMethod }: PaymentMethodsProps) => {
  const paymentOptions = [
    {
      id: 'COD',
      name: 'Thanh toán khi nhận hàng (COD)',
      description: 'Thanh toán bằng tiền mặt khi nhận hàng',
      icon: '💵',
      popular: true
    },
    {
      id: 'VNPay',
      name: 'VNPay',
      description: 'Thanh toán qua VNPay (ATM, Visa, MasterCard)',
      icon: '💳',
      popular: false
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>💳</span>
          <span>Phương thức thanh toán</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
          <div className="space-y-3">
            {paymentOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <RadioGroupItem value={option.id} id={option.id} />
                <div className="flex-1">
                  <Label htmlFor={option.id} className="flex items-center space-x-3 cursor-pointer">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{option.name}</span>
                        {option.popular && (
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                            Phổ biến
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>

        {paymentMethod === 'VNPay' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-blue-600">ℹ️</span>
              <span className="font-medium text-blue-800">Thông tin thanh toán VNPay</span>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Hỗ trợ thẻ ATM nội địa, Visa, MasterCard</li>
              <li>• Giao dịch được bảo mật 100%</li>
              <li>• Phí giao dịch: 0đ</li>
              <li>• Bạn sẽ được chuyển đến trang VNPay để thanh toán</li>
            </ul>
          </div>
        )}

        {paymentMethod === 'COD' && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-green-600">✅</span>
              <span className="font-medium text-green-800">Thanh toán khi nhận hàng</span>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Thanh toán bằng tiền mặt cho shipper</li>
              <li>• Được kiểm tra hàng trước khi thanh toán</li>
              <li>• Phí COD: 0đ</li>
              <li>• Áp dụng cho đơn hàng dưới 5.000.000đ</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};