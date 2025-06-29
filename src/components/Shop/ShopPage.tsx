// ShopPage.tsx
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
    search: '',
    category: '',
    priceRange: [0, 2000000],
    sizes: [],
    colors: [],
    sortBy: 'newest',
  });

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  return (
    <MobileLayout>
      <div className="pb-20">
        <div className="bg-white sticky top-0 z-40 border-b">
          <div className="p-4">
            <SearchBar onChange={handleSearchChange} />
            <div className="flex items-center justify-between mt-3">
              <CategoryTabs />
              <div className="flex items-center space-x-2">
                <SortSelect value={filters.sortBy} onChange={(value) => setFilters((prev) => ({ ...prev, sortBy: value }))} />
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
        <ProductGrid filters={filters} />
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