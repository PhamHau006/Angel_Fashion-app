import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Heart, ShoppingCart, Package, Gift, Clock, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '../../config/api'; // Sử dụng base URL từ config

interface ComboItem {
  name: string;
  price: number;
  quantity: number;
}

interface Combo {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
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
  startDate: string;
  endDate: string;
  stock: number;
  isActive: boolean;
}

interface ComboCardProps {
  combo: Combo;
  showDebugInfo?: boolean;
}

// Custom getImageUrl trong component với isCombo
const getImageUrl = (imageName: string, isCombo: boolean = true): string => { // Mặc định isCombo = true cho combo
  console.log('🔍 getImageUrl input:', { imageName, isCombo }); // Debug
  if (!imageName || imageName === 'placeholder.svg') {
    console.log('🔍 Using placeholder');
    return '/placeholder.svg';
  }
  if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
    console.log('🔍 Using full URL:', imageName);
    return imageName;
  }
  const baseUrl = getApiUrl().replace('/api', ''); // Ví dụ: https://localhost:7217
  const path = isCombo ? '/HinhAnh/AnhCombo' : '/HinhAnh/Products';
  const fullImageUrl = `${baseUrl}${path}/${imageName}`;
  console.log('🔍 Generated URL:', fullImageUrl);
  return fullImageUrl;
};

export const ComboCard = ({ combo, showDebugInfo = false }: ComboCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Format price in VND
  const formatPrice = (price: number) => {
    if (!price || price === 0) {
      return 'Liên hệ';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = new Date();
    const endDate = new Date(combo.endDate);
    const timeDiff = endDate.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return 'Đã hết hạn';
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `Còn ${days} ngày`;
    } else if (hours > 0) {
      return `Còn ${hours} giờ`;
    } else {
      return 'Sắp hết hạn';
    }
  };

  // Add to cart handler
  const addToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (combo.stock <= 0) {
      toast({
        title: "Combo đã hết hàng",
        description: "Combo này hiện tại đã hết hàng",
        variant: "destructive"
      });
      return;
    }

    // Here you would integrate with your cart system
    toast({
      title: "Đã thêm combo vào giỏ hàng",
      description: `${combo.name} đã được thêm vào giỏ hàng`,
    });
  };

  // Add to favorites handler
  const addToFavorites = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Here you would integrate with your favorites system
    toast({
      title: "Đã thêm vào yêu thích",
      description: `${combo.name} đã được thêm vào danh sách yêu thích`,
    });
  };

  // Navigate to combo detail
  const handleCardClick = () => {
    navigate(`/combo/${combo.id}`);
  };

  // Handle image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`❌ Combo image failed to load: ${combo.image}`);
    const target = e.currentTarget;
    target.src = getImageUrl('placeholder.svg', true); // Sử dụng isCombo: true
  };

  // Check if combo is expired
  const isExpired = new Date(combo.endDate) <= new Date();
  const timeRemaining = getTimeRemaining();

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-shadow overflow-hidden ${
        isExpired ? 'opacity-60' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        <div className="flex">
          {/* Image Section */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <img
              src={getImageUrl(combo.image || 'product-1.jpg', true)} // Sử dụng isCombo: true
              alt={combo.name}
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />

        

            {/* Discount Badge */}
            {combo.discount > 0 && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-red-500 text-white text-xs font-bold">
                  -{combo.discount}%
                </Badge>
              </div>
            )}

            {/* Stock indicator */}
            {combo.stock <= 5 && combo.stock > 0 && (
              <div className="absolute bottom-2 left-2">
                <Badge className="bg-yellow-500 text-white text-xs">
                  Chỉ còn {combo.stock}
                </Badge>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 p-3">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-sm line-clamp-1">{combo.name}</h3>
              <button
                onClick={addToFavorites}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Heart size={16} className="text-gray-500 hover:text-red-500" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-2 line-clamp-1">{combo.description}</p>

            {/* Rating and Stats */}
            <div className="flex items-center mb-2">
              <div className="flex items-center">
                <Star size={12} className="text-yellow-400 fill-current" />
                <span className="text-xs ml-1">{combo.rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-gray-500 ml-1">({combo.reviews})</span>
              <div className="flex items-center ml-2">
                <Package size={12} className="text-gray-400" />
                <span className="text-xs text-gray-600 ml-1">{combo.items.length} sản phẩm</span>
              </div>
            </div>

            {/* Time remaining */}
            {!isExpired && (
              <div className="flex items-center mb-2 text-xs">
                <Clock size={12} className="text-orange-500 mr-1" />
                <span className={`${
                  timeRemaining.includes('giờ') || timeRemaining.includes('Sắp')
                    ? 'text-red-600 font-medium'
                    : 'text-orange-600'
                }`}>
                  {timeRemaining}
                </span>
              </div>
            )}

            {/* Pricing */}
            <div className="space-y-1 mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-primary font-bold text-sm">{formatPrice(combo.price)}</span>
                {combo.originalPrice && combo.originalPrice > combo.price && (
                  <span className="text-gray-500 line-through text-xs">
                    {formatPrice(combo.originalPrice)}
                  </span>
                )}
              </div>
              {combo.savings > 0 && (
                <div className="flex items-center text-green-600">
                  <Gift size={12} />
                  <span className="text-xs ml-1 font-medium">Tiết kiệm {formatPrice(combo.savings)}</span>
                </div>
              )}
            </div>

            {/* Action Button */}
            <Button
              size="sm"
              className="w-full h-8 text-xs"
              onClick={addToCart}
              disabled={combo.stock <= 0 || isExpired}
            >
              <ShoppingCart size={12} className="mr-1" />
              {combo.stock <= 0 ? 'Hết hàng' : isExpired ? 'Hết hạn' : 'Thêm combo'}
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
                  <span className="text-gray-600 line-clamp-1 flex-1">
                    {item.quantity > 1 && (
                      <span className="text-primary font-medium">{item.quantity}x </span>
                    )}
                    {item.name}
                  </span>
                  <span className="text-gray-500 ml-2">{formatPrice(item.price)}</span>
                </div>
              ))}
            </div>

            {/* Combo validity period */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center text-xs text-gray-500">
                <Calendar size={10} className="mr-1" />
                <span>
                  Có hiệu lực đến {new Date(combo.endDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {showDebugInfo && (
          <div className="px-3 pb-3">
            <div className="bg-yellow-50 rounded-lg p-2 text-xs">
              <strong>🔧 Debug Info:</strong>
              <div>ID: {combo.id}</div>
              <div>Stock: {combo.stock}</div>
              <div>Active: {combo.isActive ? 'Yes' : 'No'}</div>
              <div>Expired: {isExpired ? 'Yes' : 'No'}</div>
              <div>Start: {new Date(combo.startDate).toLocaleDateString('vi-VN')}</div>
              <div>End: {new Date(combo.endDate).toLocaleDateString('vi-VN')}</div>
              <div>Image: {combo.image}</div>
              <div>Items: {combo.items.length}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};