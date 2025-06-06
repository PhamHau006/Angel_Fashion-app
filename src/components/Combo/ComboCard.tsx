
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Heart, ShoppingCart, Package, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ComboItem {
  name: string;
  price: number;
}

interface Combo {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
  reviews: number;
  discount: number;
  items: ComboItem[];
  savings: number;
  isHot?: boolean;
  isNew?: boolean;
  isPremium?: boolean;
  isPopular?: boolean;
  isLimited?: boolean;
  isTrending?: boolean;
}

interface ComboCardProps {
  combo: Combo;
}

export const ComboCard = ({ combo }: ComboCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const addToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Đã thêm combo vào giỏ hàng",
      description: `${combo.name} đã được thêm vào giỏ hàng`,
    });
  };

  const addToFavorites = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: "Đã thêm vào yêu thích",
      description: `${combo.name} đã được thêm vào danh sách yêu thích`,
    });
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
      onClick={() => navigate(`/combo/${combo.id}`)}
    >
      <CardContent className="p-0">
        <div className="flex">
          {/* Image */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <img
              src={combo.image}
              alt={combo.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 space-y-1">
              {combo.isHot && (
                <Badge className="bg-red-500 text-white text-xs">🔥 HOT</Badge>
              )}
              {combo.isNew && (
                <Badge className="bg-green-500 text-white text-xs">✨ MỚI</Badge>
              )}
              {combo.isPremium && (
                <Badge className="bg-purple-500 text-white text-xs">👑 PREMIUM</Badge>
              )}
              {combo.isPopular && (
                <Badge className="bg-blue-500 text-white text-xs">⭐ PHỔ BIẾN</Badge>
              )}
              {combo.isLimited && (
                <Badge className="bg-orange-500 text-white text-xs">⚡ GIỚI HẠN</Badge>
              )}
              {combo.isTrending && (
                <Badge className="bg-pink-500 text-white text-xs">📈 TRENDING</Badge>
              )}
            </div>
            <div className="absolute top-2 right-2">
              <Badge className="bg-red-500 text-white text-xs font-bold">
                -{combo.discount}%
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-3">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-sm line-clamp-1">{combo.name}</h3>
              <button 
                onClick={addToFavorites}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <Heart size={16} className="text-gray-500" />
              </button>
            </div>
            
            <p className="text-xs text-gray-600 mb-2 line-clamp-1">{combo.description}</p>
            
            {/* Rating */}
            <div className="flex items-center mb-2">
              <Star size={12} className="text-yellow-400 fill-current" />
              <span className="text-xs ml-1">{combo.rating}</span>
              <span className="text-xs text-gray-500 ml-1">({combo.reviews})</span>
              <Package size={12} className="text-gray-400 ml-2" />
              <span className="text-xs text-gray-600 ml-1">{combo.items.length} sản phẩm</span>
            </div>

            {/* Pricing */}
            <div className="space-y-1 mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-primary font-bold text-sm">{formatPrice(combo.price)}</span>
                <span className="text-gray-500 line-through text-xs">{formatPrice(combo.originalPrice)}</span>
              </div>
              <div className="flex items-center text-green-600">
                <Gift size={12} />
                <span className="text-xs ml-1 font-medium">Tiết kiệm {formatPrice(combo.savings)}</span>
              </div>
            </div>

            {/* Action Button */}
            <Button 
              size="sm" 
              className="w-full h-8 text-xs"
              onClick={addToCart}
            >
              <ShoppingCart size={12} className="mr-1" />
              Thêm combo
            </Button>
          </div>
        </div>

        {/* Items List */}
        <div className="px-3 pb-3">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs font-medium text-gray-700 mb-1">Bao gồm:</p>
            <div className="space-y-1">
              {combo.items.map((item, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span className="text-gray-600 line-clamp-1">{item.name}</span>
                  <span className="text-gray-500 ml-2">{formatPrice(item.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
