import React, { useState, useEffect } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { ComboGrid } from './ComboGrid';
import { SearchBar } from '../Shop/SearchBar';
import { Filter, X, Sliders, DollarSign, Calendar, Package, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ComboFilters {
  priceRange: [number, number];
  sortBy: string;
  search?: string;
  discountMin?: number;
  status?: 'all' | 'active' | 'ending-soon' | 'new';
  itemCount?: 'all' | '2-3' | '4-5' | '6+';
}

export const ComboPage = () => {
  const [filters, setFilters] = useState<ComboFilters>({
    priceRange: [0, 3000000],
    sortBy: 'newest',
    search: '',
    discountMin: 0,
    status: 'all',
    itemCount: 'all'
  });

  const [searchValue, setSearchValue] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Update active filters count
  useEffect(() => {
    let count = 0;
    
    // Check if price range is not default
    if (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 3000000) {
      count++;
    }
    
    // Check discount filter
    if (filters.discountMin && filters.discountMin > 0) {
      count++;
    }
    
    // Check status filter
    if (filters.status !== 'all') {
      count++;
    }
    
    // Check item count filter
    if (filters.itemCount !== 'all') {
      count++;
    }
    
    setActiveFiltersCount(count);
  }, [filters]);

  // Handle search with correct signature
  const handleSearch = (value: string) => {
    setSearchValue(value);
    
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value }));
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    setFilters(prev => ({ ...prev, sortBy: value }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      priceRange: [0, 3000000],
      sortBy: 'newest',
      search: searchValue,
      discountMin: 0,
      status: 'all',
      itemCount: 'all'
    });
    setIsFilterOpen(false);
  };

  // Apply filters
  const applyFilters = () => {
    setIsFilterOpen(false);
  };

  // Format price for display
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toString();
  };

  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Header */}
        <div className="bg-white sticky top-0 z-40 border-b">
          <div className="p-4">
            {/* Search Bar */}
            <SearchBar 
              placeholder="Tìm kiếm combo..." 
              onChange={handleSearch}
            />
            
            {/* Title and Controls */}
            <div className="flex items-center justify-between mt-3">
              <div>
                <h1 className="text-lg font-bold text-primary">Combo Hot 🔥</h1>
                <p className="text-xs text-gray-500 mt-1">
                  Tiết kiệm hơn khi mua combo
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Custom Sort Select using Select component */}
                <Select value={filters.sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="price-asc">Giá tăng</SelectItem>
                    <SelectItem value="price-desc">Giá giảm</SelectItem>
                    <SelectItem value="discount">Giảm giá</SelectItem>
                    <SelectItem value="rating">Đánh giá</SelectItem>
                    <SelectItem value="ending-soon">Sắp hết</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Filter Button */}
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1 relative"
                    >
                      <Filter size={16} />
                      <span>Lọc</span>
                      {activeFiltersCount > 0 && (
                        <Badge 
                          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center p-0"
                        >
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  
                  <SheetContent side="right" className="w-full sm:w-96">
                    <SheetHeader>
                      <SheetTitle className="flex items-center">
                        <Sliders className="mr-2" size={20} />
                        Bộ lọc combo
                      </SheetTitle>
                      <SheetDescription>
                        Tùy chỉnh để tìm combo phù hợp với bạn
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="mt-6 space-y-6">
                      {/* Price Range Filter */}
                      <div>
                        <div className="flex items-center mb-3">
                          <DollarSign size={16} className="mr-2 text-primary" />
                          <label className="text-sm font-medium">Khoảng giá</label>
                        </div>
                        <Slider
                          value={filters.priceRange}
                          onValueChange={(value) => 
                            setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))
                          }
                          max={3000000}
                          min={0}
                          step={50000}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{formatPrice(filters.priceRange[0])}đ</span>
                          <span>{formatPrice(filters.priceRange[1])}đ</span>
                        </div>
                      </div>

                      {/* Discount Filter */}
                      <div>
                        <div className="flex items-center mb-3">
                          <Badge className="mr-2 bg-red-100 text-red-700">%</Badge>
                          <label className="text-sm font-medium">Giảm giá tối thiểu</label>
                        </div>
                        <Select 
                          value={filters.discountMin?.toString() || '0'} 
                          onValueChange={(value) => 
                            setFilters(prev => ({ ...prev, discountMin: parseInt(value) }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn mức giảm giá" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Tất cả</SelectItem>
                            <SelectItem value="10">Từ 10%</SelectItem>
                            <SelectItem value="20">Từ 20%</SelectItem>
                            <SelectItem value="30">Từ 30%</SelectItem>
                            <SelectItem value="50">Từ 50%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <div className="flex items-center mb-3">
                          <Calendar size={16} className="mr-2 text-primary" />
                          <label className="text-sm font-medium">Trạng thái</label>
                        </div>
                        <Select 
                          value={filters.status} 
                          onValueChange={(value: 'all' | 'active' | 'ending-soon' | 'new') => 
                            setFilters(prev => ({ ...prev, status: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="active">Đang hoạt động</SelectItem>
                            <SelectItem value="ending-soon">Sắp hết hạn</SelectItem>
                            <SelectItem value="new">Combo mới</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Item Count Filter */}
                      <div>
                        <div className="flex items-center mb-3">
                          <Package size={16} className="mr-2 text-primary" />
                          <label className="text-sm font-medium">Số lượng sản phẩm</label>
                        </div>
                        <Select 
                          value={filters.itemCount} 
                          onValueChange={(value: 'all' | '2-3' | '4-5' | '6+') => 
                            setFilters(prev => ({ ...prev, itemCount: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="2-3">2-3 sản phẩm</SelectItem>
                            <SelectItem value="4-5">4-5 sản phẩm</SelectItem>
                            <SelectItem value="6+">6+ sản phẩm</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex space-x-2 mt-8">
                      <Button 
                        variant="outline" 
                        onClick={resetFilters}
                        className="flex-1"
                      >
                        <X size={16} className="mr-1" />
                        Xóa bộ lọc
                      </Button>
                      <Button 
                        onClick={applyFilters}
                        className="flex-1"
                      >
                        Áp dụng
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFiltersCount > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {filters.priceRange[0] !== 0 || filters.priceRange[1] !== 3000000 ? (
                  <Badge variant="secondary" className="text-xs">
                    Giá: {formatPrice(filters.priceRange[0])}đ - {formatPrice(filters.priceRange[1])}đ
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, priceRange: [0, 3000000] }))}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X size={10} />
                    </button>
                  </Badge>
                ) : null}

                {filters.discountMin && filters.discountMin > 0 ? (
                  <Badge variant="secondary" className="text-xs">
                    Giảm từ {filters.discountMin}%
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, discountMin: 0 }))}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X size={10} />
                    </button>
                  </Badge>
                ) : null}

                {filters.status !== 'all' ? (
                  <Badge variant="secondary" className="text-xs">
                    {filters.status === 'active' ? 'Đang hoạt động' :
                     filters.status === 'ending-soon' ? 'Sắp hết hạn' :
                     filters.status === 'new' ? 'Combo mới' : ''}
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X size={10} />
                    </button>
                  </Badge>
                ) : null}

                {filters.itemCount !== 'all' ? (
                  <Badge variant="secondary" className="text-xs">
                    {filters.itemCount} sản phẩm
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, itemCount: 'all' }))}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X size={10} />
                    </button>
                  </Badge>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Combo Products Grid */}
        <ComboGrid filters={filters} />
      </div>
    </MobileLayout>
  );
};