
import React from 'react';
import { ProductCard } from '../Product/ProductCard';

export const FeaturedProducts = () => {
  const featuredProducts = [
    {
      id: 1,
      name: 'Áo thun Angel Basic',
      price: 299000,
      originalPrice: 399000,
      image: '/placeholder.svg',
      rating: 4.8,
      reviews: 124,
      isNew: true,
    },
    {
      id: 2,
      name: 'Váy Angel Summer',
      price: 599000,
      originalPrice: 799000,
      image: '/placeholder.svg',
      rating: 4.9,
      reviews: 89,
      isHot: true,
    },
    {
      id: 3,
      name: 'Combo Angel Set',
      price: 899000,
      originalPrice: 1299000,
      image: '/placeholder.svg',
      rating: 4.7,
      reviews: 156,
      isCombo: true,
    },
    {
      id: 4,
      name: 'Quần Jean Angel',
      price: 450000,
      originalPrice: 599000,
      image: '/placeholder.svg',
      rating: 4.6,
      reviews: 78,
    },
  ];

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Sản phẩm nổi bật</h3>
      <div className="grid grid-cols-2 gap-4">
        {featuredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
