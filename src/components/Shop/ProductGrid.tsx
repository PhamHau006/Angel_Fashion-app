
import React from 'react';
import { ProductCard } from '../Product/ProductCard';

interface ProductGridProps {
  filters: any;
}

export const ProductGrid = ({ filters }: ProductGridProps) => {
  const products = [
    {
      id: 1,
      name: 'Áo thun Angel Basic White',
      price: 299000,
      originalPrice: 399000,
      image: '/placeholder.svg',
      rating: 4.8,
      reviews: 124,
      isNew: true,
    },
    {
      id: 2,
      name: 'Váy Angel Summer Pink',
      price: 599000,
      originalPrice: 799000,
      image: '/placeholder.svg',
      rating: 4.9,
      reviews: 89,
      isHot: true,
    },
    {
      id: 3,
      name: 'Combo Angel Set Premium',
      price: 899000,
      originalPrice: 1299000,
      image: '/placeholder.svg',
      rating: 4.7,
      reviews: 156,
      isCombo: true,
    },
    {
      id: 4,
      name: 'Quần Jean Angel Blue',
      price: 450000,
      originalPrice: 599000,
      image: '/placeholder.svg',
      rating: 4.6,
      reviews: 78,
    },
    {
      id: 5,
      name: 'Áo khoác Angel Winter',
      price: 750000,
      originalPrice: 950000,
      image: '/placeholder.svg',
      rating: 4.8,
      reviews: 92,
      isNew: true,
    },
    {
      id: 6,
      name: 'Chân váy Angel Mini',
      price: 350000,
      originalPrice: 450000,
      image: '/placeholder.svg',
      rating: 4.5,
      reviews: 67,
    },
  ];

  return (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
