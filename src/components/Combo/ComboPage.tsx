
import React, { useState } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { ComboGrid } from './ComboGrid';
import { SearchBar } from '../Shop/SearchBar';
import { SortSelect } from '../Shop/SortSelect';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ComboPage = () => {
  const [filters, setFilters] = useState({
    priceRange: [0, 3000000],
    sortBy: 'newest'
  });

  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Header */}
        <div className="bg-white sticky top-0 z-40 border-b">
          <div className="p-4">
            <SearchBar placeholder="Tìm kiếm combo..." />
            <div className="flex items-center justify-between mt-3">
              <h1 className="text-lg font-bold text-primary">Combo Hot 🔥</h1>
              <div className="flex items-center space-x-2">
                <SortSelect 
                  value={filters.sortBy} 
                  onChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))} 
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <Filter size={16} />
                  <span>Lọc</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Combo Products */}
        <ComboGrid filters={filters} />
      </div>
    </MobileLayout>
  );
};
