
import React, { useState } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { ProductGrid } from './ProductGrid';
import { FilterSheet } from './FilterSheet';
import { SearchBar } from './SearchBar';
import { CategoryTabs } from './CategoryTabs';
import { SortSelect } from './SortSelect';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ShopPage = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: [0, 2000000],
    sizes: [],
    colors: [],
    sortBy: 'newest'
  });

  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Header */}
        <div className="bg-white sticky top-0 z-40 border-b">
          <div className="p-4">
            <SearchBar />
            <div className="flex items-center justify-between mt-3">
              <CategoryTabs />
              <div className="flex items-center space-x-2">
                <SortSelect value={filters.sortBy} onChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(true)}
                  className="flex items-center space-x-1"
                >
                  <Filter size={16} />
                  <span>Lọc</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <ProductGrid filters={filters} />

        {/* Filter Sheet */}
        <FilterSheet
          open={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
    </MobileLayout>
  );
};
