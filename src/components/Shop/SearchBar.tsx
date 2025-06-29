// SearchBar.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  onChange?: (value: string) => void;
}

export const SearchBar = ({ placeholder = "Tìm kiếm sản phẩm...", onChange }: SearchBarProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
      <Input
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
      />
    </div>
  );
};