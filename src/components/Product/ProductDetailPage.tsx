// ProductDetailPage.tsx - Complete với Cart Integration

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Heart,
  Share,
  Star,
  ShoppingCart,
  MessageCircle,
  Camera,
  Sparkles,
  Upload,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { ProductReviews } from './ProductReviews';
import { SimilarProducts } from './SimilarProducts';
import { Capacitor } from '@capacitor/core';
import styles from './ProductDetailPage.module.css';

// Import cart service
import {
  CartService,
  getCurrentCustomerId,
  validateProductCartData
} from '../../services/cartService';

// Import API config
import { getApiUrl, getImageUrl, getDebugInfo } from '../../config/api';

interface ProductColor {
  name: string;
  value: string;
  color: string;
}

interface ProductImage {
  tenHinhAnh: string;
}

interface ProductDetail {
  id?: number;           // Product detail ID (maCtsp)
  mauSac?: string;
  kichThuoc?: string;
  donGia?: number;
  soLuongTon?: number | string;
  images?: ProductImage[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  productDetails: ProductDetail[];
  rating: number;
  reviews: number;
  isNew: boolean;
  colors: ProductColor[];
}

const API_URL = getApiUrl();

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [allImages, setAllImages] = useState<ProductImage[]>([]);
  const [currentImage, setCurrentImage] = useState(1);
  const [currentSlider, setCurrentSlider] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showTryOn, setShowTryOn] = useState(false);
  const [tryOnImage, setTryOnImage] = useState<File | null>(null);
  const [tryOnPreview, setTryOnPreview] = useState<string | null>(null);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnError, setTryOnError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug info
  useEffect(() => {
    const debugInfo = getDebugInfo();
    console.log('ProductDetail Debug Info:', debugInfo);
    console.log('ProductDetail API_URL:', API_URL);
    console.log('Platform:', Capacitor.getPlatform());
    console.log('IsNative:', Capacitor.isNativePlatform());
  }, []);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching product from:', API_URL);

        const response = await fetch(`${API_URL}/api/Shop/Product/${id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('🔍 Product data from API:', data);

        const images: ProductImage[] = [];
        const details = data.productDetails || [];
        const mappedDetails = details.map((detail: any) => {
          (detail.images || []).forEach((image: any) => images.push({ tenHinhAnh: image.tenHinhAnh }));
          return {
            id: detail.maCtsp,
            mauSac: detail.mauSac,
            kichThuoc: detail.kichThuoc,
            donGia: detail.donGia,
            soLuongTon: detail.soLuongTon,
            images: detail.images
          };
        });

        let moTa = data.moTa || '';
        moTa = moTa.replace(/\*\*([^*]+)\*\*/g, '<br><strong>$1</strong><br>').replace(/\n/g, '<br>');
        const colors = [...new Set(mappedDetails.map((d: any) => d.mauSac || '').filter((color: string) => color !== ''))]
          .map((color: string) => ({
            name: color,
            value: color.toLowerCase(),
            color: color === 'Trắng' ? '#FFFFFF' : color === 'Đen' ? '#000000' : '#EC4899',
          }));

        const mappedProduct: Product = {
          id: data.maSp,
          name: data.tenSanPham,
          description: moTa,
          productDetails: mappedDetails,
          rating: 4.8,
          reviews: 124,
          isNew: data.ngayTao && new Date(data.ngayTao) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          colors,
        };

        setProduct(mappedProduct);
        setAllImages(images);
        if (colors.length > 0) setSelectedColor(colors[0].value);
      } catch (error) {
        console.error('Product detail fetch error:', error);
        setError(error.message || 'Không thể tải sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Calculate available sizes based on selected color
  const sizes = product?.productDetails
    ?.filter((p) => p.mauSac?.toLowerCase() === selectedColor)
    ?.map((p) => p.kichThuoc || '') || [];

  // Auto-select first available size when color changes
  useEffect(() => {
    if (sizes.length > 0) {
      setSelectedSize(sizes[0]);
    }
  }, [selectedColor, sizes]);

  // Get selected product detail
  const selectedDetail = product?.productDetails?.find(
    (p) =>
      p.mauSac?.toLowerCase() === selectedColor &&
      p.kichThuoc?.toLowerCase() === selectedSize?.toLowerCase()
  );

  const originalPrice = selectedDetail?.donGia || 0;
  const maxQuantity = selectedDetail?.soLuongTon || 'Hết hàng';

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // ===== ADD TO CART FUNCTION =====
  const handleAddToCart = async () => {
    try {
      // Validate selection
      if (!selectedColor) {
        toast({
          title: "Chưa chọn màu sắc",
          description: "Vui lòng chọn màu sắc cho sản phẩm",
          variant: "destructive"
        });
        return;
      }

      if (!selectedSize) {
        toast({
          title: "Chưa chọn kích thước",
          description: "Vui lòng chọn kích thước cho sản phẩm",
          variant: "destructive"
        });
        return;
      }

      if (!selectedDetail) {
        toast({
          title: "Sản phẩm không tồn tại",
          description: "Không tìm thấy sản phẩm với thuộc tính đã chọn",
          variant: "destructive"
        });
        return;
      }

      // Validate token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy token, vui lòng đăng nhập lại",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      // Giả định validateToken (tương tự Vue)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Chuyển sang milliseconds
      if (Date.now() > exp) {
        toast({
          title: "Phiên hết hạn",
          description: "Vui lòng đăng nhập lại",
          variant: "destructive"
        });
        navigate('/login');
        return;
      }

      // Prepare cart data similar to Vue
      const customerId = parseInt(payload.sub, 10); // Lấy từ token
      const matchedDetail = product?.productDetails.find(
        (p) =>
          p.mauSac?.toLowerCase() === selectedColor.toLowerCase() &&
          p.kichThuoc?.toLowerCase() === selectedSize.toLowerCase()
      );

      if (!matchedDetail) {
        toast({
          title: "Không tìm thấy sản phẩm phù hợp",
          description: "Vui lòng chọn lại màu sắc hoặc kích thước",
          variant: "destructive"
        });
        return;
      }

      const content = {
        maKh: customerId,
        maCtsp: matchedDetail.id,
        maCombo: null,
        soLuong: quantity,
        donGia: matchedDetail.donGia || 0,
        giamGia: 0,
        tenHinhAnh: allImages.length > 0 ? allImages[0].tenHinhAnh : '',
        giohangctcombos: [],
      };

      console.log('🛒 Sending cart data:', content); // Debug payload

      // Send request
      const response = await fetch(`${API_URL}/api/Cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(content),
      });

      const result = await response.json();
      console.log('🔍 Response from server:', result); // Debug response

      if (!response.ok || !result.success) {
        toast({
          title: result.error || 'Đã xảy ra lỗi',
          description: result.message || 'Vui lòng thử lại',
          variant: "destructive"
        });
        return;
      }

      if (result.success) {
        toast({
          title: "Đã thêm sản phẩm vào giỏ hàng",
          description: `${product?.name} x${quantity} đã được thêm`,
          variant: "default"
        });
        setQuantity(1); // Reset quantity
      }
    } catch (error) {
      console.error('❌ Error in handleAddToCart:', error);
      toast({
        title: "Lỗi không mong muốn",
        description: error.message || "Có lỗi xảy ra khi thêm sản phẩm",
        variant: "destructive"
      });
    } finally {
      setAddingToCart(false);
    };
  };

  // ===== BUY NOW FUNCTION =====
  const handleBuyNow = async () => {
    await handleAddToCart();

    // If successfully added, navigate to cart
    if (!addingToCart) {
      setTimeout(() => {
        navigate('/cart');
      }, 1000);
    }
  };

  // ===== TRY-ON FUNCTIONS =====
  const handleTryOnImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setTryOnImage(file);
      const previewUrl = URL.createObjectURL(file);
      setTryOnPreview(previewUrl);
      setTryOnError(null);
    } else {
      setTryOnError('Vui lòng chọn file ảnh hợp lệ');
    }
  };

  const handleTryOn = async () => {
    if (!tryOnImage || !allImages[currentImage - 1]) {
      setTryOnError('Vui lòng tải ảnh của bạn và chọn ảnh sản phẩm');
      return;
    }

    setTryOnLoading(true);
    setTryOnError(null);

    try {
      // Mock try-on result
      const productImageUrl = getImageUrl(allImages[currentImage - 1].tenHinhAnh);
      setTimeout(() => {
        setTryOnResult(productImageUrl);
        setTryOnLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Try-on error:', error);
      setTryOnError('Có lỗi khi xử lý thử đồ');
      setTryOnLoading(false);
    }
  };

  // ===== IMAGE CAROUSEL FUNCTIONS =====
  const chunkSize = 4;
  const slideChunks = (() => {
    const chunks = [];
    for (let i = 0; i < allImages.length; i += chunkSize) {
      chunks.push(allImages.slice(i, i + chunkSize));
    }
    return chunks;
  })();

  const maxSlide = slideChunks.length || 1;

  const prevImage = () => {
    setCurrentSlider((prev) => (prev === 1 ? maxSlide : prev - 1));
    setCurrentImage((prev) => (prev === 1 ? allImages.length : prev - 1));
  };

  const nextImage = () => {
    setCurrentSlider((prev) => (prev === maxSlide ? 1 : prev + 1));
    setCurrentImage((prev) => (prev === allImages.length ? 1 : prev + 1));
  };

  const changeImage = (index: number) => {
    setCurrentImage(index);
    const chunkIndex = Math.floor((index - 1) / chunkSize) + 1;
    setCurrentSlider(chunkIndex);
  };

  const discountPercent = originalPrice && product?.productDetails?.[0]?.donGia && product.productDetails[0].donGia > originalPrice
    ? Math.round(((product.productDetails[0].donGia - originalPrice) / product.productDetails[0].donGia) * 100)
    : 0;

  const downloadResult = () => {
    if (tryOnResult) {
      const link = document.createElement('a');
      link.href = tryOnResult;
      link.download = `try-on-result-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const shareResult = async () => {
    if (navigator.share && tryOnResult) {
      try {
        const response = await fetch(tryOnResult);
        const blob = await response.blob();
        const file = new File([blob], 'try-on-result.jpg', { type: 'image/jpeg' });
        await navigator.share({
          title: 'Kết quả thử đồ AI',
          text: `Tôi vừa thử ${product?.name} với AI Try-On!`,
          files: [file],
        });
      } catch (error) {
        navigator.clipboard.writeText(window.location.href);
        alert('Đã copy link sản phẩm vào clipboard!');
      }
    }
  };

  if (error) return (
    <MobileLayout showBottomNav={false}>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Lỗi tải sản phẩm</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => navigate('/shop')}>
            Quay lại cửa hàng
          </Button>
        </div>
      </div>
    </MobileLayout>
  );

  if (loading) return (
    <MobileLayout showBottomNav={false}>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Đang tải sản phẩm...</p>
        </div>
      </div>
    </MobileLayout>
  );

  if (!product) return (
    <MobileLayout showBottomNav={false}>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Sản phẩm không tồn tại</h3>
          <p className="text-gray-500 mb-4">Không tìm thấy sản phẩm này</p>
          <Button onClick={() => navigate('/shop')}>
            Quay lại cửa hàng
          </Button>
        </div>
      </div>
    </MobileLayout>
  );

  return (
    <MobileLayout showBottomNav={false}>
      <div className="pb-20">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white border-b">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={24} />
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Share size={20} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart size={20} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
              </Button>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="bg-gray-50 relative">
          <div className="product-details-pic" style={{ position: 'relative', marginBottom: '20px' }}>
            <div className="product-details-slider-content">
              <div className="product-details-pic-slider">
                {allImages.map((image, index) => (
                  <div key={index} style={{ display: index + 1 === currentImage ? 'block' : 'none' }}>
                    <img
                      src={getImageUrl(image.tenHinhAnh)}
                      alt={product.name}
                      className="w-full h-auto object-cover"
                      style={{ maxHeight: '500px' }}
                      onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Thumbnail carousel */}
            <div className="product-details-thumbnails flex justify-center" style={{ maxWidth: '100%', margin: '20px' }}>
              <div className={styles.carousel}>
                <div className={styles.carouselInner}>
                  {slideChunks.map((imageGroup, index) => (
                    <div
                      key={index}
                      className={`${styles.carouselItem} ${currentSlider === index + 1 ? styles.active : ''}`}
                    >
                      <div className={styles.flexContainer} style={{ width: '100%' }}>
                        {imageGroup.map((image, imageIndex) => (
                          <img
                            key={imageIndex}
                            src={getImageUrl(image.tenHinhAnh)}
                            alt={`${product.name} ${imageIndex + 1}`}
                            className={`${styles.thumbnailImg} ${currentImage === index * chunkSize + imageIndex + 1 ? styles.active : ''}`}
                            onClick={() => changeImage(index * chunkSize + imageIndex + 1)}
                            onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={prevImage} className={styles.carouselControlPrev}>
                  <ChevronLeft size={24} />
                </button>
                <button onClick={nextImage} className={styles.carouselControlNext}>
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              {product.isNew && <Badge className="bg-green-500">Mới</Badge>}
              {discountPercent > 0 && <Badge className="bg-red-500">-{discountPercent}%</Badge>}
            </div>
            <h1 className="text-xl font-bold">{product.name}</h1>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-2xl font-bold text-primary">{formatPrice(originalPrice)}</span>
              {product.productDetails?.[0]?.donGia && product.productDetails[0].donGia > originalPrice && (
                <span className="text-gray-500 line-through">{formatPrice(product.productDetails[0].donGia)}</span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="flex items-center">
                <Star size={16} className="text-yellow-400 fill-current" />
                <span className="ml-1 text-sm">{product.rating}</span>
              </div>
              <span className="text-sm text-gray-500">({product.reviews} đánh giá)</span>
              <span className="text-sm text-gray-500">• Còn {maxQuantity} sản phẩm</span>
            </div>
          </div>

          {/* AI Try-On Section */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-lg">
            <div className="flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold">AI Thử Đồ</h3>
                <p className="text-sm text-white/80">Xem bạn mặc như thế nào</p>
              </div>
              <Button
                onClick={() => setShowTryOn(true)}
                className="bg-white text-purple-500 hover:bg-white/90"
              >
                <Sparkles size={16} className="mr-2" />
                Thử ngay
              </Button>
            </div>
          </div>

          {/* Color Selection */}
          {product.colors.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Màu sắc</h3>
              <div className="flex space-x-3">
                {product.colors.map((color) => (
                  <div
                    key={color.value}
                    className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer ${selectedColor === color.value ? 'border-primary bg-primary/20' : 'border-gray-200'
                      }`}
                    onClick={() => setSelectedColor(color.value)}
                  >
                    {/* <div
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.color }}
                    /> */}
                    <span className="text-sm">{color.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {sizes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Kích thước</h3>
              <div className="flex space-x-2">
                {sizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selection */}
          <div>
            <h3 className="font-semibold mb-2">Số lượng</h3>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={maxQuantity === 'Hết hàng' || quantity <= 1}
              >
                -
              </Button>
              <span className="w-12 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                disabled={maxQuantity === 'Hết hàng' || typeof maxQuantity === 'number' && quantity >= maxQuantity}
              >
                +
              </Button>
            </div>
          </div>

          {/* Product Description */}
          <div>
            <h3 className="font-semibold mb-2">Mô tả sản phẩm</h3>
            <div
              className="text-gray-600 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        </div>

        {/* Reviews and Similar Products */}
        <ProductReviews productId={parseInt(product.id, 10)} />
        <SimilarProducts />

        {/* AI Try-On Dialog */}
        <Dialog open={showTryOn} onOpenChange={setShowTryOn}>
          <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <span className="text-2xl mr-2">🤖</span>
                AI Thử Đồ
              </DialogTitle>
              <div className="text-sm text-gray-500">
                Tải ảnh của bạn để thử sản phẩm (Hiện tại là mock, chờ API)
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Sản phẩm thử:</h4>
                  <div className="flex items-center space-x-3">
                    <img
                      src={getImageUrl(allImages[currentImage - 1]?.tenHinhAnh)}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                    />
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-sm text-primary">{formatPrice(originalPrice)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Tải ảnh của bạn:</h4>
                  <div
                    className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors bg-blue-50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {tryOnPreview ? (
                      <img
                        src={tryOnPreview}
                        alt="Uploaded"
                        className="w-full h-48 object-cover rounded-lg border-2 border-blue-200"
                      />
                    ) : (
                      <>
                        <Upload size={32} className="mx-auto text-blue-500 mb-2" />
                        <p className="text-sm text-blue-700 mb-1 font-medium">Tải ảnh toàn thân</p>
                        <p className="text-xs text-blue-600">JPG, PNG (tối đa 10MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleTryOnImageUpload}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              {tryOnError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{tryOnError}</p>
                </div>
              )}

              <Button
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600"
                onClick={handleTryOn}
                disabled={!tryOnPreview || tryOnLoading}
              >
                {tryOnLoading ? 'Đang xử lý...' : 'Thử đồ với AI'}
              </Button>

              {tryOnResult && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Kết quả (Mock):</h4>
                    <div className="relative">
                      <img
                        src={tryOnResult}
                        alt="AI Try-on mock result"
                        className="w-full h-auto object-contain rounded-lg mb-3 border-2 border-green-200"
                      />
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                        Mock: Hiển thị sản phẩm
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={downloadResult}>
                        <Download size={16} className="mr-1" />
                        Tải xuống
                      </Button>
                      <Button variant="outline" size="sm" onClick={shareResult}>
                        <Share size={16} className="mr-1" />
                        Chia sẻ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t p-4">
          <div className="flex space-x-3">
            {/* Chat Button */}
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/messenger')}
            >
              <MessageCircle size={20} className="mr-2" />
              Chat
            </Button>

            {/* Add to Cart Button */}
            <Button
              className="flex-1"
              onClick={handleAddToCart}
              disabled={addingToCart || maxQuantity === 'Hết hàng'}
            >
              <ShoppingCart size={20} className="mr-2" />
              {addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ'}
            </Button>

            {/* Buy Now Button */}
            <Button
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              onClick={handleBuyNow}
              disabled={addingToCart || maxQuantity === 'Hết hàng'}
            >
              {addingToCart ? 'Đang xử lý...' : 'Mua ngay'}
            </Button>
          </div>

          {/* Stock status */}
          {maxQuantity === 'Hết hàng' && (
            <div className="mt-2 text-center text-sm text-red-500">
              ⚠️ Sản phẩm đã hết hàng
            </div>
          )}

          {typeof maxQuantity === 'number' && maxQuantity <= 5 && maxQuantity > 0 && (
            <div className="mt-2 text-center text-sm text-orange-500">
              ⚠️ Chỉ còn {maxQuantity} sản phẩm
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};