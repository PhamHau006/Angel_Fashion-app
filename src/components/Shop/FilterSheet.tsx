
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: any;
  onFiltersChange: (filters: any) => void;
}

export const FilterSheet = ({ open, onClose, filters, onFiltersChange }: FilterSheetProps) => {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = [
    { name: 'Đen', value: 'black', color: '#000000' },
    { name: 'Trắng', value: 'white', color: '#FFFFFF' },
    { name: 'Hồng', value: 'pink', color: '#EC4899' },
    { name: 'Xanh', value: 'blue', color: '#60A5FA' },
    { name: 'Vàng', value: 'yellow', color: '#FDE68A' },
    { name: 'Đỏ', value: 'red', color: '#EF4444' },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Bộ lọc</SheetTitle>
        </SheetHeader>
        
        <div className="py-6 space-y-6">
          {/* Price Range */}
          <div>
            <h3 className="font-medium mb-3">Khoảng giá</h3>
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => onFiltersChange(prev => ({ ...prev, priceRange: value }))}
              max={2000000}
              step={50000}
              className="mb-2"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{formatPrice(filters.priceRange[0])}</span>
              <span>{formatPrice(filters.priceRange[1])}</span>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <h3 className="font-medium mb-3">Kích thước</h3>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <Badge
                  key={size}
                  variant={filters.sizes.includes(size) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const newSizes = filters.sizes.includes(size)
                      ? filters.sizes.filter(s => s !== size)
                      : [...filters.sizes, size];
                    onFiltersChange(prev => ({ ...prev, sizes: newSizes }));
                  }}
                >
                  {size}
                </Badge>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <h3 className="font-medium mb-3">Màu sắc</h3>
            <div className="grid grid-cols-3 gap-3">
              {colors.map((color) => (
                <div
                  key={color.value}
                  className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer ${
                    filters.colors.includes(color.value) ? 'border-primary bg-primary/10' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    const newColors = filters.colors.includes(color.value)
                      ? filters.colors.filter(c => c !== color.value)
                      : [...filters.colors, color.value];
                    onFiltersChange(prev => ({ ...prev, colors: newColors }));
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.color }}
                  />
                  <span className="text-sm">{color.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={() => {
            onFiltersChange({
              category: '',
              priceRange: [0, 2000000],
              sizes: [],
              colors: [],
              sortBy: 'newest'
            });
          }}>
            Đặt lại
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Áp dụng
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
