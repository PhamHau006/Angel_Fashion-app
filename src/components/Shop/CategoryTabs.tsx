
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

const categories = [
  { id: 'all', name: 'Tất cả', route: '/shop' },
  { id: 'combo', name: 'Combo 🔥', route: '/combo' },
  { id: 'shirt', name: 'Áo' },
  { id: 'pants', name: 'Quần' },
  { id: 'dress', name: 'Váy' },
  { id: 'accessories', name: 'Phụ kiện' },
  { id: 'shoes', name: 'Giày' },
];

export const CategoryTabs = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();

  const handleCategoryClick = (category: any) => {
    if (category.route) {
      navigate(category.route);
    } else {
      setActiveCategory(category.id);
    }
  };

  const isActiveCategory = (category: any) => {
    if (category.route) {
      return location.pathname === category.route;
    }
    return activeCategory === category.id;
  };

  return (
    <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={isActiveCategory(category) ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleCategoryClick(category)}
          className="whitespace-nowrap"
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};
