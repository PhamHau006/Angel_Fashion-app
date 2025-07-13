import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MobileLayout } from '../components/Layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Package, ArrowLeft, Home, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const PaymentResultPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);

  // Extract payment result data from URL parameters
  useEffect(() => {
    const extractPaymentData = () => {
      const status = searchParams.get('status');
      const orderId = searchParams.get('orderId');
      const message = searchParams.get('message');
      const error = searchParams.get('error');
      const amount = searchParams.get('amount');
      const transactionNo = searchParams.get('transactionNo');
      const payDate = searchParams.get('payDate');
      const vnpResponseCode = searchParams.get('vnp_ResponseCode');
      const vnpTransactionStatus = searchParams.get('vnp_TransactionStatus');
      const timestamp = searchParams.get('timestamp');

      console.log('💰 Payment Result Page - URL Params:', {
        status, orderId, message, error, amount, transactionNo, payDate,
        vnpResponseCode, vnpTransactionStatus, timestamp
      });

      if (status && orderId) {
        const data = {
          status,
          orderId: parseInt(orderId),
          message: decodeURIComponent(message || ''),
          error: error ? decodeURIComponent(error) : null,
          amount: amount ? parseFloat(amount) : null,
          transactionNo,
          payDate,
          vnpResponseCode,
          vnpTransactionStatus,
          timestamp: timestamp ? parseInt(timestamp) : Date.now()
        };

        setPaymentData(data);
        
        // Clear URL parameters to prevent re-processing
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        // Clear any pending payment info from localStorage
        localStorage.removeItem('vnpay_payment_info');
        
        // Show appropriate toast notification
        showResultNotification(data);
      } else {
        // No payment data found, redirect to orders
        console.warn('⚠️ No payment data found in URL, redirecting to orders');
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      }

      setIsLoading(false);
    };

    extractPaymentData();
  }, [searchParams, navigate]);

  const showResultNotification = (data) => {
    if (data.status === 'success') {
      toast({
        title: '✅ Thanh toán thành công!',
        description: `Đơn hàng #${data.orderId} đã được thanh toán thành công`,
        duration: 5000,
      });
    } else if (data.status === 'failed') {
      toast({
        title: '❌ Thanh toán thất bại',
        description: data.error || data.message || 'Giao dịch không thành công',
        variant: 'destructive',
        duration: 5000,
      });
    } else {
      toast({
        title: '⚠️ Có vấn đề xảy ra',
        description: data.message || 'Trạng thái thanh toán không xác định',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price);
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('vi-VN');
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'Thanh toán thành công!',
          description: 'Đơn hàng của bạn đã được xác nhận và sẽ được xử lý sớm nhất.'
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Thanh toán thất bại',
          description: 'Giao dịch không thành công. Bạn có thể thử lại hoặc chọn phương thức khác.'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Trạng thái không xác định',
          description: 'Vui lòng kiểm tra lại trạng thái đơn hàng trong phần "Đơn hàng của tôi".'
        };
    }
  };

  const handleGoToOrders = () => {
    navigate('/orders');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleTryAgain = () => {
    navigate('/cart');
  };

  if (isLoading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Đang xử lý kết quả thanh toán...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (!paymentData) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="container mx-auto p-4 max-w-md">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-yellow-800 mb-2">
                Không tìm thấy thông tin thanh toán
              </h2>
              <p className="text-yellow-700 mb-4">
                Không có dữ liệu thanh toán. Đang chuyển đến trang đơn hàng...
              </p>
              <Button onClick={handleGoToOrders} className="w-full">
                Xem đơn hàng của tôi
              </Button>
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  const statusConfig = getStatusConfig(paymentData.status);
  const StatusIcon = statusConfig.icon;

  return (
    <MobileLayout showBottomNav={false}>
      <div className="pb-20">
        {/* Header */}
        <div className="bg-white sticky top-0 z-40 border-b p-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={handleGoHome}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold">Kết quả thanh toán</h1>
          </div>
        </div>

        <div className="container mx-auto p-4 max-w-md space-y-4">
          {/* Status Card */}
          <Card className={`${statusConfig.borderColor} ${statusConfig.bgColor}`}>
            <CardContent className="p-6 text-center">
              <StatusIcon className={`h-20 w-20 ${statusConfig.color} mx-auto mb-4`} />
              <h2 className={`text-2xl font-bold ${statusConfig.color} mb-2`}>
                {statusConfig.title}
              </h2>
              <p className={`${statusConfig.color} opacity-80 mb-4`}>
                {statusConfig.description}
              </p>
              
              {paymentData.message && paymentData.message !== statusConfig.description && (
                <p className={`text-sm ${statusConfig.color} opacity-70`}>
                  {paymentData.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Order Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package size={20} />
                <span>Chi tiết đơn hàng</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Mã đơn hàng:</span>
                <Badge variant="outline" className="font-mono">
                  #{paymentData.orderId}
                </Badge>
              </div>
              
              {paymentData.amount && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className="font-bold text-lg">
                    {formatPrice(paymentData.amount)}
                  </span>
                </div>
              )}
              
              {paymentData.transactionNo && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mã giao dịch:</span>
                  <span className="font-mono text-sm">
                    {paymentData.transactionNo}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Thời gian:</span>
                <span className="text-sm">
                  {formatDateTime(paymentData.timestamp)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Phương thức:</span>
                <Badge variant="secondary">VNPay</Badge>
              </div>

              {paymentData.status === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                  <p className="text-green-800 text-sm font-medium">
                    ✅ Thanh toán đã được xác nhận
                  </p>
                  <p className="text-green-700 text-xs mt-1">
                    Đơn hàng của bạn đang được chuẩn bị và sẽ sớm được giao đến bạn.
                  </p>
                </div>
              )}

              {paymentData.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                  <p className="text-red-800 text-sm font-medium">
                    ❌ Lý do thất bại:
                  </p>
                  <p className="text-red-700 text-xs mt-1">
                    {paymentData.error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* VNPay Response Details (for debugging in development) */}
          {(paymentData.vnpResponseCode || paymentData.vnpTransactionStatus) && (
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">
                  Thông tin VNPay
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {paymentData.vnpResponseCode && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Response Code:</span>
                    <span className="font-mono">{paymentData.vnpResponseCode}</span>
                  </div>
                )}
                {paymentData.vnpTransactionStatus && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transaction Status:</span>
                    <span className="font-mono">{paymentData.vnpTransactionStatus}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {paymentData.status === 'success' && (
              <>
                <Button 
                  onClick={handleGoToOrders} 
                  className="w-full"
                  size="lg"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Xem đơn hàng của tôi
                </Button>
                <Button 
                  onClick={handleGoHome} 
                  variant="outline" 
                  className="w-full"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Về trang chủ
                </Button>
              </>
            )}

            {paymentData.status === 'failed' && (
              <>
                <Button 
                  onClick={handleTryAgain} 
                  className="w-full"
                  size="lg"
                >
                  Thử lại thanh toán
                </Button>
                <Button 
                  onClick={handleGoToOrders} 
                  variant="outline" 
                  className="w-full"
                  size="lg"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Xem đơn hàng của tôi
                </Button>
                <Button 
                  onClick={handleGoHome} 
                  variant="ghost" 
                  className="w-full"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Về trang chủ
                </Button>
              </>
            )}

            {paymentData.status !== 'success' && paymentData.status !== 'failed' && (
              <>
                <Button 
                  onClick={handleGoToOrders} 
                  className="w-full"
                  size="lg"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Kiểm tra đơn hàng
                </Button>
                <Button 
                  onClick={handleGoHome} 
                  variant="outline" 
                  className="w-full"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Về trang chủ
                </Button>
              </>
            )}
          </div>

          {/* Additional Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="text-blue-600 mt-1">
                  ℹ️
                </div>
                <div className="text-blue-800 text-sm">
                  <p className="font-medium mb-1">Thông tin hữu ích:</p>
                  <ul className="text-xs space-y-1 text-blue-700">
                    <li>• Bạn có thể theo dõi trạng thái đơn hàng trong phần "Đơn hàng của tôi"</li>
                    <li>• Nếu có vấn đề, vui lòng liên hệ bộ phận chăm sóc khách hàng</li>
                    <li>• Đơn hàng sẽ được xử lý trong vòng 24h làm việc</li>
                    {paymentData.status === 'success' && (
                      <li>• Bạn sẽ nhận được email xác nhận đơn hàng</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
};