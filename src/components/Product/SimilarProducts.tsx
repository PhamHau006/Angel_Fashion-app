
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductCard } from './ProductCard';

export const SimilarProducts = () => {
  const similarProducts = [
    {
      id: 2,
      name: 'Áo thun Angel Basic Black',
      price: 299000,
      originalPrice: 399000,
      image: '/placeholder.svg',
      rating: 4.7,
      reviews: 98,
    },
    {
      id: 3,
      name: 'Áo thun Angel Premium',
      price: 399000,
      originalPrice: 499000,
      image: '/placeholder.svg',
      rating: 4.9,
      reviews: 156,
      isNew: true,
    },
  ];

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle className="text-lg">Sản phẩm tương tự</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {similarProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
