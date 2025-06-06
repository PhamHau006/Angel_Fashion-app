
import React, { useState } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, CreditCard, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ShippingForm } from './ShippingForm';
import { PaymentMethods } from './PaymentMethods';
import { OrderSummary } from './OrderSummary';
import { useToast } from '@/hooks/use-toast';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    note: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock cart data
  const cartItems = [
    {
      id: 1,
      name: 'Áo thun Angel Basic White',
      price: 299000,
      quantity: 2,
      size: 'M',
      color: 'Trắng',
      image: '/placeholder.svg'
    },
    {
      id: 2,
      name: 'Váy Angel Summer Pink',
      price: 599000,
      quantity: 1,
      size: 'S',
      color: 'Hồng',
      image: '/placeholder.svg'
    }
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = 30000;
  const total = subtotal + shipping;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate shipping info
      if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.address) {
        toast({
          title: "Thông tin chưa đầy đủ",
          description: "Vui lòng điền đầy đủ thông tin giao hàng",
          variant: "destructive"
        });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/cart');
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    try {
      if (paymentMethod === 'vnpay') {
        // Simulate VNPay payment process
        const vnpayUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?` +
          `vnp_Version=2.1.0&` +
          `vnp_Command=pay&` +
          `vnp_TmnCode=DEMO123&` +
          `vnp_Amount=${total * 100}&` +
          `vnp_CurrCode=VND&` +
          `vnp_TxnRef=${Date.now()}&` +
          `vnp_OrderInfo=Thanh toan don hang Angel Fashion&` +
          `vnp_OrderType=other&` +
          `vnp_Locale=vn&` +
          `vnp_ReturnUrl=${window.location.origin}/orders&` +
          `vnp_IpAddr=127.0.0.1&` +
          `vnp_CreateDate=${new Date().toISOString().replace(/[-:]/g, '').slice(0, 14)}`;
        
        // In a real app, you would redirect to VNPay
        toast({
          title: "Chuyển hướng đến VNPay",
          description: "Đang chuyển hướng đến trang thanh toán VNPay...",
        });
        
        // Simulate redirect delay
        setTimeout(() => {
          window.open(vnpayUrl, '_blank');
          navigate('/orders');
        }, 2000);
      } else {
        // COD payment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toast({
          title: "Đặt hàng thành công!",
          description: "Đơn hàng của bạn đã được xác nhận. Cảm ơn bạn đã mua sắm tại Angel Fashion!",
        });
        
        navigate('/orders');
      }
    } catch (error) {
      toast({
        title: "Đặt hàng thất bại",
        description: "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { number: 1, title: 'Thông tin giao hàng', icon: MapPin },
    { number: 2, title: 'Phương thức thanh toán', icon: CreditCard },
    { number: 3, title: 'Xác nhận đơn hàng', icon: Truck }
  ];

  return (
    <MobileLayout showBottomNav={false}>
      <div className="pb-32">
        {/* Header */}
        <div className="bg-white sticky top-0 z-40 border-b p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePreviousStep}
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold">Thanh toán</h1>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white p-4 border-b">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isActive ? 'bg-primary text-white' :
                    isCompleted ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? '✓' : <Icon size={16} />}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <div className={`text-sm font-medium ${
                      isActive ? 'text-primary' :
                      isCompleted ? 'text-green-500' :
                      'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Step 1: Shipping Information */}
          {currentStep === 1 && (
            <ShippingForm
              shippingInfo={shippingInfo}
              setShippingInfo={setShippingInfo}
            />
          )}

          {/* Step 2: Payment Method */}
          {currentStep === 2 && (
            <PaymentMethods
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
            />
          )}

          {/* Step 3: Order Summary */}
          {currentStep === 3 && (
            <OrderSummary
              cartItems={cartItems}
              shippingInfo={shippingInfo}
              paymentMethod={paymentMethod}
              subtotal={subtotal}
              shipping={shipping}
              total={total}
              formatPrice={formatPrice}
            />
          )}
        </div>

        {/* Bottom Action */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-bold">Tổng cộng:</span>
            <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
          </div>
          
          {currentStep < 3 ? (
            <Button className="w-full" onClick={handleNextStep}>
              Tiếp tục
            </Button>
          ) : (
            <Button 
              className="w-full" 
              onClick={handlePlaceOrder}
              disabled={isProcessing}
            >
              {isProcessing ? 'Đang xử lý...' : 
               paymentMethod === 'vnpay' ? 'Thanh toán VNPay' : 'Đặt hàng'}
            </Button>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};
