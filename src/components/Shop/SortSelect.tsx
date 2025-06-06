
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const SortSelect = ({ value, onChange }: SortSelectProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Mới nhất</SelectItem>
        <SelectItem value="price-low">Giá thấp</SelectItem>
        <SelectItem value="price-high">Giá cao</SelectItem>
        <SelectItem value="popular">Phổ biến</SelectItem>
        <SelectItem value="rating">Đánh giá</SelectItem>
      </SelectContent>
    </Select>
  );
};
