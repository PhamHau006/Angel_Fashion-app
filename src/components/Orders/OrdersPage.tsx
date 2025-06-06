
import React, { useState } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Package, Truck, CheckCircle, XCircle, Clock, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const OrdersPage = () => {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const orders = [
    {
      id: 'ORD001',
      date: '2024-06-01',
      status: 'delivered',
      total: 897000,
      items: [
        { name: 'Áo thun Angel Basic White', quantity: 2, price: 299000, image: '/placeholder.svg' },
        { name: 'Váy Angel Summer Pink', quantity: 1, price: 599000, image: '/placeholder.svg' }
      ]
    },
    {
      id: 'ORD002',
      date: '2024-06-02',
      status: 'shipping',
      total: 449000,
      items: [
        { name: 'Quần jeans Angel Slim Blue', quantity: 1, price: 419000, image: '/placeholder.svg' }
      ]
    },
    {
      id: 'ORD003',
      date: '2024-06-03',
      status: 'processing',
      total: 359000,
      items: [
        { name: 'Áo khoác Angel Casual', quantity: 1, price: 329000, image: '/placeholder.svg' }
      ]
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'processing':
        return { label: 'Đang xử lý', color: 'bg-yellow-500', icon: Clock };
      case 'shipping':
        return { label: 'Đang giao', color: 'bg-blue-500', icon: Truck };
      case 'delivered':
        return { label: 'Đã giao', color: 'bg-green-500', icon: CheckCircle };
      case 'cancelled':
        return { label: 'Đã hủy', color: 'bg-red-500', icon: XCircle };
      default:
        return { label: 'Chờ xác nhận', color: 'bg-gray-500', icon: Package };
    }
  };

  const cancelReasons = [
    'Tôi đổi ý không muốn mua nữa',
    'Tìm được sản phẩm tương tự với giá tốt hơn',
    'Thời gian giao hàng quá lâu',
    'Tôi đặt nhầm sản phẩm/số lượng',
    'Lý do khác'
  ];

  const handleCancelOrder = (order: any) => {
    setSelectedOrder(order);
  };

  const confirmCancelOrder = () => {
    if (!cancelReason || (cancelReason === 'Lý do khác' && !customReason)) {
      toast({
        title: "Vui lòng chọn lý do hủy đơn",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Hủy đơn hàng thành công",
      description: `Đơn hàng ${selectedOrder?.id} đã được hủy`,
    });

    setSelectedOrder(null);
    setCancelReason('');
    setCustomReason('');
  };

  const filterOrders = (status?: string) => {
    if (!status) return orders;
    return orders.filter(order => order.status === status);
  };

  const OrderCard = ({ order }: { order: any }) => {
    const statusInfo = getStatusInfo(order.status);
    const StatusIcon = statusInfo.icon;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-sm">Đơn hàng #{order.id}</CardTitle>
              <p className="text-xs text-gray-500">{order.date}</p>
            </div>
            <Badge className={`${statusInfo.color} text-white`}>
              <StatusIcon size={12} className="mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {order.items.map((item: any, index: number) => (
            <div key={index} className="flex items-center space-x-3 mb-3">
              <img
                src={item.image}
                alt={item.name}
                className="w-12 h-12 object-cover rounded"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">x{item.quantity}</p>
              </div>
              <span className="text-sm font-medium">{formatPrice(item.price)}</span>
            </div>
          ))}
          
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">Tổng cộng:</span>
              <span className="font-bold text-primary">{formatPrice(order.total)}</span>
            </div>
            
            <div className="flex space-x-2">
              {order.status === 'processing' && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleCancelOrder(order)}
                    >
                      Hủy đơn hàng
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Hủy đơn hàng #{order.id}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn hàng này:
                      </p>
                      <RadioGroup value={cancelReason} onValueChange={setCancelReason}>
                        {cancelReasons.map((reason) => (
                          <div key={reason} className="flex items-center space-x-2">
                            <RadioGroupItem value={reason} id={reason} />
                            <Label htmlFor={reason} className="text-sm">{reason}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                      
                      {cancelReason === 'Lý do khác' && (
                        <Textarea
                          placeholder="Nhập lý do cụ thể..."
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                        />
                      )}
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" className="flex-1" onClick={() => setSelectedOrder(null)}>
                          Hủy
                        </Button>
                        <Button className="flex-1" onClick={confirmCancelOrder}>
                          Xác nhận hủy đơn
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              {order.status === 'delivered' && (
                <Button variant="outline" size="sm" className="flex-1">
                  <Star size={14} className="mr-1" />
                  Đánh giá
                </Button>
              )}
              
              <Button variant="default" size="sm" className="flex-1">
                Xem chi tiết
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MobileLayout>
      <div className="pb-20">
        <div className="bg-white sticky top-0 z-40 border-b p-4">
          <h1 className="text-xl font-bold">Đơn hàng của tôi</h1>
        </div>

        <div className="p-4">
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="text-xs">Tất cả</TabsTrigger>
              <TabsTrigger value="processing" className="text-xs">Xử lý</TabsTrigger>
              <TabsTrigger value="shipping" className="text-xs">Giao hàng</TabsTrigger>
              <TabsTrigger value="delivered" className="text-xs">Đã giao</TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs">Đã hủy</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </TabsContent>

            <TabsContent value="processing" className="mt-4">
              {filterOrders('processing').map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </TabsContent>

            <TabsContent value="shipping" className="mt-4">
              {filterOrders('shipping').map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </TabsContent>

            <TabsContent value="delivered" className="mt-4">
              {filterOrders('delivered').map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </TabsContent>

            <TabsContent value="cancelled" className="mt-4">
              {filterOrders('cancelled').map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
};
