
import React from 'react';
import { ComboCard } from './ComboCard';

interface ComboGridProps {
  filters: any;
}

export const ComboGrid = ({ filters }: ComboGridProps) => {
  const combos = [
    {
      id: 1,
      name: 'Combo Angel Office Lady',
      description: 'Áo sơ mi trắng + Chân váy đen + Blazer',
      price: 899000,
      originalPrice: 1299000,
      image: '/placeholder.svg',
      rating: 4.9,
      reviews: 156,
      discount: 31,
      items: [
        { name: 'Áo sơ mi Angel White', price: 399000 },
        { name: 'Chân váy Angel Black', price: 350000 },
        { name: 'Blazer Angel Classic', price: 550000 }
      ],
      isHot: true,
      savings: 400000
    },
    {
      id: 2,
      name: 'Combo Angel Summer Vibes',
      description: 'Áo thun + Quần short + Mũ bucket',
      price: 459000,
      originalPrice: 649000,
      image: '/placeholder.svg',
      rating: 4.8,
      reviews: 203,
      discount: 29,
      items: [
        { name: 'Áo thun Angel Summer', price: 299000 },
        { name: 'Quần short Angel Denim', price: 250000 },
        { name: 'Mũ bucket Angel Style', price: 100000 }
      ],
      isNew: true,
      savings: 190000
    },
    {
      id: 3,
      name: 'Combo Angel Date Night',
      description: 'Váy midi + Túi xách + Giày cao gót',
      price: 1299000,
      originalPrice: 1799000,
      image: '/placeholder.svg',
      rating: 4.9,
      reviews: 89,
      discount: 28,
      items: [
        { name: 'Váy midi Angel Elegant', price: 699000 },
        { name: 'Túi xách Angel Premium', price: 599000 },
        { name: 'Giày cao gót Angel Luxury', price: 501000 }
      ],
      isPremium: true,
      savings: 500000
    },
    {
      id: 4,
      name: 'Combo Angel Casual Weekend',
      description: 'Hoodie + Quần jogger + Sneakers',
      price: 799000,
      originalPrice: 1099000,
      image: '/placeholder.svg',
      rating: 4.7,
      reviews: 134,
      discount: 27,
      items: [
        { name: 'Hoodie Angel Comfort', price: 499000 },
        { name: 'Quần jogger Angel Soft', price: 350000 },
        { name: 'Sneakers Angel Sport', price: 250000 }
      ],
      isPopular: true,
      savings: 300000
    },
    {
      id: 5,
      name: 'Combo Angel Winter Warmth',
      description: 'Áo len + Quần jean + Boots + Khăn',
      price: 1199000,
      originalPrice: 1649000,
      image: '/placeholder.svg',
      rating: 4.8,
      reviews: 98,
      discount: 27,
      items: [
        { name: 'Áo len Angel Wool', price: 599000 },
        { name: 'Quần jean Angel Warm', price: 450000 },
        { name: 'Boots Angel Winter', price: 400000 },
        { name: 'Khăn Angel Soft', price: 200000 }
      ],
      isLimited: true,
      savings: 450000
    },
    {
      id: 6,
      name: 'Combo Angel School Girl',
      description: 'Áo polo + Chân váy tennis + Tất cao cổ',
      price: 549000,
      originalPrice: 749000,
      image: '/placeholder.svg',
      rating: 4.6,
      reviews: 167,
      discount: 27,
      items: [
        { name: 'Áo polo Angel School', price: 299000 },
        { name: 'Chân váy tennis Angel', price: 299000 },
        { name: 'Tất cao cổ Angel (3 đôi)', price: 151000 }
      ],
      isTrending: true,
      savings: 200000
    }
  ];

  return (
    <div className="p-4">
      <div className="space-y-4">
        {combos.map((combo) => (
          <ComboCard key={combo.id} combo={combo} />
        ))}
      </div>
    </div>
  );
};
