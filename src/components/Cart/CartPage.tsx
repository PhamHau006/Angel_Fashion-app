import React, { useState, useEffect } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2, ShoppingBag, Package, Gift, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { QRShareCart } from './QRShareCart';
import { getApiUrl } from '../../config/api';
import { getCurrentCustomerId } from '../../services/cartService';

// Backend interfaces matching your API
interface CartItem {
  id: number;
  maCombo?: number | null;
  maCtsp?: number | null;
  tenSanPham_TenCombo: string;
  maKh: number;
  kichThuoc?: string | null;
  mau?: string | null;
  donGia: number;
  giamGia: number;
  giaTruocKhiGiam: number;
  soLuong: number;
  soLuongToiDa: number;
  tenHinhAnh: string;
  giohangctcombos?: Array<{
    id: number;
    maGioHang: number;
    maCtsp: number;
    tenSanPham: string;
    mauSac: string;
    kichThuoc: string;
    soLuong: number;
    donGia: number;
  }>;
}

const API_URL = getApiUrl();

// Custom getImageUrl trong component với isCombo
const getImageUrl = (imageName: string, isCombo: boolean = false): string => {
  console.log('🔍 getImageUrl input:', { imageName, isCombo }); // Debug
  if (!imageName || imageName === 'placeholder.svg') {
    console.log('🔍 Using placeholder');
    return '/placeholder.svg';
  }
  if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
    console.log('🔍 Using full URL:', imageName);
    return imageName;
  }
  const baseUrl = getApiUrl().replace('/api', ''); // Ví dụ: https://localhost:7217
  const path = isCombo ? '/HinhAnh/AnhCombo' : '/HinhAnh/Products';
  const fullImageUrl = `${baseUrl}${path}/${imageName}`;
  console.log('🔍 Generated URL:', fullImageUrl);
  return fullImageUrl;
};

export const CartPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Format price in VND
  const formatPrice = (price: number) => {
    if (!price || price === 0) {
      return 'Liên hệ';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Fetch cart items from API
  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const customerId = getCurrentCustomerId();
      const token = localStorage.getItem('accessToken');

      if (!token) {
        toast({ title: "Lỗi", description: "Không tìm thấy token, vui lòng đăng nhập lại", variant: "destructive" });
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/Cart/${customerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({ title: "Phiên hết hạn", description: "Vui lòng đăng nhập lại", variant: "destructive" });
          navigate('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Cart items loaded:', data);
      setCartItems(data);
    } catch (error) {
      console.error('❌ Error fetching cart:', error);
      toast({ title: "Lỗi tải giỏ hàng", description: "Vui lòng kiểm tra kết nối hoặc đăng nhập lại", variant: "destructive" });
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh cart manually
  const refreshCart = async () => {
    setRefreshing(true);
    await fetchCartItems();
    setRefreshing(false);
    toast({
      title: "Đã làm mới giỏ hàng",
      description: "Giỏ hàng đã được cập nhật",
    });
  };

  // Remove item from cart
  const removeItem = async (cartItemId: number) => {
    try {
      console.log(`🗑️ Removing cart item: ${cartItemId}`);

      const response = await fetch(`${API_URL}/api/Cart/${cartItemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể xóa sản phẩm');
      }

      const result = await response.json();
      console.log('✅ Item removed:', result);

      // Update UI immediately
      setCartItems(items => items.filter(item => item.id !== cartItemId));

      toast({
        title: "Đã xóa sản phẩm",
        description: result.message || "Sản phẩm đã được xóa khỏi giỏ hàng",
      });
    } catch (error) {
      console.error('❌ Error removing item:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể xóa sản phẩm",
        variant: "destructive"
      });
    }
  };

  // Update quantity (optimistic update for better UX)
  const updateQuantity = async (item: CartItem, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(item.id);
      return;
    }

    if (newQuantity > item.soLuongToiDa) {
      toast({
        title: "Vượt quá số lượng tồn kho",
        description: `Chỉ còn ${item.soLuongToiDa} sản phẩm`,
        variant: "destructive"
      });
      return;
    }

    // Optimistic update
    const oldQuantity = item.soLuong;
    setCartItems(items =>
      items.map(cartItem =>
        cartItem.id === item.id ? { ...cartItem, soLuong: newQuantity } : cartItem
      )
    );

    toast({
      title: "Đã cập nhật số lượng",
      description: `${item.tenSanPham_TenCombo}: ${newQuantity}`,
    });

    // Note: Backend doesn't have update quantity endpoint
    // Add this when you create the API endpoint:
    /*
    try {
      const response = await fetch(`${API_URL}/api/Cart/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemId: item.id, quantity: newQuantity })
      });

      if (!response.ok) {
        // Revert on error
        setCartItems(items =>
          items.map(cartItem =>
            cartItem.id === item.id ? { ...cartItem, soLuong: oldQuantity } : cartItem
          )
        );
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Update quantity error:', error);
    }
    */
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.donGia * item.soLuong), 0);
  const savings = cartItems.reduce((sum, item) => sum + (item.giamGia * item.soLuong), 0);
  const shipping = subtotal > 500000 ? 0 : 30000; // Free shipping over 500k
  const total = subtotal + shipping;

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Đang tải giỏ hàng...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-96 p-4">
          <ShoppingBag size={64} className="text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Giỏ hàng trống</h2>
          <p className="text-gray-500 text-center mb-6">
            Hãy thêm sản phẩm bạn yêu thích vào giỏ hàng
          </p>
          <div className="space-y-2">
            <Button onClick={() => navigate('/shop')} className="w-full">
              Tiếp tục mua sắm
            </Button>
            <Button variant="outline" onClick={() => navigate('/combo')} className="w-full">
              <Gift size={16} className="mr-2" />
              Xem combo hot
            </Button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="pb-20"> {/* Tăng padding-bottom để tránh che khuất */}
        {/* Header */}
        <div className="bg-white sticky top-0 z-40 border-b p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Giỏ hàng ({cartItems.length})</h1>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshCart}
                disabled={refreshing}
              >
                <RefreshCw size={16} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
              <QRShareCart cartItems={cartItems.map(item => ({
                id: item.id,
                name: item.tenSanPham_TenCombo,
                price: item.donGia,
                originalPrice: item.giaTruocKhiGiam,
                image: item.tenHinhAnh,
                size: item.kichThuoc || '',
                color: item.mau || '',
                quantity: item.soLuong,
              }))} />
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="p-4 space-y-4">
          {cartItems.map((item) => (
            <Card key={item.id} className="relative">
              <CardContent className="p-4">
                {/* Item Type Badge */}
                <div className="absolute top-2 right-2">
                  {item.maCombo ? (
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
                    src={getImageUrl(item.tenHinhAnh, !!item.maCombo)} // Sử dụng isCombo dựa trên maCombo
                    alt={item.tenSanPham_TenCombo}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = getImageUrl('placeholder.svg', !!item.maCombo);
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">
                      {item.tenSanPham_TenCombo}
                    </h3>

                    {/* Product variants */}
                    {item.kichThuoc && item.mau && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {item.kichThuoc}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.mau}
                        </Badge>
                      </div>
                    )}

                    {/* Combo details */}
                    {item.giohangctcombos && item.giohangctcombos.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">
                          Bao gồm {item.giohangctcombos.length} sản phẩm:
                        </p>
                        <div className="space-y-1">
                          {item.giohangctcombos.slice(0, 2).map((comboItem, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              • {comboItem.tenSanPham} ({comboItem.mauSac}, {comboItem.kichThuoc})
                            </div>
                          ))}
                          {item.giohangctcombos.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{item.giohangctcombos.length - 2} sản phẩm khác
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-primary">{formatPrice(item.donGia)}</span>
                        {item.giamGia > 0 && (
                          <span className="text-xs text-gray-500 line-through ml-2">
                            {formatPrice(item.giaTruocKhiGiam)}
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

                {/* Quantity controls */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item, item.soLuong - 1)}
                      disabled={item.soLuong <= 1}
                    >
                      <Minus size={14} />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.soLuong}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item, item.soLuong + 1)}
                      disabled={item.soLuong >= item.soLuongToiDa}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatPrice(item.donGia * item.soLuong)}
                    </div>
                    {item.giamGia > 0 && (
                      <div className="text-xs text-green-600">
                        Tiết kiệm {formatPrice(item.giamGia * item.soLuong)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock warning */}
                {item.soLuongToiDa <= 5 && (
                  <div className="mt-2 text-xs text-orange-600">
                    ⚠️ Chỉ còn {item.soLuongToiDa} sản phẩm
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="w-full max-w-md mx-auto bg-white border-t p-4 shadow-lg">
          {/* Sticky summary when scrolled to bottom */}
          <div className="sticky bottom-0 bg-white z-30">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Tạm tính:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Tiết kiệm:</span>
                  <span>-{formatPrice(savings)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Phí vận chuyển:</span>
                <span className={shipping === 0 ? 'text-green-600' : ''}>
                  {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
                </span>
              </div>
              {shipping === 0 && subtotal > 500000 && (
                <div className="text-xs text-green-600">
                  🎉 Bạn được miễn phí vận chuyển!
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Tổng cộng:</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => navigate('/checkout')}
              disabled={cartItems.length === 0}
            >
              Thanh toán ({cartItems.length} sản phẩm)
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};