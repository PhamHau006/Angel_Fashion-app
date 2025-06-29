import React, { useState, useEffect } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, CreditCard, Truck, Gift, Package, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl, getPlatformInfo, getApiEndpoint, getMobileApiEndpoint } from '../../config/api';
import { getCurrentCustomerId } from '../../services/cartService';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// VNPay Demo Configuration
const VNPAY_CONFIG = {
  tmnCode: '2QXUI4J4', // Demo TMN Code
  hashSecret: 'RAOEXHYVSDDIIENYWSHE', // Demo Secret Key
  vnpUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  version: '2.1.0',
  command: 'pay',
  currCode: 'VND',
  locale: 'vn'
};

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

interface ShippingInfo {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  note: string;
}

interface Address {
  id: number;
  diachichitiet: string;
  isDefault: boolean;
}

// Loading Button Component for better UX
const LoadingButton = ({ isLoading, children, className = '', ...props }) => (
  <Button {...props} disabled={isLoading} className={`${className} ${isLoading ? 'opacity-50' : ''}`}>
    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {children}
  </Button>
);

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [mobileApiStatus, setMobileApiStatus] = useState('checking');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    note: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [shippingFee, setShippingFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isOpenModalAddress, setIsOpenModalAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  const token = 'eb507c61-0fad-11f0-9aa0-bece206412cb';
  const apiUrl = getApiUrl();

  // Mobile Detection Utility
  const MobileUtils = {
    isMobile: () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
             || window.innerWidth <= 768;
    },
    
    getDeviceInfo: () => {
      const platformInfo = getPlatformInfo();
      return {
        isMobile: MobileUtils.isMobile(),
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        ...platformInfo
      };
    }
  };

  const MOBILE_VNPAY_CONFIG = {
    getApiUrl: () => getApiUrl(), // Sử dụng config động
    endpoints: {
      createPayment: '/api/MobileVNPAY/CreatePaymentUrl',
      health: '/api/MobileVNPAY/Health'
    },
    // Helper functions
    getCreatePaymentUrl: () => getApiEndpoint('/api/MobileVNPAY/CreatePaymentUrl'),
    getHealthUrl: () => getApiEndpoint('/api/MobileVNPAY/Health')
  };

  // Initialize user info from JWT token
  const initializeUserInfo = () => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      try {
        const decoded: any = jwtDecode(accessToken);
        console.log('Decoded token:', decoded);
        const userInfo = {
          fullName: decoded.FullName || decoded.name || decoded.Name || decoded.IdUser || '',
          phone: (decoded.PhoneNumber || decoded.phone || decoded.Phone || '').trim(),
        };
        setShippingInfo((prev) => ({ ...prev, ...userInfo }));
        console.log('Set user info:', userInfo);
      } catch (error) {
        console.error('Error decoding token:', error);
        toast({ title: 'Lỗi', description: 'Không thể đọc thông tin người dùng', variant: 'destructive' });
        navigate('/login');
      }
    } else {
      console.error('No access token found');
      toast({ title: 'Lỗi', description: 'Vui lòng đăng nhập lại', variant: 'destructive' });
      navigate('/login');
    }
  };

  // Format price - utility function
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  // Calculate subtotal
  const subtotal = cartItems.reduce((sum, item) => sum + item.donGia * item.soLuong, 0);

  // Fetch cart items
  const fetchCartItems = async () => {
    try {
      const customerId = getCurrentCustomerId();
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('No token found');

      const response = await fetch(`${apiUrl}/api/Cart/${customerId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch cart items');
      const data = await response.json();
      console.log('Cart items:', data);
      if (data.length === 0) {
        toast({ title: 'Giỏ hàng trống', description: 'Vui lòng chọn sản phẩm từ giỏ hàng', variant: 'destructive' });
        navigate('/cart');
        return;
      }
      setCartItems(data);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      toast({ title: 'Lỗi', description: 'Không thể tải giỏ hàng', variant: 'destructive' });
    }
  };

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      const customerId = getCurrentCustomerId();
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('No token found');

      const response = await fetch(`${apiUrl}/api/Address/${customerId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          Token: token,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch addresses');
      const data = await response.json();
      console.log('Addresses:', data);
      setAddresses(data);
      const defaultAddress = data.find((addr: Address) => addr.isDefault);
      if (defaultAddress) {
        setShippingInfo((prev) => ({ ...prev, address: defaultAddress.diachichitiet }));
        setSelectedAddress(defaultAddress.diachichitiet);
        console.log('Default address set:', defaultAddress.diachichitiet);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast({ title: 'Lỗi', description: 'Không thể tải địa chỉ', variant: 'destructive' });
    }
  };

  // Fetch provinces
  const fetchProvinces = async () => {
    try {
      const response = await axios.get('https://online-gateway.ghn.vn/shiip/public-api/master-data/province', {
        headers: { Token: token, 'Content-Type': 'application/json' },
      });
      if (response.data.code === 200) {
        setProvinces(response.data.data);
        console.log('Provinces:', response.data.data);
      } else {
        throw new Error('Failed to fetch provinces');
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách tỉnh/thành phố', variant: 'destructive' });
    }
  };

  // Fetch districts
  const fetchDistricts = async (provinceId: string) => {
    if (!provinceId) return;
    try {
      const response = await axios.post(
        'https://online-gateway.ghn.vn/shiip/public-api/master-data/district',
        { province_id: parseInt(provinceId) },
        { headers: { Token: token, 'Content-Type': 'application/json' } }
      );
      if (response.data.code === 200) {
        setDistricts(response.data.data);
        setWards([]);
        console.log('Districts:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách quận/huyện', variant: 'destructive' });
    }
  };

  // Fetch wards
  const fetchWards = async (districtId: string) => {
    if (!districtId) return;
    try {
      const response = await axios.post(
        'https://online-gateway.ghn.vn/shiip/public-api/master-data/ward',
        { district_id: parseInt(districtId) },
        { headers: { Token: token, 'Content-Type': 'application/json' } }
      );
      if (response.data.code === 200) {
        setWards(response.data.data);
        console.log('Wards:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching wards:', error);
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách phường/xã', variant: 'destructive' });
    }
  };

  // Calculate shipping fee
  const calculateShippingFee = async () => {
    if (!shippingInfo.district || !shippingInfo.ward) {
      setShippingFee(30000); // Fallback
      console.log('Missing district or ward, using fallback shipping fee');
      return;
    }
    try {
      const serviceResponse = await axios.post(
        'https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/available-services',
        { from_district: 1552, to_district: parseInt(shippingInfo.district), shop_id: 5715364 },
        { headers: { Token: token, 'Content-Type': 'application/json' } }
      );
      const serviceId = serviceResponse.data.data[0]?.service_id;
      if (!serviceId) throw new Error('No available shipping service');
      console.log('Service ID:', serviceId);

      const feeResponse = await axios.post(
        'https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee',
        {
          from_district_id: 1552,
          from_ward_code: '400103',
          service_id: serviceId,
          to_district_id: parseInt(shippingInfo.district),
          to_ward_code: shippingInfo.ward,
          weight: 200,
          insurance_value: 10000,
          cod_failed_amount: 2000,
        },
        { headers: { Token: token, 'Content-Type': 'application/json', ShopId: '5715364' } }
      );
      if (feeResponse.data.code === 200) {
        setShippingFee(feeResponse.data.data.total);
        console.log('Shipping fee:', feeResponse.data.data.total);
      } else {
        setShippingFee(30000); // Fallback
      }
    } catch (error) {
      console.error('Error calculating shipping fee:', error);
      setShippingFee(30000); // Fallback
      toast({ title: 'Lỗi', description: 'Không thể tính phí vận chuyển', variant: 'destructive' });
    }
  };

  // Apply coupon
  const applyCoupon = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        toast({ title: 'Lỗi', description: 'Vui lòng đăng nhập lại', variant: 'destructive' });
        navigate('/login');
        return;
      }
      if (!couponCode) {
        setDiscount(0);
        setCouponCode('');
        toast({ title: 'Lỗi', description: 'Vui lòng nhập mã coupon', variant: 'destructive' });
        return;
      }
      const customerId = getCurrentCustomerId();
      const response = await fetch(
        `${apiUrl}/api/Checkout/GetDiscountCoupon?maUser=${customerId}&&couponcode=${couponCode}&&originalPrice=${subtotal}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!response.ok) {
        if (response.status === 401) {
          toast({ title: 'Phiên hết hạn', description: 'Vui lòng đăng nhập lại', variant: 'destructive' });
          navigate('/login');
          return;
        }
        throw new Error('Failed to apply coupon');
      }
      const result = await response.json();
      if (result.success) {
        setDiscount(result.discount);
        toast({ title: 'Thành công', description: result.message });
      } else {
        setDiscount(0);
        setCouponCode('');
        toast({ title: 'Lỗi', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setDiscount(0);
      setCouponCode('');
      toast({ title: 'Lỗi', description: 'Không thể áp dụng mã coupon', variant: 'destructive' });
    }
  };

  // Validate shipping info
  const validateShippingInfo = () => {
    const errors: { [key: string]: string } = {};
    if (!shippingInfo.fullName.trim()) errors.fullName = 'Vui lòng nhập họ và tên';
    if (!shippingInfo.phone.trim()) errors.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^[0-9]{10}$/.test(shippingInfo.phone)) errors.phone = 'Số điện thoại không hợp lệ';
    if (!shippingInfo.address.trim()) errors.address = 'Vui lòng nhập địa chỉ chi tiết';
    if (!shippingInfo.city) errors.city = 'Vui lòng chọn tỉnh/thành phố';
    if (!shippingInfo.district) errors.district = 'Vui lòng chọn quận/huyện';
    if (!shippingInfo.ward) errors.ward = 'Vui lòng chọn phường/xã';

    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach((msg) =>
        toast({ title: 'Lỗi', description: msg, variant: 'destructive' })
      );
      return false;
    }
    return true;
  };

  // Handle COD Payment
  const handleCODPayment = async () => {
    const customerId = getCurrentCustomerId();
    const provinceName = provinces.find((p) => p.ProvinceID === parseInt(shippingInfo.city))?.ProvinceName || '';
    const districtName = districts.find((d) => d.DistrictID === parseInt(shippingInfo.district))?.DistrictName || '';
    const wardName = wards.find((w) => w.WardCode === shippingInfo.ward)?.WardName || '';
    const address = selectedAddress || `${shippingInfo.address}, ${wardName}, ${districtName}, ${provinceName}`;

    const content = {
      maKh: customerId,
      maCode: couponCode || null,
      diaChiNhanHang: address,
      hinhThucTt: paymentMethod,
      moTa: shippingInfo.note,
      hoTen: shippingInfo.fullName,
      sdt: shippingInfo.phone,
      phiVanChuyen: shippingFee,
      tienGoc: subtotal,
      giamGia: discount,
      gioHangId: cartItems.map((item) => item.id),
      chitietcombohoadons: cartItems
        .filter((item) => item.maCombo)
        .flatMap((item) =>
          (item.giohangctcombos || []).map((ct) => ({
            maCtsp: ct.maCtsp,
            maCombo: item.maCombo,
            soLuong: ct.soLuong,
            donGia: ct.donGia,
          }))
        ),
      cthoadons: cartItems
        .filter((item) => item.maCtsp)
        .map((item) => ({
          maCtsp: item.maCtsp,
          maCombo: item.maCombo,
          soLuong: item.soLuong,
          gia: item.donGia,
          giamGia: item.giamGia,
        })),
    };

    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(getApiEndpoint('/api/Checkout'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(content),
    });
    
    if (!response.ok) throw new Error('HandlePayment Failed');
    const result = await response.json();
    if (result.success) {
      toast({ title: 'Đặt hàng thành công', description: 'Đơn hàng của bạn đã được xác nhận' });
      navigate('/orders');
    } else {
      throw new Error(result.message || 'Không thể đặt hàng');
    }
  };

  // Handle Desktop VNPay Payment (Existing Web API)
  const handleDesktopVNPayPayment = async () => {
    try {
      const customerId = getCurrentCustomerId();
      const provinceName = provinces.find((p) => p.ProvinceID === parseInt(shippingInfo.city))?.ProvinceName || '';
      const districtName = districts.find((d) => d.DistrictID === parseInt(shippingInfo.district))?.DistrictName || '';
      const wardName = wards.find((w) => w.WardCode === shippingInfo.ward)?.WardName || '';
      const address = selectedAddress || `${shippingInfo.address}, ${wardName}, ${districtName}, ${provinceName}`;

      const vnpayData = {
        maKh: customerId,
        maCode: couponCode || null,
        diaChiNhanHang: address,
        hinhThucTt: 'VNPay',
        moTa: shippingInfo.note,
        hoTen: shippingInfo.fullName,
        sdt: shippingInfo.phone,
        phiVanChuyen: shippingFee,
        tienGoc: subtotal,
        giamGia: discount,
        gioHangId: cartItems.map((item) => item.id),
        chitietcombohoadons: cartItems
          .filter((item) => item.maCombo)
          .flatMap((item) =>
            (item.giohangctcombos || []).map((ct) => ({
              maCtsp: ct.maCtsp,
              maCombo: item.maCombo,
              soLuong: ct.soLuong,
              donGia: ct.donGia,
            }))
          ),
        cthoadons: cartItems
          .filter((item) => item.maCtsp)
          .map((item) => ({
            maCtsp: item.maCtsp,
            maCombo: item.maCombo,
            soLuong: item.soLuong,
            gia: item.donGia,
            giamGia: item.giamGia,
          })),
      };

      console.log('💻 Desktop VNPay order data:', vnpayData);

      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      // Call existing VNPay API
      const response = await axios.post(getApiEndpoint('/api/VNPAY/CreatePaymentUrl'), vnpayData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 201 && response.data) {
        const vnpayUrl = response.data;
        console.log('💻 Desktop VNPay URL:', vnpayUrl);
        
        // Desktop: Open in new tab
        window.open(vnpayUrl, '_blank');
        toast({
          title: 'Thanh toán VNPay',
          description: 'Đã mở trang thanh toán trong tab mới',
        });
        navigate('/orders');
      } else {
        throw new Error(`Desktop VNPay payment failed with status ${response.status}: ${response.data}`);
      }
      
    } catch (error) {
      console.error('💻 Desktop VNPay error:', error);
      toast({
        title: 'Lỗi thanh toán VNPay',
        description: error.message || 'Không thể kết nối đến VNPay. Vui lòng thử lại.',
        variant: 'destructive',
      });
      throw error;
    }
  };

 // Sửa hàm handleMobileVNPayPayment - Fixed Mobile Detection

const handleMobileVNPayPayment = async () => {
  try {
    console.log('📱 Starting Mobile VNPay Payment...');
    
    const customerId = getCurrentCustomerId();
    const provinceName = provinces.find((p) => p.ProvinceID === parseInt(shippingInfo.city))?.ProvinceName || '';
    const districtName = districts.find((d) => d.DistrictID === parseInt(shippingInfo.district))?.DistrictName || '';
    const wardName = wards.find((w) => w.WardCode === shippingInfo.ward)?.WardName || '';
    const address = selectedAddress || `${shippingInfo.address}, ${wardName}, ${districtName}, ${provinceName}`;

    // Prepare mobile payment data
    const mobilePaymentData = {
      maKh: customerId,
      maCode: couponCode || null,
      diaChiNhanHang: address,
      hinhThucTt: 'VNPay',
      moTa: shippingInfo.note || `Mobile payment - Order ${Date.now()}`,
      hoTen: shippingInfo.fullName,
      sdt: shippingInfo.phone,
      phiVanChuyen: shippingFee,
      tienGoc: subtotal,
      giamGia: discount,
      gioHangId: cartItems.map((item) => item.id),
      chitietcombohoadons: cartItems
        .filter((item) => item.maCombo)
        .flatMap((item) =>
          (item.giohangctcombos || []).map((ct) => ({
            maCtsp: ct.maCtsp,
            maCombo: item.maCombo,
            soLuong: ct.soLuong,
            donGia: ct.donGia,
          }))
        ),
      cthoadons: cartItems
        .filter((item) => item.maCtsp)
        .map((item) => ({
          maCtsp: item.maCtsp,
          maCombo: item.maCombo,
          soLuong: item.soLuong,
          gia: item.donGia,
          giamGia: item.giamGia,
        })),
    };

    console.log('📤 Mobile VNPay Data:', mobilePaymentData);

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    // FIXED: Use mobile API endpoint specifically
    const createPaymentUrl = getMobileApiEndpoint('/api/MobileVNPAY/CreatePaymentUrl');
    console.log('📡 Calling Mobile VNPay API:', createPaymentUrl);
    
    const response = await fetch(createPaymentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(mobilePaymentData),
      signal: AbortSignal.timeout(30000)
    });

    console.log('📡 Response Status:', response.status);

    if (response.status === 201) {
      const result = await response.json();
      console.log('✅ Mobile VNPay Success:', result);
      
      const vnpayUrl = result.paymentUrl || result;
      const orderId = result.orderId;
      
      if (vnpayUrl) {
        // Show confirmation dialog
        const confirmPayment = confirm(
          `Bạn sẽ được chuyển đến VNPay để thanh toán đơn hàng #${orderId}\n\n` +
          `Số tiền: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(result.amount)}\n\n` +
          `Nhấn "OK" để tiếp tục thanh toán`
        );
        
        if (confirmPayment) {
          console.log('🔗 Redirecting to VNPay:', vnpayUrl);
          
          // Show loading message
          toast({
            title: '🚀 Chuyển hướng thanh toán',
            description: 'Đang chuyển đến VNPay...',
            duration: 2000,
          });
          
          // Start polling immediately (before redirect)
          setTimeout(() => {
            startOrderStatusPolling(orderId);
          }, 1000);
          
          // CRITICAL FIX: Use window.location.replace instead of href
          setTimeout(() => {
            window.location.replace(vnpayUrl);
          }, 2000);
          
        } else {
          // User cancelled
          toast({
            title: '❌ Đã hủy thanh toán',
            description: 'Bạn có thể thử lại hoặc chọn phương thức thanh toán khác',
            variant: 'destructive',
          });
        }
        
      } else {
        throw new Error('No payment URL received from API');
    }
  }
  } catch (error) {
    console.error('❌ Mobile VNPay Error:', error);
    
    let errorMessage = 'Không thể kết nối đến VNPay. ';
    
    if (error.message.includes('timeout')) {
      errorMessage += 'Kết nối quá chậm. Vui lòng thử lại.';
    } else if (error.message.includes('fetch') || error.message.includes('refused')) {
      errorMessage += 'Lỗi mạng. Vui lòng thử phương thức thanh toán khác.';
    } else {
      errorMessage += error.message || 'Vui lòng thử lại.';
    }
    
    toast({
      title: '❌ Lỗi thanh toán',
      description: errorMessage,
      variant: 'destructive',
    });
  }
};

// Enhanced polling function
const startOrderStatusPolling = (orderId: number) => {
  console.log(`🔄 Starting status polling for order ${orderId}`);
  
  // Show loading state
  toast({
    title: '⏳ Đang chờ thanh toán',
    description: 'Hoàn tất thanh toán trong tab mới. Hệ thống đang kiểm tra kết quả...',
    duration: 5000, // Show for 5 seconds
  });

  let pollCount = 0;
  const maxPolls = 150; // 5 minutes (150 * 2 seconds)
  
  const pollInterval = setInterval(async () => {
    pollCount++;
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      const checkUrl = getMobileApiEndpoint(`/api/MobileVNPAY/CheckOrderStatus/${orderId}`);
      
      const response = await fetch(checkUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Poll ${pollCount}: Order ${orderId} status:`, data);

        if (data.status === 'success' && data.isPaid) {
          // Payment successful
          clearInterval(pollInterval);
          
          toast({
            title: '✅ Thanh toán thành công!',
            description: `Đơn hàng #${orderId} đã được thanh toán thành công`,
            duration: 5000,
          });
          
          // Navigate to success page
          setTimeout(() => {
            navigate(`/payment-result?status=success&orderId=${orderId}&amount=${data.totalAmount}&message=Thanh toán thành công`);
          }, 1000);
          return;
          
        } else if (data.status === 'failed' || data.isCancelled) {
          // Payment failed
          clearInterval(pollInterval);
          
          toast({
            title: '❌ Thanh toán thất bại',
            description: 'Đơn hàng đã bị hủy hoặc thanh toán không thành công',
            variant: 'destructive',
            duration: 5000,
          });
          
          setTimeout(() => {
            navigate(`/payment-result?status=failed&orderId=${orderId}&message=Thanh toán thất bại`);
          }, 1000);
          return;
        }
        
        // Still pending, continue polling
        if (pollCount % 15 === 0) { // Every 30 seconds
          const minutesWaited = Math.floor(pollCount * 2 / 60);
          toast({
            title: '⏳ Vẫn đang chờ thanh toán',
            description: `Đã chờ ${minutesWaited} phút. Hãy hoàn tất thanh toán trong tab VNPay.`,
            duration: 3000,
          });
        }
      }
    } catch (error) {
      console.error('❌ Error polling order status:', error);
    }
    
    // Auto timeout after 5 minutes
    if (pollCount >= maxPolls) {
      clearInterval(pollInterval);
      
      toast({
        title: '⏰ Hết thời gian chờ',
        description: 'Quá thời gian chờ thanh toán. Kiểm tra lại trong phần "Đơn hàng của tôi"',
        variant: 'destructive',
        duration: 5000,
      });
      
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    }
  }, 2000); // Poll every 2 seconds
};

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateShippingInfo()) return;
      calculateShippingFee();
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!paymentMethod) {
        toast({ title: 'Lỗi', description: 'Vui lòng chọn phương thức thanh toán', variant: 'destructive' });
        return;
      }
      setCurrentStep(3);
    }
  };
  const testMobileNetworkConnectivity = async () => {
    console.log('🔍 Testing Mobile Network Connectivity...');
    
    const testUrls = [
      'http://192.168.1.150:7218/api/health',
      'http://localhost:7218/api/health',
      'http://127.0.0.1:7218/api/health'
    ];
    
    for (const url of testUrls) {
      try {
        console.log(`📡 Testing: ${url}`);
        const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${url} - OK:`, data);
        } else {
          console.log(`❌ ${url} - Failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${url} - Error: ${error.message}`);
      }
    }
  };
  
  const handlePreviousStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else navigate('/cart');
  };

  // MAIN HANDLE PLACE ORDER FUNCTION - FIXED
  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) throw new Error('No token found');
  
      // Confirm dialog
      const confirmResult = await new Promise<boolean>((resolve) => {
        toast({
          title: 'Xác nhận đặt hàng?',
          description: 'Bạn có chắc muốn tiến hành thanh toán đơn hàng này?',
          action: (
            <>
              <Button variant="outline" onClick={() => resolve(false)}>
                Hủy
              </Button>
              <Button onClick={() => resolve(true)}>Đồng ý</Button>
            </>
          ),
        });
      });
  
      if (!confirmResult) {
        toast({ title: 'Đã hủy', description: 'Đơn hàng chưa được thanh toán' });
        return;
      }
  
      // Route payment based on method
      if (paymentMethod.toLowerCase() === 'cod') {
        console.log('💰 Processing COD payment...');
        await handleCODPayment();
      } else if (paymentMethod.toLowerCase() === 'vnpay') {
        // Smart routing with better fallback logic
        if (isMobileDevice && mobileApiStatus === 'connected') {
          console.log('📱 Attempting Mobile VNPay API (with auto-fallback)...');
          await handleMobileVNPayPayment(); // Đã có auto-fallback bên trong
        } else if (isMobileDevice && mobileApiStatus === 'failed') {
          console.log('📱 Mobile API failed, using Desktop VNPay directly...');
          toast({
            title: '⚠️ Sử dụng phương thức dự phòng',
            description: 'Mobile API không khả dụng, chuyển sang web VNPay...',
          });
          await handleDesktopVNPayPayment();
        } else {
          console.log('💻 Using Desktop VNPay API...');
          await handleDesktopVNPayPayment();
        }
      }
      
    } catch (error) {
      console.error('❌ Error placing order:', error);
      toast({
        title: 'Lỗi đặt hàng',
        description: error.message || 'Đã xảy ra lỗi khi xử lý thanh toán',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { number: 1, title: 'Thông tin giao hàng', icon: MapPin },
    { number: 2, title: 'Phương thức thanh toán', icon: CreditCard },
    { number: 3, title: 'Xác nhận đơn hàng', icon: Truck },
  ];

  useEffect(() => {
    initializeUserInfo();
    fetchCartItems();
    fetchProvinces();
    fetchAddresses();
  }, []);

  useEffect(() => {
    if (shippingInfo.city) fetchDistricts(shippingInfo.city);
  }, [shippingInfo.city]);

  useEffect(() => {
    if (shippingInfo.district) fetchWards(shippingInfo.district);
  }, [shippingInfo.district]);

  useEffect(() => {
    if (shippingInfo.ward) calculateShippingFee();
  }, [shippingInfo.ward]);

  // Mobile API Check Effect
  useEffect(() => {
    const checkMobileSetup = async () => {
      const deviceInfo = MobileUtils.getDeviceInfo();
      setIsMobileDevice(deviceInfo.isMobile);
      
      console.log('📱 Device Info:', deviceInfo);
      console.log('🔧 API Config:', {
        apiUrl: MOBILE_VNPAY_CONFIG.getApiUrl(),
        healthUrl: MOBILE_VNPAY_CONFIG.getHealthUrl(),
        platform: deviceInfo.platform,
        isNative: deviceInfo.isNative
      });
      
      // Test network connectivity first
      await testMobileNetworkConnectivity();
      
      // Then test mobile API
      try {
        const healthUrl = MOBILE_VNPAY_CONFIG.getHealthUrl();
        console.log('🔍 Testing mobile API at:', healthUrl);
        
        const response = await fetch(healthUrl, {
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Mobile API Health Check:', data);
          setMobileApiStatus('connected');
        } else {
          console.error('❌ Mobile API Health Check Failed:', response.status);
          setMobileApiStatus('failed');
        }
      } catch (error) {
        console.error('❌ Mobile API Connection Error:', error);
        setMobileApiStatus('failed');
      }
    };
  
    checkMobileSetup();
  }, []);

  const openAddressModal = () => setIsOpenModalAddress(true);
  const closeAddressModal = () => setIsOpenModalAddress(false);
  const saveAddress = () => {
    if (!selectedAddress && addresses.length > 0) {
      toast({ title: 'Lỗi', description: 'Vui lòng chọn một địa chỉ', variant: 'destructive' });
      return;
    }
    setShippingInfo((prev) => ({ ...prev, address: selectedAddress }));
    closeAddressModal();
  };

  return (
    <MobileLayout showBottomNav={false}>
      <div className="pb-60">
        {/* Header */}
        <div className="bg-white sticky top-0 z-40 border-b p-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={handlePreviousStep}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold">Thanh toán</h1>
            
            {/* Mobile Status Indicator */}
            {isMobileDevice && (
              <div className="ml-auto">
                <Badge 
                  variant={mobileApiStatus === 'connected' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  📱 {mobileApiStatus === 'connected' ? 'Mobile Ready' : 'Mobile API Error'}
                </Badge>
              </div>
            )}
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
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      isActive ? 'bg-primary text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isCompleted ? '✓' : <Icon size={16} />}
                  </div>
                  <div className="ml-2 hidden sm:block">
                    <div
                      className={`text-sm font-medium ${
                        isActive ? 'text-primary' : isCompleted ? 'text-green-500' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="container mx-auto p-4 grid grid-cols-1 gap-6 max-w-md">
          {/* Shipping Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin size={20} />
                  <span>Thông tin giao hàng</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="fullName"
                      value={shippingInfo.fullName}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, fullName: e.target.value })}
                      className={`w-full p-2 border rounded ${!shippingInfo.fullName && 'border-red-500'}`}
                      placeholder="Nhập họ và tên"
                    />
                    {!shippingInfo.fullName && (
                      <p className="text-red-500 text-sm mt-1">Vui lòng nhập họ và tên</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="phone">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="phone"
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                      className={`w-full p-2 border rounded ${
                        !shippingInfo.phone || !/^[0-9]{10}$/.test(shippingInfo.phone) ? 'border-red-500' : ''
                      }`}
                      placeholder="Nhập số điện thoại"
                    />
                    {!shippingInfo.phone && (
                      <p className="text-red-500 text-sm mt-1">Vui lòng nhập số điện thoại</p>
                    )}
                    {shippingInfo.phone && !/^[0-9]{10}$/.test(shippingInfo.phone) && (
                      <p className="text-red-500 text-sm mt-1">Số điện thoại không hợp lệ</p>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="address">
                    Địa chỉ <span className="text-red-500">*</span>
                  </label>
                  <label style={{ marginTop: '10px', display: 'block' }}>
                    <input
                      type="checkbox"
                      checked={isOpenModalAddress}
                      onChange={(e) => setIsOpenModalAddress(e.target.checked)}
                    />
                    Sử dụng địa chỉ đã lưu
                  </label>
                  <input
                    id="address"
                    value={shippingInfo.address}
                    onChange={(e) => {
                      setShippingInfo({ ...shippingInfo, address: e.target.value });
                      setSelectedAddress(''); // Clear selected address if manually edited
                    }}
                    className={`w-full p-2 border rounded ${!shippingInfo.address && 'border-red-500'}`}
                    placeholder="Số nhà, tên đường"
                  />
                  {!shippingInfo.address && (
                    <p className="text-red-500 text-sm mt-1">Vui lòng nhập địa chỉ chi tiết</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label>
                      Tỉnh/Thành phố <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={shippingInfo.city}
                      onChange={(e) => {
                        setShippingInfo({ ...shippingInfo, city: e.target.value, district: '', ward: '' });
                      }}
                      className={`w-full p-2 border rounded ${!shippingInfo.city && 'border-red-500'}`}
                    >
                      <option value="">Chọn tỉnh/thành phố</option>
                      {provinces.map((province) => (
                        <option key={province.ProvinceID} value={province.ProvinceID}>
                          {province.ProvinceName}
                        </option>
                      ))}
                    </select>
                    {!shippingInfo.city && (
                      <p className="text-red-500 text-sm mt-1">Vui lòng chọn tỉnh/thành phố</p>
                    )}
                  </div>
                  <div>
                    <label>
                      Quận/Huyện <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={shippingInfo.district}
                      onChange={(e) => {
                        setShippingInfo({ ...shippingInfo, district: e.target.value, ward: '' });
                      }}
                      className={`w-full p-2 border rounded ${!shippingInfo.district && 'border-red-500'}`}
                    >
                      <option value="">Chọn quận/huyện</option>
                      {districts.map((district) => (
                        <option key={district.DistrictID} value={district.DistrictID}>
                          {district.DistrictName}
                        </option>
                      ))}
                    </select>
                    {!shippingInfo.district && (
                      <p className="text-red-500 text-sm mt-1">Vui lòng chọn quận/huyện</p>
                    )}
                  </div>
                  <div>
                    <label>
                      Phường/Xã <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={shippingInfo.ward}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, ward: e.target.value })}
                      className={`w-full p-2 border rounded ${!shippingInfo.ward && 'border-red-500'}`}
                    >
                      <option value="">Chọn phường/xã</option>
                      {wards.map((ward) => (
                        <option key={ward.WardCode} value={ward.WardCode}>
                          {ward.WardName}
                        </option>
                      ))}
                    </select>
                    {!shippingInfo.ward && (
                      <p className="text-red-500 text-sm mt-1">Vui lòng chọn phường/xã</p>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="note">Ghi chú (tùy chọn)</label>
                  <textarea
                    id="note"
                    value={shippingInfo.note}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, note: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="Ghi chú cho đơn hàng..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard size={20} />
                  <span>Phương thức thanh toán</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-primary"
                  />
                  <Truck size={20} />
                  <div className="flex-1">
                    <div className="font-medium">Thanh toán khi nhận hàng (COD)</div>
                    <div className="text-sm text-gray-500">Thanh toán bằng tiền mặt khi nhận hàng</div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="VNPay"
                    checked={paymentMethod === 'VNPay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-primary"
                  />
                  <CreditCard size={20} />
                  <div className="flex-1">
                    <div className="font-medium">VNPay</div>
                    <div className="text-sm text-gray-500">Thanh toán qua thẻ ATM, Visa, MasterCard</div>
                    
                    {/* Mobile specific messaging */}
                    {isMobileDevice && mobileApiStatus === 'connected' && (
                      <div className="text-xs text-blue-600 mt-1">
                        📱 Tối ưu cho mobile - API sẵn sàng
                      </div>
                    )}
                    {isMobileDevice && mobileApiStatus === 'failed' && (
                      <div className="text-xs text-red-600 mt-1">
                        ⚠️ Mobile API lỗi - Sử dụng web fallback
                      </div>
                    )}
                    {!isMobileDevice && (
                      <div className="text-xs text-gray-600 mt-1">
                        💻 Phiên bản web - Mở tab mới
                      </div>
                    )}
                  </div>
                </label>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck size={20} />
                  <span>Tổng kết đơn hàng</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="relative">
                    <div className="absolute top-0 right-0">
                      {item.maCombo ? (
                        <Badge className="bg-purple-500 text-white text-xs">
                          <Gift size={10} className="mr-1" /> Combo
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500 text-white text-xs">
                          <Package size={10} className="mr-1" /> Sản phẩm
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-3 mt-6">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm mb-1 line-clamp-2">{item.tenSanPham_TenCombo}</h3>
                        {item.kichThuoc && item.mau && (
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {item.kichThuoc}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.mau}
                            </Badge>
                            <span className="text-xs text-gray-500">x{item.soLuong}</span>
                          </div>
                        )}
                        {item.giohangctcombos && item.giohangctcombos.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 mb-1">
                              Bao gồm {item.giohangctcombos.length} sản phẩm:
                            </p>
                            <div className="space-y-1">
                              {item.giohangctcombos.slice(0, 3).map((comboItem, index) => (
                                <div key={index} className="text-xs text-gray-600">
                                  • {comboItem.tenSanPham} ({comboItem.mauSac}, {comboItem.kichThuoc}) x
                                  {comboItem.soLuong}
                                </div>
                              ))}
                              {item.giohangctcombos.length > 3 && (
                                <div className="text-xs text-gray-500">
                                  +{item.giohangctcombos.length - 3} sản phẩm khác
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="text-right">
                          <span className="font-bold text-primary">{formatPrice(item.donGia * item.soLuong)}</span>
                          {item.giamGia > 0 && (
                            <div className="text-xs text-gray-500 line-through">
                              {formatPrice(item.giaTruocKhiGiam * item.soLuong)}
                            </div>
                          )}
                          {item.giamGia > 0 && (
                            <div className="text-xs text-green-600">
                              Tiết kiệm {formatPrice((item.giaTruocKhiGiam - item.donGia) * item.soLuong)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Tạm tính:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá:</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Phí vận chuyển:</span>
                    <span className={shippingFee === 0 ? 'text-green-600' : ''}>
                      {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                    </span>
                  </div>
                  {shippingFee === 0 && subtotal > 500000 && (
                    <div className="text-xs text-green-600">🎉 Miễn phí vận chuyển cho đơn hàng trên 500k!</div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Tổng cộng:</span>
                    <span className="text-primary">{formatPrice(subtotal + shippingFee - discount)}</span>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="discount__content">
                    <h6>Nhập mã coupon (nếu có)</h6>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập mã coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 p-2 border rounded"
                      />
                      <Button onClick={applyCoupon} variant="default" className="whitespace-nowrap">
                        Áp dụng
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Address Modal */}
          {isOpenModalAddress && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h6 className="text-lg font-semibold">Địa chỉ đã lưu</h6>
                  <button onClick={closeAddressModal} className="text-2xl">
                    ×
                  </button>
                </div>
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {addresses.length === 0 ? (
                    <p className="text-gray-500">Không có địa chỉ đã lưu</p>
                  ) : (
                    addresses.map((address) => (
                      <label key={address.id} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddress === address.diachichitiet}
                          onChange={() => setSelectedAddress(address.diachichitiet)}
                        />
                        <span>
                          {address.diachichitiet} {address.isDefault && '(Mặc định)'}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" onClick={closeAddressModal} className="mr-2">
                    Hủy
                  </Button>
                  <Button onClick={saveAddress}>Lưu</Button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action */}
          <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold">Tổng cộng:</span>
              <span className="text-xl font-bold text-primary">{formatPrice(subtotal + shippingFee - discount)}</span>
            </div>
            {currentStep < 3 ? (
              <Button className="w-full" onClick={handleNextStep}>
                Tiếp tục
              </Button>
            ) : (
              <LoadingButton 
                className="w-full" 
                onClick={handlePlaceOrder} 
                isLoading={isProcessing}
              >
                {isProcessing 
                  ? 'Đang xử lý...' 
                  : paymentMethod === 'VNPay' 
                    ? 'Thanh toán VNPay' 
                    : 'Đặt hàng'
                }
              </LoadingButton>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};