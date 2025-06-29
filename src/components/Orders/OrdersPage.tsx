import React, { useState, useEffect } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShoppingBag, 
  FileText, 
  MapPin, 
  DollarSign, 
  Calendar, 
  User,
  Phone,
  Copy,
  CreditCard,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../../config/api';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

interface OrderItem {
  tenSanPham?: string;
  tenCombo?: string;
  bienThe?: string;
  soLuong: number;
  gia: number;
  giamGia?: number;
  giaGoc?: number;
  maCtsp?: number;
  maCombo?: number;
  tenHinhAnh?: string;
}

interface ComboDetail {
  tenSanPham: string;
  mauSac: string;
  kichThuoc: string;
  soLuong: number;
  donGia: number;
  maCtsp: number;
  maCombo: number;
  tenHinhAnh?: string;
}

interface Order {
  maHd: number;
  maKh: number;
  tenKh?: string;
  maNv?: number;
  tenNv?: string;
  maCode?: string;
  ngayNhan?: string;
  ngayTao: string;
  ngayThanhToan?: string;
  batDauGiao?: string;
  diaChiNhanHang: string;
  hinhThucTt: string;
  tinhTrang: string;
  moTa?: string;
  hoTen: string;
  sdt: string;
  lyDoHuy?: string;
  phiVanChuyen: number;
  tienGoc: number;
  giamGiaCoupon: number;
  cthoadons: OrderItem[];
  chitietcombohoadons: ComboDetail[];
}

export const OrdersPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const apiUrl = getApiUrl();

  const statusOptions = [
    'Chờ xác nhận',
    'Đã xác nhận',
    'Đã giao cho đơn vị vận chuyển',
    'Đã nhận',
    'Đã thanh toán',
    'Đã hủy',
    'Hoàn trả/Hoàn tiền',
    'Đang xử lý VNPAY',
  ];

  const formatCurrency = (val: number) =>
    val?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'chờ xác nhận':
        return { label: 'Chờ xác nhận', color: 'bg-gray-500', icon: Package };
      case 'đã xác nhận':
      case 'đang xử lý vnpay':
        return { label: status, color: 'bg-yellow-500', icon: Clock };
      case 'đã giao cho đơn vị vận chuyển':
        return { label: 'Đang giao', color: 'bg-blue-500', icon: Truck };
      case 'đã nhận':
      case 'đã thanh toán':
        return { label: 'Đã giao', color: 'bg-green-500', icon: CheckCircle };
      case 'đã hủy':
      case 'hoàn trả/hoàn tiền':
        return { label: status, color: 'bg-red-500', icon: XCircle };
      default:
        return { label: status, color: 'bg-gray-500', icon: Package };
    }
  };

  // Create timeline for order progress
  const createOrderTimeline = (order: Order) => {
    const timeline = [
      {
        step: 1,
        title: 'Đặt hàng',
        description: 'Đơn hàng đã được đặt thành công',
        time: formatDate(order.ngayTao),
        status: 'completed'
      },
      {
        step: 2,
        title: 'Xác nhận',
        description: 'Đơn hàng đã được xác nhận và đang chuẩn bị',
        time: order.tinhTrang !== 'Chờ xác nhận' ? formatDate(order.ngayTao) : '',
        status: order.tinhTrang === 'Chờ xác nhận' ? 'pending' : 'completed'
      },
      {
        step: 3,
        title: 'Đóng gói',
        description: 'Sản phẩm đã được đóng gói',
        time: ['Đã giao cho đơn vị vận chuyển', 'Đã nhận', 'Đã thanh toán'].includes(order.tinhTrang) ? formatDate(order.batDauGiao) : '',
        status: ['Đã giao cho đơn vị vận chuyển', 'Đã nhận', 'Đã thanh toán'].includes(order.tinhTrang) ? 'completed' : 'pending'
      },
      {
        step: 4,
        title: 'Vận chuyển',
        description: 'Đơn hàng đang được vận chuyển',
        time: order.tinhTrang === 'Đã giao cho đơn vị vận chuyển' ? formatDate(order.batDauGiao) : '',
        status: order.tinhTrang === 'Đã giao cho đơn vị vận chuyển' ? 'current' : 
                ['Đã nhận', 'Đã thanh toán'].includes(order.tinhTrang) ? 'completed' : 'pending'
      },
      {
        step: 5,
        title: 'Đã giao',
        description: 'Đơn hàng đã được giao thành công',
        time: ['Đã nhận', 'Đã thanh toán'].includes(order.tinhTrang) ? formatDate(order.ngayNhan) : '',
        status: ['Đã nhận', 'Đã thanh toán'].includes(order.tinhTrang) ? 'completed' : 'pending'
      }
    ];

    // Handle cancelled orders
    if (['Đã hủy', 'Hoàn trả/Hoàn tiền'].includes(order.tinhTrang)) {
      return timeline.map((item, index) => ({
        ...item,
        status: index === 0 ? 'completed' : 'cancelled'
      }));
    }

    return timeline;
  };

  const getStepIcon = (step: number, status: string) => {
    const iconProps = { size: 20 };
    
    if (status === 'cancelled') return <XCircle {...iconProps} />;
    
    switch (step) {
      case 1:
        return <CheckCircle {...iconProps} />;
      case 2:
        return <CheckCircle {...iconProps} />;
      case 3:
        return <Package {...iconProps} />;
      case 4:
        return <Truck {...iconProps} />;
      case 5:
        return <CheckCircle {...iconProps} />;
      default:
        return <Clock {...iconProps} />;
    }
  };

  const getProgressValue = (order: Order) => {
    const timeline = createOrderTimeline(order);
    const currentStep = timeline.findIndex(item => item.status === 'current') + 1;
    const completedSteps = timeline.filter(item => item.status === 'completed').length;
    
    if (currentStep > 0) {
      return (currentStep / timeline.length) * 100;
    }
    return (completedSteps / timeline.length) * 100;
  };

  const copyTrackingCode = () => {
    if (selectedOrder?.maCode) {
      navigator.clipboard.writeText(selectedOrder.maCode);
      toast({
        title: "Đã sao chép",
        description: "Mã vận đơn đã được sao chép vào clipboard",
      });
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('No token found');
      const decoded: any = jwtDecode(accessToken);
      const maKh = decoded.sub || decoded.IdUser;

      const response = await axios.get(`${apiUrl}/api/CustomerOrders/${maKh}`, {
        params: { search, filter, page },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log('API response:', response.data); // Debug
      setOrders(response.data.data || []);
      setTotalPage(response.data.toTalPage || 1);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách đơn hàng', variant: 'destructive' });
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (order: Order) => {
    if (!cancelReason.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập lý do hủy', variant: 'destructive' });
      return;
    }
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('No token found');

      const content = {
        id: order.maHd,
        selectedCancelStatus: order.tinhTrang.toLowerCase() === 'chờ xác nhận' ? 'Đã hủy' : 'Hoàn trả/Hoàn tiền',
        reasonCancel: cancelReason,
      };

      const response = await axios.post(`${apiUrl}/api/CustomerOrders`, content, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success) {
        toast({
          title: 'Hủy đơn hàng thành công',
          description: `Đơn hàng #${order.maHd} đã được hủy`,
        });
        fetchOrders();
      } else {
        throw new Error(response.data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Lỗi',
        description: (error as Error).message || 'Không thể hủy đơn hàng',
        variant: 'destructive',
      });
    }
  };

  const openCancelModal = (order: Order) => {
    setOrderToCancel(order);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setOrderToCancel(null);
    setCancelReason('');
  };

  const confirmCancelOrder = async () => {
    if (orderToCancel) {
      await cancelOrder(orderToCancel);
      closeCancelModal();
    }
  };

  const filterOrders = (status?: string) => {
    if (!status) return orders;
    return orders.filter((order) => order.tinhTrang.toLowerCase() === status.toLowerCase());
  };

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const handleFilter = () => {
    setPage(1);
    fetchOrders();
  };

  const changePage = (p: number) => {
    if (p !== page && p >= 1 && p <= totalPage) {
      setPage(p);
      fetchOrders();
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  const OrderCard = ({ order }: { order: Order }) => {
    const statusInfo = getStatusInfo(order.tinhTrang);
    const StatusIcon = statusInfo.icon;

    return (
      <Card className="mb-4 border-0 shadow-sm hover:shadow-md transition-shadow bg-white rounded-lg">
        <CardHeader className="pb-3 bg-gradient-to-r from-pink-50 to-white rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-sm font-semibold text-gray-800">Đơn hàng #{order.maHd}</CardTitle>
              <p className="text-xs text-gray-500">{formatDate(order.ngayTao)}</p>
            </div>
            <Badge className={`${statusInfo.color} text-white font-medium`}>
              <StatusIcon size={12} className="mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {(order.cthoadons || []).map((item, index) => (
            <div key={index} className="flex items-center space-x-3 mb-3 border-b pb-2 last:border-b-0">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.tenSanPham || item.tenCombo}</p>
                {item.bienThe && <p className="text-xs text-gray-500">{item.bienThe}</p>}
                <p className="text-xs text-gray-500">x{item.soLuong}</p>
              </div>
              <span className="text-sm font-medium text-gray-800">{formatCurrency(item.gia * item.soLuong)}</span>
            </div>
          ))}
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-gray-800">Tổng cộng:</span>
              <span className="font-bold text-pink-600">{formatCurrency(order.tienGoc + order.phiVanChuyen - order.giamGiaCoupon)}</span>
            </div>
            <div className="flex space-x-2">
              {(order.tinhTrang.toLowerCase() === 'chờ xác nhận' ||
                (order.tinhTrang.toLowerCase() === 'đã thanh toán' &&
                  order.ngayThanhToan &&
                  Date.now() - new Date(order.ngayThanhToan).getTime() <= 3 * 24 * 60 * 60 * 1000)) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50"
                  onClick={() => openCancelModal(order)}
                >
                  Hủy/Hoàn trả
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
                onClick={() => setSelectedOrder(order)}
              >
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
      <div className="pb-20 bg-gray-50">
        <div className="bg-white sticky top-0 z-40 border-b p-4 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800">Đơn hàng của tôi</h1>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[120px]">
              <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-pink-600 font-semibold">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <>
              <Tabs defaultValue="all">
                <TabsList className="grid w-full grid-cols-5 bg-white border rounded-lg p-1">
                  <TabsTrigger value="all" className="text-xs data-[state=active]:bg-pink-100 data-[state=active]:text-pink-600">Tất cả</TabsTrigger>
                  <TabsTrigger value="chờ xác nhận" className="text-xs data-[state=active]:bg-pink-100 data-[state=active]:text-pink-600">Chờ xác nhận</TabsTrigger>
                  <TabsTrigger value="đã giao cho đơn vị vận chuyển" className="text-xs data-[state=active]:bg-pink-100 data-[state=active]:text-pink-600">Giao hàng</TabsTrigger>
                  <TabsTrigger value="đã nhận" className="text-xs data-[state=active]:bg-pink-100 data-[state=active]:text-pink-600">Đã giao</TabsTrigger>
                  <TabsTrigger value="đã hủy" className="text-xs data-[state=active]:bg-pink-100 data-[state=active]:text-pink-600">Đã hủy</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  {orders.length === 0 ? (
                    <p className="text-center text-gray-500">Không có đơn hàng nào</p>
                  ) : (
                    orders.map((order) => <OrderCard key={order.maHd} order={order} />)
                  )}
                </TabsContent>
                <TabsContent value="chờ xác nhận" className="mt-4">
                  {filterOrders('chờ xác nhận').map((order) => (
                    <OrderCard key={order.maHd} order={order} />
                  ))}
                </TabsContent>
                <TabsContent value="đã giao cho đơn vị vận chuyển" className="mt-4">
                  {filterOrders('đã giao cho đơn vị vận chuyển').map((order) => (
                    <OrderCard key={order.maHd} order={order} />
                  ))}
                </TabsContent>
                <TabsContent value="đã nhận" className="mt-4">
                  {filterOrders('đã nhận').map((order) => (
                    <OrderCard key={order.maHd} order={order} />
                  ))}
                </TabsContent>
                <TabsContent value="đã hủy" className="mt-4">
                  {filterOrders('đã hủy').map((order) => (
                    <OrderCard key={order.maHd} order={order} />
                  ))}
                </TabsContent>
              </Tabs>
              {totalPage > 1 && (
                <nav className="mt-3">
                  <ul className="flex justify-center space-x-2">
                    <li className={`page-item ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Button variant="outline" size="sm" onClick={() => changePage(page - 1)} disabled={page === 1}>
                        Trước
                      </Button>
                    </li>
                    {Array.from({ length: totalPage }, (_, i) => i + 1).map((p) => (
                      <li key={p} className={`page-item ${p === page ? 'font-bold' : ''}`}>
                        <Button variant={p === page ? 'default' : 'outline'} size="sm" onClick={() => changePage(p)}>
                          {p}
                        </Button>
                      </li>
                    ))}
                    <li className={`page-item ${page === totalPage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Button variant="outline" size="sm" onClick={() => changePage(page + 1)} disabled={page === totalPage}>
                        Sau
                      </Button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>

        {/* Cancel Order Dialog */}
        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent className="bg-white rounded-lg shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-800">Nhập lý do hủy/hoàn trả</DialogTitle>
            </DialogHeader>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              placeholder="Nhập lý do..."
              className="border-gray-300 focus:ring-pink-300 focus:border-pink-300"
            />
            <div className="flex space-x-2 mt-4">
              <Button variant="outline" className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50" onClick={closeCancelModal}>
                Đóng
              </Button>
              <Button className="flex-1 bg-pink-500 hover:bg-pink-600 text-white" onClick={confirmCancelOrder}>
                Xác nhận
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced Order Detail Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          {selectedOrder && (
            <DialogContent className="max-w-[95vw] sm:max-w-4xl bg-white rounded-lg shadow-xl overflow-y-auto max-h-[90vh] p-4">
              <DialogHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-bold text-gray-800 flex items-center">
                    <FileText size={20} className="mr-2 text-pink-500" />
                    Chi tiết đơn hàng #{selectedOrder.maHd}
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedOrder(null)}
                    className="h-8 w-8"
                  >
                    <ArrowLeft size={16} />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">Đặt hàng lúc {formatDate(selectedOrder.ngayTao)}</p>
              </DialogHeader>

              <div className="space-y-6">
                {/* Order Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Trạng thái đơn hàng</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Progress Bar */}
                    <div className="mb-6">
                      <Progress value={getProgressValue(selectedOrder)} className="h-2 mb-2" />
                      <div className="text-xs text-gray-600 text-center">
                        Tiến độ đơn hàng: {Math.round(getProgressValue(selectedOrder))}%
                      </div>
                    </div>

                    {/* Timeline Steps */}
                    <div className="relative">
                      <div className="flex justify-between items-start">
                        {createOrderTimeline(selectedOrder).map((item, index) => (
                          <div key={item.step} className="flex flex-col items-center flex-1 relative">
                            {/* Connection Line */}
                            {index < createOrderTimeline(selectedOrder).length - 1 && (
                              <div 
                                className={`absolute top-5 left-1/2 w-full h-0.5 transform translate-x-1/2 ${
                                  item.status === 'completed' ? 'bg-green-500' : 
                                  item.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-200'
                                }`}
                                style={{ zIndex: 1 }}
                              />
                            )}
                            
                            {/* Icon Circle */}
                            <div 
                              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 relative z-10 ${
                                item.status === 'completed' 
                                  ? 'bg-green-500 border-green-500 text-white' 
                                  : item.status === 'current'
                                  ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                                  : item.status === 'cancelled'
                                  ? 'bg-red-500 border-red-500 text-white'
                                  : 'bg-gray-100 border-gray-300 text-gray-400'
                              }`}
                            >
                              {getStepIcon(item.step, item.status)}
                            </div>
                            
                            {/* Step Info */}
                            <div className="text-center max-w-[80px]">
                              <div className={`font-medium text-xs mb-1 ${
                                item.status === 'completed' ? 'text-green-600' :
                                item.status === 'current' ? 'text-blue-600' :
                                item.status === 'cancelled' ? 'text-red-600' :
                                'text-gray-400'
                              }`}>
                                {item.title}
                              </div>
                              <div className="text-xs text-gray-500 mb-1">
                                {item.description}
                              </div>
                              {item.time && (
                                <div className="text-xs text-gray-400">
                                  {item.time}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tracking Info */}
                    {selectedOrder.tinhTrang === 'Đã giao cho đơn vị vận chuyển' && selectedOrder.maCode && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-blue-800 text-sm">Mã vận đơn:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-blue-600 text-sm">{selectedOrder.maCode}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={copyTrackingCode}
                              className="h-6 w-6"
                            >
                              <Copy size={12} />
                            </Button>
                          </div>
                        </div>
                        {selectedOrder.ngayNhan && (
                          <div className="text-xs text-blue-600">
                            Dự kiến giao hàng: {formatDate(selectedOrder.ngayNhan)}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Shipping Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <MapPin size={16} />
                        <span>Thông tin giao hàng</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User size={14} className="text-gray-500" />
                        <span className="font-medium text-sm">{selectedOrder.hoTen}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone size={14} className="text-gray-500" />
                        <span className="text-sm">{selectedOrder.sdt}</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin size={14} className="text-gray-500 mt-0.5" />
                        <span className="text-sm">{selectedOrder.diaChiNhanHang}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <CreditCard size={16} />
                        <span>Thông tin thanh toán</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Phương thức:</span>
                        <Badge className="bg-pink-100 text-pink-600">{selectedOrder.hinhThucTt}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Tạm tính:</span>
                        <span className="text-sm">{formatCurrency(selectedOrder.tienGoc)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Phí vận chuyển:</span>
                        <span className="text-sm">{formatCurrency(selectedOrder.phiVanChuyen)}</span>
                      </div>
                      {selectedOrder.giamGiaCoupon > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm">Giảm giá:</span>
                          <span className="text-sm text-green-600">-{formatCurrency(selectedOrder.giamGiaCoupon)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span className="text-sm">Tổng cộng:</span>
                        <span className="text-sm text-pink-600">{formatCurrency(selectedOrder.tienGoc + selectedOrder.phiVanChuyen - selectedOrder.giamGiaCoupon)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sản phẩm đã đặt</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Single Products */}
                      {selectedOrder.cthoadons.filter(item => !item.maCombo).map((item, index) => (
                        <div key={`product-${index}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                       
                          <div className="flex-1">
                            <h3 className="font-medium text-sm">{item.tenSanPham}</h3>
                            {item.bienThe && <p className="text-xs text-gray-500">{item.bienThe}</p>}
                            <p className="text-xs text-gray-500">Số lượng: {item.soLuong}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatCurrency(item.gia)}</p>
                            <p className="text-xs text-gray-500">
                              Tổng: {formatCurrency(item.gia * item.soLuong)}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Combo Products */}
                      {selectedOrder.cthoadons.filter(item => item.maCombo).map((comboItem, index) => (
                        <div key={`combo-${index}`} className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-3 mb-2">
                           
                            <div className="flex-1">
                              <h3 className="font-medium text-sm">{comboItem.tenCombo}</h3>
                              <p className="text-xs text-gray-500">Số lượng combo: {comboItem.soLuong}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm">{formatCurrency(comboItem.gia)}</p>
                              <p className="text-xs text-gray-500">
                                Tổng: {formatCurrency(comboItem.gia * comboItem.soLuong)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Combo Details */}
                          <div className="ml-4 space-y-1">
                            <p className="text-xs font-medium text-gray-700">Chi tiết combo:</p>
                            {selectedOrder.chitietcombohoadons
                              .filter(detail => detail.maCombo === comboItem.maCombo)
                              .map((detail, detailIndex) => (
                                <div key={detailIndex} className="flex justify-between text-xs text-gray-600 bg-white p-2 rounded">
                                  <span>• {detail.tenSanPham} ({detail.mauSac}-{detail.kichThuoc})</span>
                                  <span>{detail.soLuong / comboItem.soLuong} sp</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}

                      {/* No items message */}
                      {selectedOrder.cthoadons.length === 0 && (
                        <div className="text-center text-gray-500 py-4">
                          <Package size={32} className="mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">Không có sản phẩm trong đơn hàng</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Cancel Reason (if applicable) */}
                {(selectedOrder.tinhTrang.toLowerCase() === 'đã hủy' || 
                  selectedOrder.tinhTrang.toLowerCase() === 'hoàn trả/hoàn tiền') && 
                  selectedOrder.lyDoHuy && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-base text-red-600">
                        <XCircle size={16} />
                        <span>Lý do hủy/hoàn trả</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg">
                        {selectedOrder.lyDoHuy}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1"
                  >
                    Đóng
                  </Button>
                  {selectedOrder.tinhTrang === 'Đã giao cho đơn vị vận chuyển' && (
                    <Button 
                      variant="outline"
                      className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50"
                    >
                      Liên hệ người bán
                    </Button>
                  )}
                  {(selectedOrder.tinhTrang.toLowerCase() === 'đã nhận' || 
                    selectedOrder.tinhTrang.toLowerCase() === 'đã thanh toán') && (
                    <Button 
                      className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
                    >
                      Đánh giá sản phẩm
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </MobileLayout>
  );
};