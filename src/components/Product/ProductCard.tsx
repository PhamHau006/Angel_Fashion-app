
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  isNew?: boolean;
  isHot?: boolean;
  isCombo?: boolean;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <CardContent className="p-3">
        <div className="relative mb-3">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-32 object-cover rounded-md"
          />
          <button className="absolute top-2 right-2 p-1 bg-white/80 rounded-full">
            <Heart size={16} className="text-gray-600" />
          </button>
          
          <div className="absolute top-2 left-2 space-y-1">
            {product.isNew && (
              <Badge className="bg-green-500 text-white text-xs">Mới</Badge>
            )}
            {product.isHot && (
              <Badge className="bg-red-500 text-white text-xs">Hot</Badge>
            )}
            {product.isCombo && (
              <Badge className="bg-purple-500 text-white text-xs">Combo</Badge>
            )}
            {discountPercent > 0 && (
              <Badge className="bg-orange-500 text-white text-xs">-{discountPercent}%</Badge>
            )}
          </div>
        </div>

        <h4 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h4>
        
        <div className="flex items-center mb-2">
          <Star size={12} className="text-yellow-400 fill-current" />
          <span className="text-xs ml-1">{product.rating}</span>
          <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
        </div>

        <div className="space-y-1">
          <div className="text-primary font-bold text-sm">{formatPrice(product.price)}</div>
          {product.originalPrice && (
            <div className="text-gray-500 line-through text-xs">
              {formatPrice(product.originalPrice)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
