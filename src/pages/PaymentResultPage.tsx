// src/pages/PaymentResultPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { MobileLayout } from '../components/Layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export const PaymentResultPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    processPaymentResult();
  }, []);

  const processPaymentResult = async () => {
    try {
      // Get parameters from URL
      const status = searchParams.get('status');
      const vnpResponseCode = searchParams.get('vnp_ResponseCode');
      const vnpTransactionStatus = searchParams.get('vnp_TransactionStatus');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');
      const transactionNo = searchParams.get('transactionNo');
      const message = searchParams.get('message');
      const error = searchParams.get('error');

      console.log('💳 Payment result parameters:', {
        status,
        vnpResponseCode,
        vnpTransactionStatus,
        orderId,
        amount,
        transactionNo,
        message,
        error
      });

      // Determine if payment was successful
      const isSuccess = status === 'success' && vnpResponseCode === '00' && vnpTransactionStatus === '00';

      setResult({
        isSuccess,
        status,
        orderId,
        amount: amount ? parseInt(amount) / 100 : 0, // Convert from cents
        transactionNo,
        message: message || (isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'),
        error: error || '',
        vnpResponseCode,
        vnpTransactionStatus
      });

      // Show toast notification
      if (isSuccess) {
        toast({
          title: '✅ Thanh toán thành công!',
          description: `Đơn hàng #${orderId} đã được thanh toán`,
        });
      } else {
        toast({
          title: '❌ Thanh toán thất bại',
          description: getPaymentErrorMessage(vnpResponseCode),
          variant: 'destructive',
        });
      }

    } catch (error) {
      console.error('❌ Error processing payment result:', error);
      setResult({
        isSuccess: false,
        status: 'error',
        message: 'Lỗi xử lý kết quả thanh toán',
        error: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentErrorMessage = (responseCode: string): string => {
    const errorMessages: { [key: string]: string } = {
      '24': 'Giao dịch bị hủy bởi người dùng',
      '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ',
      '10': 'Thông tin thẻ/tài khoản không đúng',
      '11': 'Thẻ/Tài khoản đã hết hạn',
      '12': 'Thẻ/Tài khoản bị khóa',
      '51': 'Tài khoản không đủ số dư',
      '65': 'Vượt quá số lần nhập OTP',
      '75': 'Ngân hàng đang bảo trì',
      '79': 'Giao dịch vượt quá hạn mức',
    };
    
    return errorMessages[responseCode] || 'Giao dịch không thành công';
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const handleGoToOrders = () => {
    navigate('/orders');
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  const handleRetryPayment = () => {
    navigate('/checkout');
  };

  if (isProcessing) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold mb-2">Đang xử lý kết quả thanh toán...</h2>
          <p className="text-gray-600 text-center">Vui lòng đợi trong giây lát</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBottomNav={false}>
      <div className="container mx-auto p-4 max-w-md">
        <Card className="mt-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {result?.isSuccess ? (
                <CheckCircle className="w-16 h-16 text-green-500" />
              ) : (
                <XCircle className="w-16 h-16 text-red-500" />
              )}
            </div>
            <CardTitle className={`text-2xl ${result?.isSuccess ? 'text-green-600' : 'text-red-600'}`}>
              {result?.isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-lg mb-4">{result?.message}</p>
              
              {result?.orderId && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Mã đơn hàng:</span>
                    <span>#{result.orderId}</span>
                  </div>
                  
                  {result?.amount > 0 && (
                    <div className="flex justify-between">
                      <span className="font-medium">Số tiền:</span>
                      <span className="font-bold text-primary">{formatPrice(result.amount)}</span>
                    </div>
                  )}
                  
                  {result?.transactionNo && (
                    <div className="flex justify-between">
                      <span className="font-medium">Mã giao dịch:</span>
                      <span className="text-sm">{result.transactionNo}</span>
                    </div>
                  )}
                </div>
              )}
              
              {result?.error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg mt-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-red-700 text-sm">{result.error}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 mt-6">
              {result?.isSuccess ? (
                <>
                  <Button onClick={handleGoToOrders} className="w-full">
                    Xem đơn hàng của tôi
                  </Button>
                  <Button onClick={handleGoToHome} variant="outline" className="w-full">
                    Về trang chủ
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleRetryPayment} className="w-full">
                    Thử thanh toán lại
                  </Button>
                  <Button onClick={handleGoToHome} variant="outline" className="w-full">
                    Về trang chủ
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
};