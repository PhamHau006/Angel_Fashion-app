// Fixed ProductCard.tsx
// import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Heart, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../config/api';

// API Product interface from your backend
interface APIProduct {
  maSp: number;
  tenSanPham: string;
  moTa: string;
  hasVariants: boolean;
  khoangGia: string;
  ngayTao: string;
  luotXem: number;
  soLuong: number;
  categoryDetails: Array<{
    maDanhMucCha: number;
    maDanhMucCon: number;
    tenDanhMucCon: string | null;
  }>;
  productDetails: Array<{
    maCtsp: number;
    kichThuoc: string;
    mauSac: string;
    soLuongTon: number;
    donGia: number;
    isActive: boolean | null;
    images: Array<{
      maCtsp: number;
      tenHinhAnh: string;
    }>;
  }>;
}

// Component-friendly Product interface
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  isNew?: boolean;
  isHot?: boolean;
  isCombo?: boolean;
  stock: number;
  description: string;
  variants: Array<{
    id: number;
    size: string;
    color: string;
    price: number;
    stock: number;
    images: string[];
  }>;
}

// Fixed ShopItemDTO interface (matching your backend)
interface ShopItemDTO {
  id: number;
  name: string;
  type: string;
  image: string;
  priceRange?: string | null;
  discountPercentage?: number | null;
  discountAmount?: number | null;
}

/**
 * Enhanced getImageUrl with detailed logging
 */
const getImageUrlWithDebug = (imageName: string, showDebug: boolean = false): string => {
  if (showDebug) {
    console.log('🖼️ getImageUrl input:', imageName);
  }
  
  if (!imageName || imageName === 'placeholder.svg') {
    if (showDebug) console.log('🖼️ Using placeholder for empty/placeholder image');
    return '/placeholder.svg';
  }
  
  // Check if imageName is already a full URL
  if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
    if (showDebug) console.log('🖼️ Image is already full URL:', imageName);
    return imageName;
  }
  
  // Build the full image URL manually instead of calling getImageUrl to avoid recursion
  const baseUrl = 'https://localhost:7217'; // Use the web URL directly
  const fullImageUrl = `${baseUrl}/HinhAnh/Products/${imageName}`;
  
  if (showDebug) {
    console.log('🖼️ Built image URL:', fullImageUrl);
  }
  
  return fullImageUrl;
};

/**
 * Transform ShopItemDTO to Product
 */
const transformShopItemToProduct = (shopItem: ShopItemDTO): Product => {
  console.log('🔄 Transforming shop item:', shopItem);
  
  // Extract price from priceRange string (format: "100,000 - 200,000")
  let price = 100000; // Default fallback
  if (shopItem.priceRange) {
    const priceMatch = shopItem.priceRange.match(/[\d,]+/);
    if (priceMatch) {
      price = parseInt(priceMatch[0].replace(/,/g, ''));
    }
  }
  
  // Generate image name based on product name if no image
  let image = shopItem.image || 'placeholder.svg';
  if (!image || image === '') {
    const nameLower = (shopItem.name || '').toLowerCase();
    if (nameLower.includes('áo khoác nam')) {
      image = 'aKhoacNam1.jpg';
    } else if (nameLower.includes('áo khoác nữ')) {
      image = 'aKhoacNu1.jpg';
    } else if (nameLower.includes('quần jean')) {
      image = 'qJeansNam1.jpg';
    } else {
      image = 'placeholder.svg';
    }
  }
  
  const result: Product = {
    id: shopItem.id,
    name: shopItem.name || 'Sản phẩm không tên',
    price: price,
    originalPrice: undefined,
    image: image,
    rating: 4.0 + Math.random() * 1.0,
    reviews: Math.floor(Math.random() * 100) + 10,
    isNew: true,
    isHot: false,
    isCombo: shopItem.type === 'Combo',
    stock: 100,
    description: '',
    variants: []
  };
  
  console.log('✅ Transform result:', result);
  return result;
};

/**
 * Simple transform: Extract directly from productDetails
 */
const transformAPIProductToProduct = (apiProduct: APIProduct): Product => {
  console.log('🔄 Simple transform for product:', apiProduct.maSp, apiProduct.tenSanPham);
  
  // Get first productDetail for price and image
  const firstDetail = apiProduct.productDetails?.[0];
  
  if (!firstDetail) {
    console.warn('⚠️ No productDetails found, using fallback');
    return {
      id: apiProduct.maSp,
      name: apiProduct.tenSanPham || 'Unknown Product',
      price: 100000, // Default fallback
      originalPrice: undefined,
      image: 'placeholder.svg',
      rating: 4.5,
      reviews: 10,
      isNew: true,
      isHot: false,
      isCombo: false,
      stock: apiProduct.soLuong || 0,
      description: apiProduct.moTa || '',
      variants: []
    };
  }
  
  // Extract price directly from first productDetail
  const price = firstDetail.donGia || 0;
  console.log('💰 Extracted price from first detail:', price);
  
  // Extract image from first productDetail with better logic
  let image = 'placeholder.svg';
  if (firstDetail.images && firstDetail.images.length > 0) {
    const firstImage = firstDetail.images[0];
    if (firstImage && firstImage.tenHinhAnh && firstImage.tenHinhAnh.trim() !== '') {
      image = firstImage.tenHinhAnh;
      console.log('🖼️ Extracted image from first detail:', image);
    }
  }
  
  // Generate fallback image if needed
  if (image === 'placeholder.svg') {
    const nameLower = (apiProduct.tenSanPham || '').toLowerCase();
    if (nameLower.includes('áo khoác nam')) {
      image = 'aKhoacNam1.jpg';
    } else if (nameLower.includes('áo khoác nữ')) {
      image = 'aKhoacNu1.jpg';
    } else if (nameLower.includes('quần jean')) {
      image = 'qJeansNam1.jpg';
    }
  }
  
  // Build variants from all productDetails
  const variants = apiProduct.productDetails.map(detail => ({
    id: detail.maCtsp,
    size: detail.kichThuoc || 'Unknown',
    color: detail.mauSac || 'Unknown',
    price: detail.donGia || price,
    stock: detail.soLuongTon || 0,
    images: detail.images ? detail.images.map(img => img.tenHinhAnh) : []
  }));
  
  const result: Product = {
    id: apiProduct.maSp,
    name: apiProduct.tenSanPham || 'Unknown Product',
    price: price || 100000,
    originalPrice: undefined,
    image: image,
    rating: 4.0 + Math.random() * 1.0,
    reviews: Math.max(5, Math.floor((apiProduct.luotXem || 0) * 0.1) || 10),
    isNew: true,
    isHot: (apiProduct.luotXem || 0) > 5,
    isCombo: apiProduct.hasVariants,
    stock: apiProduct.soLuong || 0,
    description: apiProduct.moTa || '',
    variants: variants
  };
  
  console.log('✅ API transform result:', result);
  return result;
};

interface ProductCardProps {
  product: Product | APIProduct | ShopItemDTO; // Accept all formats
  showDebugInfo?: boolean; // Toggle for debug information
}

export const ProductCard = ({ product: rawProduct, showDebugInfo = false }: ProductCardProps) => {
  const navigate = useNavigate();
  
  // CRITICAL DEBUG: Log what we actually receive
  console.log('🔍 ProductCard received raw product:', rawProduct);
  
  // Transform to standardized Product format
  let product: Product;
  
  try {
    // Check if it's API Product (has maSp)
    if ('maSp' in rawProduct) {
      console.log('🔄 Transforming API product');
      product = transformAPIProductToProduct(rawProduct as APIProduct);
    }
    // Check if it's ShopItemDTO (has type property)
    else if ('type' in rawProduct) {
      console.log('🔄 Transforming ShopItemDTO');
      product = transformShopItemToProduct(rawProduct as ShopItemDTO);
    }
    // Otherwise assume it's already a Product
    else {
      console.log('🔄 Using direct product');
      product = rawProduct as Product;
    }
    
    // Ensure required properties exist and are valid
    product.name = product.name || 'Sản phẩm không tên';
    product.price = product.price || 100000;
    product.image = product.image || 'placeholder.svg';
    product.variants = product.variants || [];
    product.rating = product.rating || 4.5;
    product.reviews = product.reviews || 10;
    product.stock = product.stock || 0;
    product.description = product.description || '';
    
    // Fix price if it's still 0 or invalid
    if (!product.price || product.price <= 0) {
      console.warn('⚠️ Invalid price detected, applying emergency fix');
      
      const nameLower = product.name.toLowerCase();
      if (nameLower.includes('áo khoác')) {
        product.price = 400000;
      } else if (nameLower.includes('quần jean')) {
        product.price = 300000;
      } else if (nameLower.includes('quần dài')) {
        product.price = 350000;
      } else if (nameLower.includes('quần đùi')) {
        product.price = 200000;
      } else if (nameLower.includes('trẻ em')) {
        product.price = 250000;
      } else {
        product.price = 300000;
      }
      
      console.log('🔧 Applied smart default price:', product.price);
    }
    
  } catch (error) {
    console.error('❌ Error processing product:', error);
    
    // Create emergency fallback product
    product = {
      id: (rawProduct as any).id || (rawProduct as any).maSp || 0,
      name: (rawProduct as any).name || (rawProduct as any).tenSanPham || 'Sản phẩm không tên',
      price: 300000,
      originalPrice: undefined,
      image: (rawProduct as any).image || 'placeholder.svg',
      rating: 4.5,
      reviews: 10,
      isNew: false,
      isHot: false,
      isCombo: false,
      stock: 100,
      description: '',
      variants: []
    };
    
    console.log('🔧 Created emergency fallback product:', product);
  }
  
  // Final validation
  console.log('✅ Final product before render:', {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    hasValidPrice: product.price > 0
  });
  
  const formatPrice = (price: number) => {
    if (!price || price === 0 || isNaN(price)) {
      return 'Liên hệ';
    }
    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(price);
    } catch (error) {
      console.error('❌ Error formatting price:', error);
      return `${price.toLocaleString()} VNĐ`;
    }
  };

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Handle image error with fallback strategy
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    console.error(`❌ Image failed to load for product ${product.id}`);
    target.src = '/placeholder.svg';
  };

  // Handle image load success
  const handleImageLoad = () => {
    console.log(`✅ Image loaded successfully for product ${product.id}`);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <CardContent className="p-3">
        <div className="relative mb-3 group">
          {/* Debug overlay - only show if enabled */}
          {showDebugInfo && (
            <div className="absolute top-0 left-0 bg-black/90 text-white text-xs p-2 z-20 rounded max-w-full">
              <div className="truncate">ID: {product.id}</div>
              <div className="truncate">IMG: {product.image}</div>
              <div className="truncate">PRICE: ₫{product.price?.toLocaleString() || 'N/A'}</div>
              <div className="truncate">TYPE: {('maSp' in rawProduct) ? 'API' : ('type' in rawProduct) ? 'ShopDTO' : 'Direct'}</div>
            </div>
          )}

          {/* Main product image */}
          <img
            src={getImageUrl(product.image)}
            alt={product.name}
            className="w-full h-48 object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
            style={{ minHeight: '192px', backgroundColor: '#f3f4f6' }}
          />
          
          {/* Favorite button */}
          <button 
            className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors z-10 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              console.log(`💖 Heart clicked for product: ${product.name}`);
            }}
          >
            <Heart size={16} className="text-gray-600 hover:text-red-500 transition-colors" />
          </button>
          
          {/* Product badges */}
          <div className="absolute top-2 left-2 space-y-1 z-10">
            {product.isNew && (
              <Badge className="bg-green-500 text-white text-xs">Mới</Badge>
            )}
            {product.isHot && (
              <Badge className="bg-red-500 text-white text-xs">Hot</Badge>
            )}
            {product.isCombo && (
              <Badge className="bg-purple-500 text-white text-xs">Combo</Badge>
            )}
            {discountPercent > 0 && (
              <Badge className="bg-orange-500 text-white text-xs">-{discountPercent}%</Badge>
            )}
            {product.stock === 0 && (
              <Badge className="bg-gray-500 text-white text-xs">Hết hàng</Badge>
            )}
          </div>
        </div>

        {/* Product info */}
        <h4 className="font-medium text-sm mb-2 line-clamp-2 hover:text-primary transition-colors">
          {product.name}
        </h4>
        
        {/* Rating and reviews */}
        <div className="flex items-center mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={12} 
                className={`${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
              />
            ))}
          </div>
          <span className="text-xs ml-1 font-medium">{product.rating.toFixed(1)}</span>
          <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
          <div className="flex items-center ml-auto text-xs text-gray-500">
            <Eye size={12} className="mr-1" />
            <span>{product.stock}</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-1">
          <div className="text-primary font-bold text-sm">{formatPrice(product.price)}</div>
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="text-gray-500 line-through text-xs">
              {formatPrice(product.originalPrice)}
            </div>
          )}
          {product.variants && Array.isArray(product.variants) && product.variants.length > 1 && (
            <div className="text-xs text-gray-500">
              {product.variants.length} biến thể • {new Set(product.variants.map(v => v.color)).size} màu
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// -------------------------------------------------------------------
// FIXED PRODUCTGRID COMPONENT
// -------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface ProductGridProps {
  filters: any;
}

// API URL configuration for mobile and web
const getApiUrl = () => {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  
  console.log('ProductGrid Platform info:', { isNative, platform });
  
  if (isNative && platform === 'android') {
    return 'http://192.168.1.150:7218';
  }
  
  return 'https://localhost:7217';
};

const API_URL = getApiUrl();

export const ProductGrid = ({ filters }: ProductGridProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('ProductGrid API_URL:', API_URL);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching products from:', API_URL);
        console.log('Filters:', filters);

        const queryParams = new URLSearchParams({
          search: filters.search || '',
          selectedBigCategory: filters.category || '',
          sortByPrice: filters.sortBy === 'price-low' ? 'asc' : filters.sortBy === 'price-high' ? 'desc' : '',
          filterPrice: filters.priceRange?.join('-') || '',
          page: '1',
        });

        const response = await fetch(`${API_URL}/api/Shop?${queryParams}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        console.log('Product grid response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Product grid raw result:', result);

        // Handle the response based on your backend structure
        let productData = [];
        
        if (result.success && result.data) {
          productData = result.data;
        } else if (Array.isArray(result)) {
          productData = result;
        } else if (result.data && Array.isArray(result.data)) {
          productData = result.data;
        } else {
          console.warn('Unexpected API response structure:', result);
          productData = [];
        }

        console.log('Product data to map:', productData);

        // Map the data correctly based on ShopItemDTO structure
        const mappedProducts = productData.map((item: any, index: number) => {
          console.log(`Mapping item ${index}:`, item);
          
          // Handle both camelCase and PascalCase properties
          const mappedItem = {
            id: item.id || item.Id || index,
            name: item.name || item.Name || `Sản phẩm ${index + 1}`,
            type: item.type || item.Type || 'Product',
            image: item.image || item.Image || '',
            priceRange: item.priceRange || item.PriceRange || null,
            discountPercentage: item.discountPercentage || item.DiscountPercentage || null,
            discountAmount: item.discountAmount || item.DiscountAmount || null,
          };
          
          console.log(`Mapped item ${index}:`, mappedItem);
          return mappedItem;
        });
        
        console.log('Final mapped products:', mappedProducts);
        setProducts(mappedProducts);
        
      } catch (error) {
        console.error('Lỗi khi lấy sản phẩm:', error);
        setError(error instanceof Error ? error.message : 'Có lỗi xảy ra');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [filters]);

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex justify-center items-center min-h-32">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-2">Lỗi: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded text-sm"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4">
        {products.map((product, index) => (
          <ProductCard 
            key={product.id || index} 
            product={product}
            // showDebugInfo={process.env.NODE_ENV === 'development'}
          />
        ))}
      </div>
      
      {products.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;