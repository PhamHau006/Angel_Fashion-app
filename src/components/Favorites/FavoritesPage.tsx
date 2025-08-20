import React, { useState, useEffect } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Share2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { jwtDecode } from 'jwt-decode';

// Interface cho sản phẩm yêu thích
interface FavoriteProduct {
  maSp: number;
  tenSanPham: string;
  hinhAnh: string;
  khoangGia: number;
  isNew?: boolean;
  isTrending?: boolean;
  discount?: number;
  rating?: number;
  reviews?: number;
}

// Interface cho chi tiết sản phẩm trong modal
interface ProductDetail {
  maCtsp: number;
  mauSac: string;
  kichThuoc: string;
  soLuongTon: number;
  donGia: number;
  images: { tenHinhAnh: string }[];
}

interface SelectedProduct {
  maSp: number;
  tenSanPham: string;
  hinhAnh: string;
  productDetails: ProductDetail[];
}

// Interface cho token
interface DecodedToken {
  sub: string;
  PhoneNumber: string;
  FullName: string;
  role: string;
  exp: number;
}

// Hàm giải mã token
const readToken = (token: string | undefined): DecodedToken | null => {
  if (token) {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
  return null;
};

// Hàm lấy API URL
const getApiUrl = () => {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  console.log('Platform info:', { isNative, platform });
  return isNative && platform === 'android' ? 'http://192.168.1.150:7218' : 'https://localhost:7217';
};

const API_URL = getApiUrl();

interface FavoritesPageProps {
  customerId?: string;
}

const FavoritesPage: React.FC<FavoritesPageProps> = ({ customerId: propCustomerId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const token = localStorage.getItem('accessToken');
  const decodedToken = readToken(token || undefined);
  const idKhachHang = propCustomerId || decodedToken?.sub || '1';
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [allImages, setAllImages] = useState<string[]>([]);
  const [accessToken, setAccessToken] = useState(token || '');

  // Lấy danh sách sản phẩm yêu thích
  const fetchFavorites = async () => {
    try {
      if (!idKhachHang) {
        throw new Error('ID khách hàng không hợp lệ.');
      }
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/Favorite/GetFavoriteProducts?idKhachHang=${idKhachHang}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFavorites(Array.isArray(data.data) ? data.data : []);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định.');
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách sản phẩm yêu thích',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy chi tiết sản phẩm cho modal
  const fetchProductDetails = async (maSp: number) => {
    try {
      let url = `${API_URL}/api/Shop/Product/${maSp}`;
      if (idKhachHang) {
        url += `?maKh=${idKhachHang}`;
      }
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }
      const result = await response.json();
      setSelectedProduct(result);
      const images = result.productDetails.flatMap((detail: ProductDetail) =>
        detail.images.map((img) => img.tenHinhAnh)
      );
      setAllImages(images);
      const colors = [...new Set(result.productDetails.map((d: ProductDetail) => d.mauSac).filter((color) => color))];

      const availableSizes = result.productDetails.find((p: ProductDetail) => p.mauSac === colors[0])?.kichThuoc;
      setSelectedSize(availableSizes || '');
      setQuantity('1');
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể lấy chi tiết sản phẩm',
        variant: 'destructive',
      });
    }
  };

  // Xóa sản phẩm yêu thích
// Xóa sản phẩm yêu thích
const removeFavorite = async (id: number) => {
  toast({
    title: 'Xác nhận xóa',
    description: 'Bạn có chắc muốn xóa sản phẩm này khỏi danh sách yêu thích?',
    action: (
      <button
        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
        onClick={async () => {
          try {
            if (!idKhachHang) {
              throw new Error('ID khách hàng không hợp lệ.');
            }
            const response = await fetch(`${API_URL}/api/Favorite/DeleteFavoriteProducts`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                maKh: idKhachHang,
                maSp: id,
              }),
            });
            if (!response.ok) {
              throw new Error('Không thể xóa sản phẩm yêu thích');
            }
            setFavorites(favorites.filter((item) => item.maSp !== id));
            toast({
              title: 'Đã xóa khỏi yêu thích',
              description: 'Sản phẩm đã được xóa khỏi danh sách yêu thích',
              duration: 5000,
            });
          } catch (err) {
            toast({
              title: 'Lỗi',
              description: 'Không thể xóa sản phẩm khỏi yêu thích',
              variant: 'destructive',
              duration: 5000,
            });
          }
        }}
      >
        Xác nhận
      </button>
    ),
    duration: 10000, // Cho phép người dùng đủ thời gian để quyết định
  });
};

  // Định dạng tiền tệ
  const formatPrice = (price: number) => {
    if (!price) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Mở modal chọn tùy chọn
  const openModal = async (maSp: number) => {
    setSelectedProduct(null);
    await fetchProductDetails(maSp);
    setShowModal(true);
  };

  // Xác thực số lượng
  const validateQuantity = () => {
    let value = quantity.replace(/[^\d]/g, '');
    if (value === '' || value === '0') {
      setQuantity('1');
      return;
    }
    const number = parseInt(value);
    const maxQty =
      selectedProduct?.productDetails.find((p) => p.mauSac === selectedColor && p.kichThuoc === selectedSize)
        ?.soLuongTon || 0;
    if (isNaN(number) || number < 1) {
      setQuantity('1');
    } else if (number > maxQty) {
      setQuantity(maxQty.toString());
      toast({
        title: 'Số lượng không hợp lệ',
        description: `Số lượng tối đa là ${maxQty}`,
        variant: 'destructive',
      });
    } else {
      setQuantity(number.toString());
    }
  };

  // Thêm vào giỏ hàng
  const addToCart = async () => {
    if (!idKhachHang) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng đăng nhập để thêm vào giỏ hàng',
        variant: 'destructive',
      });
      return;
    }

    try {
      const matched = selectedProduct?.productDetails.find(
        (p) => p.mauSac === selectedColor && p.kichThuoc === selectedSize
      );
      if (!matched) {
        toast({
          title: 'Lỗi',
          description: 'Vui lòng chọn màu sắc và kích thước hợp lệ',
          variant: 'destructive',
        });
        return;
      }

      const content = {
        maKh: idKhachHang,
        maCtsp: matched.maCtsp,
        maCombo: null,
        soLuong: parseInt(quantity),
        donGia: matched.donGia,
        giamGia: 0,
        tenHinhAnh: selectedProduct.hinhAnh || '',
        giohangctcombos: [],
      };

      const response = await fetch(`${API_URL}/api/Cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(content),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Đã xảy ra lỗi khi thêm vào giỏ hàng');
      }

      setShowModal(false);
      toast({
        title: 'Thành công',
        description: 'Đã thêm sản phẩm vào giỏ hàng',
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể thêm sản phẩm vào giỏ hàng',
        variant: 'destructive',
      });
    }
  };

  // Chia sẻ sản phẩm
  const shareProduct = (product: FavoriteProduct) => {
    if (navigator.share) {
      navigator.share({
        title: product.tenSanPham,
        text: `Xem sản phẩm ${product.tenSanPham} tại Angel Fashion`,
        url: `${window.location.origin}/product/${product.maSp}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/product/${product.maSp}`);
      toast({
        title: 'Đã sao chép link',
        description: 'Link sản phẩm đã được sao chép vào clipboard',
      });
    }
  };

  // Theo dõi selectedColor để cập nhật selectedSize
  useEffect(() => {
    if (selectedProduct && selectedColor) {
      const availableSizes = selectedProduct.productDetails
        .filter((p) => p.mauSac === selectedColor)
        .map((p) => p.kichThuoc);
      setSelectedSize(availableSizes[0] || '');
      setQuantity('1');
    }
  }, [selectedColor, selectedProduct]);

  // Lấy danh sách yêu thích khi mount
  useEffect(() => {
    if (idKhachHang) {
      fetchFavorites();
    }
  }, [idKhachHang]);

  // Xử lý loading
  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-96 p-4">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </MobileLayout>
    );
  }

  // Xử lý lỗi
  if (error) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-96 p-4">
          <Heart size={64} className="text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Lỗi tải dữ liệu</h2>
          <p className="text-gray-500 text-center mb-6">{error}</p>
          <Button onClick={() => navigate('/shop')}>Khám phá sản phẩm</Button>
        </div>
      </MobileLayout>
    );
  }

  // Xử lý danh sách rỗng
  if (favorites.length === 0) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-96 p-4">
          <Heart size={64} className="text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Chưa có sản phẩm yêu thích</h2>
          <p className="text-gray-500 text-center mb-6">
            Hãy thêm những sản phẩm bạn yêu thích để xem lại dễ dàng
          </p>
          <Button onClick={() => navigate('/shop')}>Khám phá sản phẩm</Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="pb-20 px-4">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="flex text-sm text-gray-500">
            <li className="mr-2">
              <a href="/" className="no-underline text-gray-500 hover:text-primary">
                Trang chủ
              </a>
            </li>
            <li className="mr-2">/</li>
            <li className="mr-2">
              <a href="/shop" className="no-underline text-gray-500 hover:text-primary">
                Sản phẩm
              </a>
            </li>
            <li className="mr-2">/</li>
            <li className="text-gray-500">Sản phẩm yêu thích</li>
          </ol>
        </nav>

        {/* Tiêu đề */}
        <div className="bg-white sticky top-0 z-40 border-b p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Yêu thích ({favorites.length})</h1>
            <Button variant="ghost" size="sm">
              Chỉnh sửa
            </Button>
          </div>
        </div>

        {/* Danh sách yêu thích */}
        <div className="p-4 grid grid-cols-2 gap-4">
          {favorites.map((product) => (
            <Card key={product.maSp} className="overflow-hidden bg-white shadow-sm">
              <div className="relative">
                <img
                  src={`${API_URL}/HinhAnh/Products/${product.hinhAnh}`}
                  alt={product.tenSanPham}
                  className="w-full h-40 object-cover cursor-pointer"
                  onClick={() => navigate(`/product/${product.maSp}`)}
                />
                <div className="absolute top-2 left-2 flex flex-col space-y-1">
                  {product.isNew && (
                    <Badge className="bg-green-500 text-white text-xs">NEW</Badge>
                  )}
                  {product.isTrending && (
                    <Badge className="bg-red-500 text-white text-xs">HOT</Badge>
                  )}
                  {product.discount && product.discount > 0 && (
                    <Badge className="bg-orange-500 text-white text-xs">-{product.discount}%</Badge>
                  )}
                </div>
                <div className="absolute top-2 right-2 flex flex-col space-y-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 bg-white/80 hover:bg-white"
                    onClick={() => removeFavorite(product.maSp)}
                  >
                    <X size={14} className="text-red-500" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 bg-white/80 hover:bg-white"
                    onClick={() => shareProduct(product)}
                  >
                    <Share2 size={14} />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3">
                <h3
                  className="font-medium text-sm mb-2 line-clamp-2 cursor-pointer hover:text-primary"
                  onClick={() => navigate(`/product/${product.maSp}`)}
                >
                  {product.tenSanPham}
                </h3>
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    <span className="text-yellow-400 text-sm mr-1">★</span>
                    <span className="text-xs text-gray-600">
                      {(product.rating || 4.5).toFixed(1)} ({product.reviews || 10})
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-primary text-sm">{formatPrice(product.khoangGia)}</span>
                </div>
                <Button size="sm" className="w-full" onClick={() => openModal(product.maSp)}>
                  <ShoppingCart size={14} className="mr-1" />
                  Thêm vào giỏ
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white rounded-lg p-4 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-lg font-medium">Chọn tùy chọn</h5>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                  <X size={16} />
                </Button>
              </div>
              <div className="mb-4">
                <label className="block font-bold mb-2">Màu sắc:</label>
                <div className="flex gap-2 flex-wrap">
                  {selectedProduct?.productDetails
                    .map((p) => p.mauSac)
                    .filter((color, index, self) => self.indexOf(color) === index && color)
                    .map((color) => (
                      <Button
                        key={color}
                        variant={selectedColor === color ? 'default' : 'outline'}
                        size="sm"
                        style={{
                          backgroundColor: selectedColor === color ? color.toLowerCase() : '',
                          color: selectedColor === color ? '#fff' : '',
                        }}
                        onClick={() => setSelectedColor(color)}
                        disabled={
                          !selectedProduct?.productDetails.some(
                            (p) => p.mauSac === color && p.soLuongTon > 0
                          )
                        }
                      >
                        {color}
                      </Button>
                    ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block font-bold mb-2">Kích thước:</label>
                <div className="flex gap-2 flex-wrap">
                  {selectedProduct?.productDetails
                    .filter((p) => p.mauSac === selectedColor)
                    .map((p) => p.kichThuoc)
                    .filter((size, index, self) => self.indexOf(size) === index && size)
                    .map((size) => (
                      <Button
                        key={size}
                        variant={selectedSize === size ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedSize(size)}
                        disabled={
                          !selectedProduct?.productDetails.some(
                            (p) => p.mauSac === selectedColor && p.kichThuoc === size && p.soLuongTon > 0
                          )
                        }
                      >
                        {size}
                      </Button>
                    ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block font-bold mb-2">Số lượng:</label>
                <div className="flex items-center">
                  <div className="flex items-center border rounded w-32">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity((prev) => Math.max(1, parseInt(prev) - 1).toString())}
                    >
                      -
                    </Button>
                    <input
                      type="number"
                      className="w-12 text-center border-none focus:ring-0"
                      value={quantity}
                      onChange={(e) => {
                        setQuantity(e.target.value);
                        validateQuantity();
                      }}
                      min="1"
                      max={
                        selectedProduct?.productDetails.find(
                          (p) => p.mauSac === selectedColor && p.kichThuoc === selectedSize
                        )?.soLuongTon || 0
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setQuantity((prev) =>
                          Math.min(
                            selectedProduct?.productDetails.find(
                              (p) => p.mauSac === selectedColor && p.kichThuoc === selectedSize
                            )?.soLuongTon || 0,
                            parseInt(prev) + 1
                          ).toString()
                        )
                      }
                    >
                      +
                    </Button>
                  </div>
                  <span className="ml-3 text-xs text-gray-500">
                    Còn{' '}
                    {selectedProduct?.productDetails.find(
                      (p) => p.mauSac === selectedColor && p.kichThuoc === selectedSize
                    )?.soLuongTon || 0}{' '}
                    sản phẩm
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={addToCart}
                  disabled={!selectedColor || !selectedSize || parseInt(quantity) <= 0}
                >
                  <ShoppingCart size={14} className="mr-1" />
                  Thêm vào giỏ
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default FavoritesPage;