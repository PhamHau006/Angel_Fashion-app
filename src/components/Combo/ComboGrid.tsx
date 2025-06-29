import React, { useState, useEffect } from 'react';
import { ComboCard } from './ComboCard';
import { getApiEndpoint } from '../../config/api';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// API Response interfaces based on your C# backend
interface APIComboResponse {
  success: boolean;
  data: APICombo[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

interface APICombo {
  maCombo: number;
  tenCombo: string;
  hinh: string;
  phanTramGiam: number | null;
  soTienGiam: number | null;
  soLuong: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  moTa: string;
  isActive: boolean;
  chitietcombos: APIComboDetail[];
}

interface APIComboDetail {
  maSp: number;
  tenSp: string;
  soLuongSp: number;
  sanPhamCTs?: APIProductDetail[];
}

interface APIProductDetail {
  maCtsp: number;
  kichThuoc: string;
  mauSac: string;
  soLuongTon: number;
  donGia: number;
}

// Component-friendly interfaces
interface ComboItem {
  name: string;
  price: number;
  quantity: number;
}

interface Combo {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  discount: number;
  items: ComboItem[];
  savings: number;
  isHot?: boolean;
  isNew?: boolean;
  isPremium?: boolean;
  isPopular?: boolean;
  isLimited?: boolean;
  isTrending?: boolean;
  startDate: string;
  endDate: string;
  stock: number;
  isActive: boolean;
}

interface ComboGridProps {
  filters: {
    priceRange: [number, number];
    sortBy: string;
    search?: string;
  };
}

/**
 * Transform API combo data to component-friendly format
 */
const transformAPIComboToCombo = (apiCombo: APICombo): Combo => {
  console.log('🔄 Transforming API combo:', apiCombo.maCombo, apiCombo.tenCombo);
  
  // Calculate discount percentage or amount
  const discountPercent = apiCombo.phanTramGiam || 0;
  const discountAmount = apiCombo.soTienGiam || 0;
  
  // Transform combo items from chitietcombos
  const items: ComboItem[] = apiCombo.chitietcombos.map(detail => {
    // Calculate average price from product details if available
    let itemPrice = 0;
    if (detail.sanPhamCTs && detail.sanPhamCTs.length > 0) {
      const totalPrice = detail.sanPhamCTs.reduce((sum, pd) => sum + pd.donGia, 0);
      itemPrice = totalPrice / detail.sanPhamCTs.length;
    } else {
      // Fallback price estimation based on product name
      const productName = detail.tenSp.toLowerCase();
      if (productName.includes('áo khoác')) {
        itemPrice = 400000;
      } else if (productName.includes('quần jean')) {
        itemPrice = 300000;
      } else if (productName.includes('váy')) {
        itemPrice = 350000;
      } else if (productName.includes('áo sơ mi')) {
        itemPrice = 250000;
      } else {
        itemPrice = 200000; // Default price
      }
    }
    
    return {
      name: detail.tenSp,
      price: itemPrice,
      quantity: detail.soLuongSp
    };
  });
  
  // Calculate total original price from items
  const originalTotalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate discounted price
  let finalPrice = originalTotalPrice;
  if (discountPercent > 0) {
    finalPrice = originalTotalPrice * (1 - discountPercent / 100);
  } else if (discountAmount > 0) {
    finalPrice = originalTotalPrice - discountAmount;
  }
  
  const savings = originalTotalPrice - finalPrice;
  
  // Determine combo badges based on various factors
  const now = new Date();
  const startDate = new Date(apiCombo.ngayBatDau);
  const endDate = new Date(apiCombo.ngayKetThuc);
  const isNew = (now.getTime() - startDate.getTime()) < (7 * 24 * 60 * 60 * 1000); // New if created within 7 days
  const isHot = discountPercent >= 30 || (discountAmount && discountAmount >= 500000);
  const isPremium = originalTotalPrice >= 1000000;
  const isLimited = apiCombo.soLuong <= 10;
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isTrending = daysRemaining <= 7 && daysRemaining > 0; // Trending if ending soon
  
  return {
    id: apiCombo.maCombo,
    name: apiCombo.tenCombo,
    description: apiCombo.moTa || `Combo gồm ${items.length} sản phẩm`,
    price: Math.round(finalPrice),
    originalPrice: originalTotalPrice > finalPrice ? Math.round(originalTotalPrice) : undefined,
    image: apiCombo.hinh || 'placeholder.svg',
    rating: 4.0 + Math.random() * 1.0, // Generate random rating between 4-5
    reviews: Math.floor(Math.random() * 200) + 10,
    discount: discountPercent || Math.round((savings / originalTotalPrice) * 100),
    items: items,
    savings: Math.round(savings),
    isHot,
    isNew,
    isPremium,
    isPopular: !isNew && !isHot && discountPercent >= 15,
    isLimited,
    isTrending,
    startDate: apiCombo.ngayBatDau,
    endDate: apiCombo.ngayKetThuc,
    stock: apiCombo.soLuong,
    isActive: apiCombo.isActive
  };
};

/**
 * Fetch combos from API
 */
const fetchCombos = async (search?: string, page: number = 1): Promise<APIComboResponse> => {
  try {
    const params = new URLSearchParams();
    if (search) {
      params.append('search', search);
    }
    params.append('page', page.toString());
    
    const url = getApiEndpoint(`/api/Combos?${params.toString()}`);
    console.log('🌐 Fetching combos from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Combos fetched successfully:', data);
    
    // Transform the response to match expected format
    return {
      success: true,
      data: data.Data || data.data || [],
      totalItems: data.TotalItems || data.totalItems || 0,
      totalPages: data.TotalPages || data.totalPages || 1,
      currentPage: data.CurrentPage || data.currentPage || 1
    };
  } catch (error) {
    console.error('❌ Error fetching combos:', error);
    throw error;
  }
};

/**
 * Main ComboGrid component with API integration
 */
export const ComboGrid = ({ filters }: ComboGridProps) => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Load combos from API
  const loadCombos = async (search?: string, page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchCombos(search, page);
      
      // Transform API data to component format
      const transformedCombos = response.data.map(transformAPIComboToCombo);
      
      // Apply client-side filtering if needed
      let filteredCombos = transformedCombos;
      
      // Filter by price range
      if (filters.priceRange) {
        filteredCombos = filteredCombos.filter(combo => 
          combo.price >= filters.priceRange[0] && combo.price <= filters.priceRange[1]
        );
      }
      
      // Apply sorting
      switch (filters.sortBy) {
        case 'price-asc':
          filteredCombos.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filteredCombos.sort((a, b) => b.price - a.price);
          break;
        case 'discount':
          filteredCombos.sort((a, b) => b.discount - a.discount);
          break;
        case 'rating':
          filteredCombos.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
        default:
          filteredCombos.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
          break;
      }
      
      setCombos(filteredCombos);
      setPagination({
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalItems: response.totalItems
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu';
      setError(errorMessage);
      console.error('❌ Error loading combos:', err);
      
      // Fallback to demo data if API fails
      console.log('🔧 Using fallback demo data...');
      setCombos(getDemoCombos());
    } finally {
      setLoading(false);
    }
  };

  // Load combos on component mount and when filters change
  useEffect(() => {
    loadCombos(filters.search, 1);
  }, [filters.search]);

  // Reload when other filters change
  useEffect(() => {
    if (combos.length > 0) {
      loadCombos(filters.search, pagination.currentPage);
    }
  }, [filters.priceRange, filters.sortBy]);

  // Demo data fallback
  const getDemoCombos = (): Combo[] => [
    {
      id: 1,
      name: 'Combo Angel Office Lady',
      description: 'Áo sơ mi trắng + Chân váy đen + Blazer',
      price: 899000,
      originalPrice: 1299000,
      image: 'combo1.jpg',
      rating: 4.9,
      reviews: 156,
      discount: 31,
      items: [
        { name: 'Áo sơ mi Angel White', price: 399000, quantity: 1 },
        { name: 'Chân váy Angel Black', price: 350000, quantity: 1 },
        { name: 'Blazer Angel Classic', price: 550000, quantity: 1 }
      ],
      isHot: true,
      savings: 400000,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      stock: 15,
      isActive: true
    },
    {
      id: 2,
      name: 'Combo Angel Summer Vibes',
      description: 'Áo thun + Quần short + Mũ bucket',
      price: 459000,
      originalPrice: 649000,
      image: 'combo2.jpg',
      rating: 4.8,
      reviews: 203,
      discount: 29,
      items: [
        { name: 'Áo thun Angel Summer', price: 299000, quantity: 1 },
        { name: 'Quần short Angel Denim', price: 250000, quantity: 1 },
        { name: 'Mũ bucket Angel Style', price: 100000, quantity: 1 }
      ],
      isNew: true,
      savings: 190000,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      stock: 25,
      isActive: true
    }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">Đang tải combo...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4">
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <button 
              onClick={() => loadCombos(filters.search)}
              className="ml-2 text-primary underline"
            >
              Thử lại
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (!combos || combos.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎁</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Không tìm thấy combo nào
          </h3>
          <p className="text-gray-500 mb-4">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
          </p>
          <button 
            onClick={() => loadCombos()}
            className="text-primary underline"
          >
            Xem tất cả combo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Combo count and pagination info */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Hiển thị {combos.length} combo trong tổng số {pagination.totalItems} combo
          {filters.search && (
            <span> • Kết quả cho "{filters.search}"</span>
          )}
        </p>
      </div>

      {/* Combo grid */}
      <div className="space-y-4">
        {combos.map((combo) => (
          <ComboCard key={combo.id} combo={combo} />
        ))}
      </div>

      {/* Load more button if there are more pages */}
      {pagination.currentPage < pagination.totalPages && (
        <div className="mt-6 text-center">
          <button
            onClick={() => loadCombos(filters.search, pagination.currentPage + 1)}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                Đang tải...
              </>
            ) : (
              'Xem thêm combo'
            )}
          </button>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
          <details>
            <summary className="cursor-pointer font-semibold">Debug Info</summary>
            <div className="mt-2 space-y-1">
              <div>Total combos loaded: {combos.length}</div>
              <div>Current page: {pagination.currentPage}/{pagination.totalPages}</div>
              <div>Total items: {pagination.totalItems}</div>
              <div>Filters: {JSON.stringify(filters)}</div>
              <div>API Endpoint: {getApiEndpoint('/api/Combos')}</div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};