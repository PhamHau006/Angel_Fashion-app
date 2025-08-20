// Complete Fixed ProductCard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Heart, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl, getApiUrl, getAuthToken } from '../../config/api'; // Import from centralized config
import { Capacitor } from '@capacitor/core';

// API Product interface from backend
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

// ShopItemDTO interface (matching backend)
interface ShopItemDTO {
  id: number;
  name: string;
  type: string;
  image: string;
  priceRange?: string | null;
  discountPercentage?: number | null;
  discountAmount?: number | null;
}
// Interface for favorite product from API
interface FavoriteProduct {
  MaSp: number;
}
/**
 * Transform ShopItemDTO to Product
 */
const transformShopItemToProduct = (shopItem: ShopItemDTO): Product => {
  console.log('🔄 Transforming shop item:', shopItem);
  let price = 100000; 
  if (shopItem.priceRange) {
    const priceMatch = shopItem.priceRange.match(/\d+/);
    if (priceMatch) {
      price = parseInt(priceMatch[0]);
    }
  }
  
  // Use existing image or generate fallback
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
 * Transform APIProduct to Product
 */
const transformAPIProductToProduct = (apiProduct: APIProduct): Product => {
  console.log('🔄 API transform for product:', apiProduct.maSp, apiProduct.tenSanPham);
  
  // Get first productDetail for price and image
  const firstDetail = apiProduct.productDetails?.[0];
  
  if (!firstDetail) {
    console.warn('⚠️ No productDetails found, using fallback');
    return {
      id: apiProduct.maSp,
      name: apiProduct.tenSanPham || 'Unknown Product',
      price: 100000,
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
  
  // Extract price and image from first productDetail
  const price = firstDetail.donGia || 0;
  let image = 'placeholder.svg';
  
  if (firstDetail.images && firstDetail.images.length > 0) {
    const firstImage = firstDetail.images[0];
    if (firstImage && firstImage.tenHinhAnh && firstImage.tenHinhAnh.trim() !== '') {
      image = firstImage.tenHinhAnh;
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
  product: Product | APIProduct | ShopItemDTO;
  showDebugInfo?: boolean;
}

export const ProductCard = ({ product: rawProduct, showDebugInfo = false }: ProductCardProps) => {
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingFavorites, setIsFetchingFavorites] = useState(false);
  // Get consistent API URL
  const API_URL = getApiUrl();
  
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
      console.warn('⚠️ Invalid price detected, applying smart default');
      
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
  
  console.log('✅ Final product before render:', {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    hasValidPrice: product.price > 0
  });

  // Fetch user's favorite products to determine initial isFavorited state
  useEffect(() => {
    const fetchFavorites = async () => {
      const token = getAuthToken();
      if (!token) {
        console.log('🔑 No auth token, skipping favorites fetch');
        return;
      }

      setIsFetchingFavorites(true);
      try {
        const response = await fetch(`${API_URL}/api/Favorite/GetFavoriteProducts`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error fetching favorites:', response.status, errorText);
          return;
        }

        const result = await response.json();
        console.log('📦 Favorites API response:', result);

        // Handle different possible response structures
        let favoriteProducts: FavoriteProduct[] = [];
        if (result.success && result.data) {
          favoriteProducts = result.data;
        } else if (Array.isArray(result)) {
          favoriteProducts = result;
        } else if (result.data && Array.isArray(result.data)) {
          favoriteProducts = result.data;
        }

        // Check if current product is in favorites
        const isProductFavorited = favoriteProducts.some(
          (fav: FavoriteProduct) => fav.MaSp === product.id
        );
        setIsFavorited(isProductFavorited);
        console.log(`❤️ Product ${product.id} is ${isProductFavorited ? 'favorited' : 'not favorited'}`);
      } catch (err) {
        console.error('❌ Error fetching favorites:', err);
        // Don't set error state for UI, just log it
      } finally {
        setIsFetchingFavorites(false);
      }
    };

    fetchFavorites();
  }, [product.id, API_URL]);
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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    console.error(`❌ Image failed to load for product ${product.id}`);
    target.src = '/placeholder.svg';
  };

  const handleImageLoad = () => {
    console.log(`✅ Image loaded successfully for product ${product.id}`);
  };

  const handleAddToFavorites = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    console.log('❤️ FAVORITE BUTTON CLICKED! Product ID:', product.id);

    setIsLoading(true);
    setError(null);

    const token = getAuthToken();
    if (!token) {
      const errorMsg = 'Vui lòng đăng nhập để thêm/xóa sản phẩm yêu thích';
      console.error('❌ Auth Error:', errorMsg);
      setError(errorMsg);
      setIsLoading(false);
      return;
    }

    let customerId: number | null = null;
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        customerId = payload.sub ? parseInt(payload.sub) : null;
        console.log('👤 Customer ID from JWT sub:', customerId);
      }
    } catch (jwtError) {
      console.error('❌ Error decoding JWT:', jwtError);
    }

    if (!customerId) {
      try {
        const customerIdKeys = ['customerId', 'userId', 'customer_id', 'user_id'];
        for (const key of customerIdKeys) {
          const id = localStorage.getItem(key);
          if (id && id.trim() !== '') {
            const parsedId = parseInt(id, 10);
            if (!isNaN(parsedId)) {
              customerId = parsedId;
              console.log(`👤 Using backup customer ID from localStorage key: ${key}, value: ${customerId}`);
              break;
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Error getting backup customer ID:', error);
      }
    }

    try {
      const payload = customerId
        ? { MaKh: customerId, MaSp: product.id }
        : { MaSp: product.id };

      if (isFavorited) {
        // Remove from favorites
        const response = await fetch(`${API_URL}/api/Favorite/DeleteFavoriteProducts`, {
          method: 'DELETE',
          headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error removing favorite:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        console.log('✅ Removed from favorites:', product.id);
        setIsFavorited(false);
      } else {
        // Add to favorites
        const response = await fetch(`${API_URL}/api/Favorite/AddFavoriteProduct`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error adding favorite:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        console.log('✅ Added to favorites:', product.id);
        setIsFavorited(true);
      }
    } catch (err) {
      console.error('❌ Error in favorite operation:', err);
      let errorMessage = isFavorited
        ? 'Không thể xóa sản phẩm khỏi yêu thích'
        : 'Không thể thêm sản phẩm vào yêu thích';
      if (err instanceof Error) {
        try {
          const errorObj = JSON.parse(err.message.replace(/^HTTP \d+: /, ''));
          errorMessage = errorObj.message || errorMessage;
        } catch {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('🏁 Favorite operation completed');
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <CardContent className="p-3">
        <div className="relative mb-3 group">
          {/* Debug overlay - only show if enabled */}
         

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
          
          {/* Favorite button with enhanced visibility and debugging */}
          <button 
            className={`absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white transition-all duration-200 z-10 border border-gray-200 shadow-sm ${
              isLoading 
                ? 'opacity-50 cursor-not-allowed' 
                : 'opacity-100 hover:scale-110 active:scale-95'
            }`}
            onClick={(e) => {
              console.log('🖱️ Favorite button clicked (before handler)');
              handleAddToFavorites(e);
            }}
            disabled={isLoading}
            title={isFavorited ? 'Đã thêm vào yêu thích' : 'Thêm vào yêu thích'}
          >
            <Heart 
              size={16} 
              className={`transition-colors ${
                isFavorited 
                  ? 'text-red-500 fill-red-500' 
                  : 'text-gray-600 hover:text-red-500'
              }`} 
            />
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

          {/* Show error message or loading state */}
          {error && (
            <div className="absolute bottom-2 left-2 right-2 bg-red-100 border border-red-300 text-red-700 px-2 py-1 rounded text-xs z-10 animate-fadeIn">
              {error}
            </div>
          )}
          
          {isLoading && (
            <div className="absolute bottom-2 left-2 right-2 bg-blue-100 border border-blue-300 text-blue-700 px-2 py-1 rounded text-xs z-10 animate-fadeIn">
              Đang thêm vào yêu thích...
            </div>
          )}
          
          {isFavorited && !isLoading && !error && (
            <div className="absolute bottom-2 left-2 right-2 bg-green-100 border border-green-300 text-green-700 px-2 py-1 rounded text-xs z-10 animate-fadeIn">
              ✅ Đã thêm vào yêu thích
            </div>
          )}
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
// FIXED PRODUCTGRID COMPONENT WITH CONSISTENT API USAGE
// -------------------------------------------------------------------

interface ProductGridProps {
  filters: any;
}

export const ProductGrid = ({ filters }: ProductGridProps) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use consistent API URL from config
  const API_URL = getApiUrl();

  useEffect(() => {
    console.log('ProductGrid using consistent API_URL:', API_URL);
    console.log('Platform info:', {
      isNative: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform()
    });
  }, [API_URL]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Fetching products from:', API_URL);
        console.log('🔍 Applied filters:', filters);

        const queryParams = new URLSearchParams({
          search: filters.search || '',
          selectedBigCategory: filters.category || '',
          sortByPrice: filters.sortBy === 'price-low' ? 'asc' : filters.sortBy === 'price-high' ? 'desc' : '',
          filterPrice: filters.priceRange?.join('-') || '',
          page: '1',
        });

        const fullUrl = `${API_URL}/api/Shop?${queryParams}`;
        console.log('🌐 Full request URL:', fullUrl);

        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error Response:', errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('📦 Raw API result:', result);

        // Handle the response based on backend structure
        let productData = [];
        
        if (result.success && result.data) {
          productData = result.data;
          console.log('✅ Using result.data (success format)');
        } else if (Array.isArray(result)) {
          productData = result;
          console.log('✅ Using direct array result');
        } else if (result.data && Array.isArray(result.data)) {
          productData = result.data;
          console.log('✅ Using result.data (direct format)');
        } else {
          console.warn('⚠️ Unexpected API response structure:', result);
          productData = [];
        }

        console.log('📋 Product data to process:', productData);

        // Map the data correctly based on ShopItemDTO structure
        const mappedProducts = productData.map((item: any, index: number) => {
          console.log(`🔄 Mapping item ${index}:`, item);
          
          // Handle both camelCase and PascalCase properties
          const mappedItem = {
            id: item.id || item.Id || index + 1000, // Ensure unique ID
            name: item.name || item.Name || `Sản phẩm ${index + 1}`,
            type: item.type || item.Type || 'Product',
            image: item.image || item.Image || '',
            priceRange: item.priceRange || item.PriceRange || null,
            discountPercentage: item.discountPercentage || item.DiscountPercentage || null,
            discountAmount: item.discountAmount || item.DiscountAmount || null,
          };
          
          console.log(`✅ Mapped item ${index}:`, mappedItem);
          return mappedItem;
        });
        
        console.log('🎯 Final mapped products:', mappedProducts);
        setProducts(mappedProducts);
        
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải sản phẩm');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [filters, API_URL]);

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Đang tải sản phẩm...</p>
          <p className="text-xs text-gray-400 mt-1">API: {API_URL}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex justify-center items-center min-h-32">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-2">❌ Lỗi: {error}</p>
          <p className="text-xs text-gray-400 mb-3">API: {API_URL}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-primary/90 transition-colors"
          >
            🔄 Thử lại
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
            key={`product-${product.id}-${index}`} 
            product={product}
            showDebugInfo={process.env.NODE_ENV === 'development'}
          />
        ))}
      </div>
      
      {products.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">🔍 Không tìm thấy sản phẩm nào</p>
          <p className="text-xs text-gray-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;