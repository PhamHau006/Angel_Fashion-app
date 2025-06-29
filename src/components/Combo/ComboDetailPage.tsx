import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Heart,
  Share,
  ShoppingCart,
  MessageCircle,
  Plus,
  Minus,
  PackageCheck,
  Star
} from 'lucide-react';

// Import cart service
import {
  CartService,
  getCurrentCustomerId,
  validateComboCartData,
  formatPrice
} from '../../services/cartService';

import { getApiUrl } from '../../config/api';

// Interfaces based on Vue version
interface ComboVariant {
  maCtsp: number;
  kichThuoc: string;
  mauSac: string;
  soLuongTon: number;
  donGia: number;
  images?: Array<{ tenHinhAnh: string }>;
}

interface ComboProduct {
  maSp: number;
  tenSp: string;
  soLuongSp: number;
  sanPhamCTs: ComboVariant[];
  image?: string;
  colors: string[];
  sizes: string[];
  quantity: number;
  variants: ComboVariant[];
}

interface ComboDetail {
  maCombo: number;
  tenCombo: string;
  moTa: string;
  hinh: string;
  phanTramGiam: number | null;
  soTienGiam: number | null;
  soLuong: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  isActive: boolean;
  chitietcombos: ComboProduct[];
}

interface SelectedVariants {
  [productIndex: number]: {
    color: string;
    size: string;
  };
}

const API_URL = getApiUrl();

// Custom getImageUrl trong component (đảm bảo sử dụng isCombo)
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

export const ComboDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [combo, setCombo] = useState<ComboDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariants>({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // Fetch combo details
  const fetchCombo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/Combos/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error fetchAPI Combo');
      }

      const result = await response.json();
      console.log('🔍 Combo API response:', result);
      console.log('🔍 Combo image value from API:', result.hinh);

      const transformedCombo: ComboDetail = {
        maCombo: result.maCombo,
        tenCombo: result.tenCombo,
        hinh: result.hinh || 'product-1.jpg',
        soLuong: result.soLuong,
        moTa: result.moTa || 'Chưa có mô tả',
        phanTramGiam: result.phanTramGiam,
        soTienGiam: result.soTienGiam,
        ngayBatDau: result.ngayBatDau,
        ngayKetThuc: result.ngayKetThuc,
        isActive: result.isActive,
        chitietcombos: result.chitietcombos.map((ct: any) => ({
          maSp: ct.maSp,
          tenSp: ct.tenSp,
          image: ct.sanPhamCTs?.[0]?.images?.[0]?.tenHinhAnh || 'product-1.jpg',
          soLuongSp: ct.soLuongSp,
          quantity: ct.soLuongSp,
          variants: ct.sanPhamCTs || [],
          sanPhamCTs: ct.sanPhamCTs || [],
          colors: [...new Set((ct.sanPhamCTs || []).map((pd: any) => pd.mauSac).filter(Boolean))],
          sizes: [...new Set((ct.sanPhamCTs || []).map((pd: any) => pd.kichThuoc).filter(Boolean))],
        }))
      };

      setCombo(transformedCombo);

      const initialVariants: SelectedVariants = {};
      transformedCombo.chitietcombos.forEach((product, index) => {
        initialVariants[index] = {
          color: product.colors[0] || '',
          size: getAvailableSizes(product, product.colors[0] || '')[0] || '',
        };
      });
      setSelectedVariants(initialVariants);

    } catch (error) {
      console.error('Error fetching combo:', error);
      setError(error instanceof Error ? error.message : 'Không thể tải thông tin combo');
    } finally {
      setLoading(false);
    }
  };

  // Get available sizes for a product and color
  const getAvailableSizes = useCallback((product: ComboProduct, selectedColor: string): string[] => {
    const sizes = product.variants
      .filter((v) => v.mauSac === selectedColor && v.soLuongTon > 0)
      .map((v) => v.kichThuoc);
    return [...new Set(sizes)];
  }, []);

  // Validate quantity input
  const validateQuantity = () => {
    const value = quantity.trim();
    if (value === '') return;

    const number = parseInt(quantity);
    if (isNaN(number) || number < 1) {
      setQuantity('1');
    } else if (combo && number > combo.soLuong) {
      setQuantity(combo.soLuong.toString());
    } else {
      setQuantity(number.toString());
    }
  };

  // Handle variant selection
  const selectedVariant = (productIndex: number, type: 'color' | 'size', value: string) => {
    if (!combo) return;

    const newVariants = { ...selectedVariants };
    if (!newVariants[productIndex]) {
      newVariants[productIndex] = { color: '', size: '' };
    }

    newVariants[productIndex][type] = value;

    const product = combo.chitietcombos[productIndex];

    // If color changed, update size to first available size
    if (type === 'color') {
      const availableSizes = getAvailableSizes(product, value);
      if (availableSizes.length > 0) {
        newVariants[productIndex].size = availableSizes[0];
      }
    }

    // Check if variant is available
    const variant = product.variants.find(
      (v) =>
        v.mauSac === newVariants[productIndex].color &&
        v.kichThuoc === newVariants[productIndex].size
    );

    if (!variant || variant.soLuongTon <= 0) {
      toast({
        title: "Lỗi",
        description: "Biến thể này không có sẵn hoặc đã hết hàng!",
        variant: "destructive"
      });
      return;
    }

    setSelectedVariants(newVariants);
  };

  // Calculate original price
  const calculateOriginalPrice = (): number => {
    if (!combo) return 0;

    return combo.chitietcombos.reduce((total, product, index) => {
      const selectedColor = selectedVariants[index]?.color || product.colors[0];
      const selectedSize = selectedVariants[index]?.size || '';

      const variant = product.variants.find(
        (v) => v.kichThuoc === selectedSize && v.mauSac === selectedColor
      );

      if (variant) {
        return total + (variant.donGia * product.quantity);
      }
      return total;
    }, 0);
  };

  // Calculate combo price
  const calculateComboPrice = (): number => {
    if (!combo) return 0;

    const originalPrice = calculateOriginalPrice();

    if (combo.phanTramGiam) {
      return originalPrice - ((combo.phanTramGiam * originalPrice) / 100);
    } else if (combo.soTienGiam) {
      return originalPrice - combo.soTienGiam;
    }

    return originalPrice;
  };

  // ===== ADD COMBO TO CART FUNCTION =====
  const addToCart = async () => {
    const value = quantity.trim();
    if (value === '') {
      toast({
        title: "Lỗi",
        description: "Không để trống số lượng",
        variant: "destructive"
      });
      return;
    }

    if (!combo) return;

    // Validate all variants are selected
    const missingSelections = combo.chitietcombos.some((product, index) => {
      const variant = selectedVariants[index];
      return !variant || !variant.color || !variant.size;
    });

    if (missingSelections) {
      toast({
        title: "Thiếu lựa chọn",
        description: "Vui lòng chọn màu sắc và kích thước cho tất cả sản phẩm trong combo",
        variant: "destructive"
      });
      return;
    }

    // Check stock for all products in combo
    const stockIssues = combo.chitietcombos.find((product, index) => {
      const selectedColor = selectedVariants[index]?.color;
      const selectedSize = selectedVariants[index]?.size;
      const variant = product.variants.find(
        (v) => v.mauSac === selectedColor && v.kichThuoc === selectedSize
      );

      if (!variant) return true;

      const requiredQuantity = parseInt(quantity) * product.quantity;
      return variant.soLuongTon < requiredQuantity;
    });

    if (stockIssues) {
      toast({
        title: "Không đủ hàng",
        description: "Một số sản phẩm trong combo không đủ số lượng tồn kho",
        variant: "destructive"
      });
      return;
    }

    setAddingToCart(true);

    try {
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

      const customerId = parseInt(payload.sub, 10); // Lấy từ token
      const comboId = combo.maCombo;
      const quantityInt = parseInt(quantity);
      const originalPrice = calculateOriginalPrice();
      const comboPrice = calculateComboPrice();
      const discountAmount = originalPrice - comboPrice;

      // Prepare combo items similar to Vue
      const comboItems = combo.chitietcombos.map((product, index) => {
        const selectedColor = selectedVariants[index]?.color;
        const selectedSize = selectedVariants[index]?.size;
        const variant = product.variants.find(
          (v) => v.mauSac === selectedColor && v.kichThuoc === selectedSize
        );

        return {
          maCtsp: variant?.maCtsp || 0,
          soLuong: quantityInt * product.quantity,
          donGia: variant?.donGia || 0,
        };
      });

      console.log('🎁 Adding combo to cart with data:', {
        customerId,
        comboId,
        quantity: quantityInt,
        comboPrice,
        discountAmount,
        comboImage: combo.hinh,
        comboItems
      });

      // Validate cart data
      const validationError = validateComboCartData(
        customerId,
        comboId,
        quantityInt,
        comboPrice,
        comboItems
      );
      if (validationError) {
        toast({
          title: "Dữ liệu không hợp lệ",
          description: validationError,
          variant: "destructive"
        });
        return;
      }

      // Send request
      const response = await fetch(`${API_URL}/api/Cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          maKh: customerId,
          maCtsp: null,
          maCombo: comboId,
          soLuong: quantityInt,
          donGia: comboPrice,
          giamGia: discountAmount,
          tenHinhAnh: combo.hinh,
          giohangctcombos: comboItems,
        }),
      });

      const result = await response.json();
      console.log('🔍 Response from server:', result);

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
          title: "Đã thêm combo vào giỏ hàng",
          description: `${combo.tenCombo} x${quantity}`,
        });
        setQuantity('1'); // Reset quantity
      }
    } catch (error) {
      console.error('❌ Error adding combo to cart:', error);
      toast({
        title: "Lỗi không mong muốn",
        description: error.message || "Không thể thêm combo vào giỏ hàng",
        variant: "destructive"
      });
    } finally {
      setAddingToCart(false);
    }
  };

  // ===== BUY NOW FUNCTION =====
  const handleBuyNow = async () => {
    await addToCart();

    // If successfully added, navigate to cart
    if (!addingToCart) {
      setTimeout(() => {
        navigate('/cart');
      }, 1000);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCombo();
    }
  }, [id]);

  if (loading) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Đang tải thông tin combo...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (error || !combo) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Không tìm thấy combo
            </h3>
            <p className="text-gray-500 mb-4">{error || 'Combo không tồn tại'}</p>
            <Button onClick={() => navigate('/combos')}>
              Quay lại danh sách combo
            </Button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  const originalPrice = calculateOriginalPrice();
  const comboPrice = calculateComboPrice();
  const savingsAmount = originalPrice - comboPrice;

  return (
    <MobileLayout showBottomNav={false}>
      <div className="pb-20">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white border-b">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={24} />
            </Button>
            <h1 className="font-semibold text-lg truncate mx-4">Chi tiết combo</h1>
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

        <div className="container mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Section */}
            <div className="product-details-pic">
              <div className="relative">
                <img
                  src={getImageUrl(combo.hinh || 'product-1.jpg', true)} // Sử dụng isCombo: true
                  alt={combo.tenCombo}
                  className="w-full h-80 object-cover rounded-lg"
                  onError={(e) => { e.currentTarget.src = getImageUrl('product-1.jpg', true); }} // Fallback
                />

                {/* Discount Badges */}
                <div className="absolute top-4 left-4 space-y-2">
                  {combo.phanTramGiam && (
                    <Badge className="bg-red-500 text-white">
                      🔥 Giảm {combo.phanTramGiam}%
                    </Badge>
                  )}
                  {combo.soTienGiam && (
                    <Badge className="bg-red-500 text-white">
                      🔥 Giảm {formatPrice(combo.soTienGiam)}
                    </Badge>
                  )}
                </div>

                {/* Stock Badge */}
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="bg-white">
                    Còn {combo.soLuong} phần
                  </Badge>
                </div>
              </div>
            </div>

            {/* Product Details Text */}
            <div className="product-details-text space-y-6">
              {/* Title and Price */}
              <div>
                <h3 className="text-2xl font-bold mb-4">{combo.tenCombo}</h3>

                {/* Price Display */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl font-bold text-red-600">
                      {formatPrice(comboPrice)}
                    </span>
                    {originalPrice > comboPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                  </div>

                  {savingsAmount > 0 && (
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-500 text-white">
                        Tiết kiệm {formatPrice(savingsAmount)}
                      </Badge>
                      {combo.phanTramGiam && (
                        <span className="text-sm text-green-600">
                          (-{combo.phanTramGiam}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    <Star size={16} className="text-yellow-400 fill-current" />
                    <Star size={16} className="text-yellow-400 fill-current" />
                    <Star size={16} className="text-yellow-400 fill-current" />
                    <Star size={16} className="text-yellow-400 fill-current" />
                    <Star size={16} className="text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm">5.0</span>
                  </div>
                  <span className="text-sm text-gray-500">(Combo đặc biệt)</span>
                </div>
              </div>

              {/* Quantity and Add to Cart */}
              <div className="product-details-button space-y-4">
                <div className="quantity flex items-center space-x-3">
                  <span className="font-medium">Số lượng:</span>
                  <div className="pro-qty flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newQty = Math.max(1, parseInt(quantity) - 1);
                        setQuantity(newQty.toString());
                      }}
                      disabled={parseInt(quantity) <= 1}
                    >
                      <Minus size={16} />
                    </Button>
                    <input
                      type="text"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      onBlur={validateQuantity}
                      className="w-16 text-center border-0 outline-none"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newQty = Math.min(combo.soLuong, parseInt(quantity) + 1);
                        setQuantity(newQty.toString());
                      }}
                      disabled={parseInt(quantity) >= combo.soLuong}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>

                <div className="button-group space-y-3">
                  <Button
                    className="flex-2 bg-red-600 hover:bg-red-700"
                    onClick={addToCart}
                    disabled={addingToCart}
                  >
                    <ShoppingCart size={20} className="mr-2" />
                    {addingToCart ? 'Đang thêm...' : `Thêm combo - ${formatPrice(comboPrice * parseInt(quantity || '1'))}`}
                  </Button>

                  <Button
                    onClick={handleBuyNow}
                    disabled={addingToCart}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg"
                  >
                    {addingToCart ? 'Đang xử lý...' : 'Mua ngay'}
                  </Button>
                </div>
              </div>

              {/* Combo Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">
                  🎁 Combo này bao gồm {combo.chitietcombos.length} sản phẩm:
                </h4>
                <div className="space-y-2">
                  {combo.chitietcombos.map((product, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <PackageCheck size={16} className="text-blue-600" />
                      <span className="text-sm text-blue-700">
                        {product.tenSp} x{product.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Product Variants Selection */}
          <div className="product-details-widget mt-8">
            <h3 className="text-xl font-bold mb-6">Lựa chọn chi tiết sản phẩm</h3>
            <div className="variant-list space-y-6">
              {combo.chitietcombos.map((product, index) => (
                <Card key={index} className="variant-section">
                  <CardContent className="p-6">
                    <div className="variant-title mb-4 pb-4 border-b">
                      <div className="flex items-center space-x-3">
                        <img
                          src={getImageUrl(product.image || 'product-1.jpg', true)} // Sử dụng isCombo: true
                          alt={product.tenSp}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => { e.currentTarget.src = getImageUrl('product-1.jpg', true); }}
                        />
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800">
                            {product.tenSp}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Số lượng: {product.quantity}
                          </p>
                          <div className="flex items-center mt-1">
                            {selectedVariants[index] && (
                              <>
                                <Badge variant="outline" className="text-xs mr-2">
                                  {selectedVariants[index].color}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {selectedVariants[index].size}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="variant-options space-y-4">
                      {/* Color selection */}
                      {product.colors.length > 0 && (
                        <div className="variant-group">
                          <span className="variant-label block text-sm font-medium text-gray-600 mb-2">
                            Màu sắc:
                          </span>
                          <div className="color-checkbox flex gap-2 flex-wrap">
                            {product.colors.map((color, colorIndex) => (
                              <Button
                                key={colorIndex}
                                variant={selectedVariants[index]?.color === color ? "default" : "outline"}
                                size="sm"
                                onClick={() => selectedVariant(index, 'color', color)}
                                className={`${selectedVariants[index]?.color === color
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-gray-50 text-gray-700 border-gray-300'
                                  }`}
                              >
                                {color}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Size selection */}
                      {product.sizes.length > 0 && (
                        <div className="variant-group">
                          <span className="variant-label block text-sm font-medium text-gray-600 mb-2">
                            Kích thước:
                          </span>
                          <div className="size-checkbox flex gap-2 flex-wrap">
                            {getAvailableSizes(product, selectedVariants[index]?.color || product.colors[0]).map((size, sizeIndex) => (
                              <Button
                                key={sizeIndex}
                                variant={selectedVariants[index]?.size === size ? "default" : "outline"}
                                size="sm"
                                onClick={() => selectedVariant(index, 'size', size)}
                                className={`${selectedVariants[index]?.size === size
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-gray-50 text-gray-700 border-gray-300'
                                  }`}
                              >
                                {size}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stock Info */}
                      <div className="variant-group">
                        <div className="text-xs text-gray-500">
                          {selectedVariants[index] && (() => {
                            const variant = product.variants.find(
                              (v) =>
                                v.mauSac === selectedVariants[index].color &&
                                v.kichThuoc === selectedVariants[index].size
                            );
                            return variant ? (
                              <span className={variant.soLuongTon <= 5 ? 'text-orange-600' : 'text-green-600'}>
                                Còn {variant.soLuongTon} sản phẩm - {formatPrice(variant.donGia)}
                              </span>
                            ) : (
                              <span className="text-red-600">Hết hàng</span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Description Tab */}
          <div className="product-details-tab mt-12">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button className="border-b-2 border-red-600 text-red-600 py-3 px-6 text-sm font-medium">
                  MÔ TẢ COMBO
                </button>
              </nav>
            </div>
            <div className="tab-content py-6">
              <div className="tab-pane">
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {combo.moTa}
                  </p>

                  {/* Combo Benefits */}
                  <div className="mt-6 bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-3">
                      🌟 Ưu đãi khi mua combo:
                    </h4>
                    <ul className="space-y-2 text-sm text-green-700">
                      <li>✅ Tiết kiệm {formatPrice(savingsAmount)} so với mua lẻ</li>
                      <li>✅ Phối đồ hoàn hảo, được stylist tư vấn</li>
                      <li>✅ Miễn phí vận chuyển toàn quốc</li>
                      <li>✅ Đổi trả trong 30 ngày</li>
                      <li>✅ Tặng kèm túi xách cao cấp</li>
                    </ul>
                  </div>

                  {/* Combo Timeline */}
                  {combo.ngayBatDau && combo.ngayKetThuc && (
                    <div className="mt-6 bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-3">
                        ⏰ Thời gian khuyến mãi:
                      </h4>
                      <div className="text-sm text-orange-700">
                        <p>Từ: {new Date(combo.ngayBatDau).toLocaleDateString('vi-VN')}</p>
                        <p>Đến: {new Date(combo.ngayKetThuc).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Price Summary */}
          <div className="mt-8 bg-gray-50 p-6 rounded-lg">
            <h4 className="font-semibold text-lg mb-4">📊 Bảng giá chi tiết</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>Tổng giá sản phẩm lẻ:</span>
                <span className="line-through text-gray-500">{formatPrice(originalPrice)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Giảm giá combo:</span>
                <span className="text-red-600">-{formatPrice(savingsAmount)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Giá combo cuối cùng:</span>
                  <span className="text-2xl font-bold text-red-600">{formatPrice(comboPrice)}</span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded text-center">
                <span className="text-green-800 font-medium">
                  🎉 Bạn tiết kiệm được {formatPrice(savingsAmount)}
                  {combo.phanTramGiam && ` (${combo.phanTramGiam}%)`}!
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom action bar - Mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 md:hidden">
          <div className="flex space-x-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/messenger')}>
              <MessageCircle size={20} className="mr-2" />
              Chat
            </Button>
            <Button
              className="flex-2 bg-red-600 hover:bg-red-700"
              onClick={addToCart}
              disabled={addingToCart}
            >
              <ShoppingCart size={20} className="mr-2" />
              {addingToCart ? 'Đang thêm...' : `Thêm combo - ${formatPrice(comboPrice * parseInt(quantity || '1'))}`}
            </Button>
          </div>

          {/* Stock warning */}
          {combo.soLuong <= 5 && (
            <div className="mt-2 text-center text-sm text-orange-600">
              ⚠️ Chỉ còn {combo.soLuong} combo
            </div>
          )}

          {/* Selection status */}
          <div className="mt-2 text-center text-xs text-gray-500">
            {combo.chitietcombos.some((_, index) => {
              const variant = selectedVariants[index];
              return !variant || !variant.color || !variant.size;
            }) && (
              <span className="text-orange-600">
                Vui lòng chọn đầy đủ màu sắc và kích thước
              </span>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};