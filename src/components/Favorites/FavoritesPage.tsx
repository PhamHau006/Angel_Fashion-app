
import React, { useState } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Share, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const FavoritesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState([
    {
      id: 1,
      name: 'Áo thun Angel Basic White',
      price: 299000,
      originalPrice: 399000,
      image: '/placeholder.svg',
      discount: 25,
      rating: 4.8,
      reviews: 156,
      isNew: false,
      isTrending: true
    },
    {
      id: 2,
      name: 'Váy Angel Summer Pink',
      price: 599000,
      originalPrice: 799000,
      image: '/placeholder.svg',
      discount: 25,
      rating: 4.9,
      reviews: 89,
      isNew: true,
      isTrending: false
    },
    {
      id: 3,
      name: 'Quần jeans Angel Slim Blue',
      price: 419000,
      originalPrice: 519000,
      image: '/placeholder.svg',
      discount: 19,
      rating: 4.7,
      reviews: 203,
      isNew: false,
      isTrending: true
    }
  ]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const removeFavorite = (id: number) => {
    setFavorites(favorites.filter(item => item.id !== id));
    toast({
      title: "Đã xóa khỏi yêu thích",
      description: "Sản phẩm đã được xóa khỏi danh sách yêu thích",
    });
  };

  const addToCart = (product: any) => {
    toast({
      title: "Đã thêm vào giỏ hàng",
      description: `${product.name} đã được thêm vào giỏ hàng`,
    });
  };

  const shareProduct = (product: any) => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Xem sản phẩm ${product.name} tại Angel Fashion`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Đã sao chép link",
        description: "Link sản phẩm đã được sao chép vào clipboard",
      });
    }
  };

  if (favorites.length === 0) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-96 p-4">
          <Heart size={64} className="text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Chưa có sản phẩm yêu thích</h2>
          <p className="text-gray-500 text-center mb-6">
            Hãy thêm những sản phẩm bạn yêu thích để xem lại dễ dàng
          </p>
          <Button onClick={() => navigate('/shop')}>
            Khám phá sản phẩm
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="pb-20">
        <div className="bg-white sticky top-0 z-40 border-b p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Yêu thích ({favorites.length})</h1>
            <Button variant="ghost" size="sm">
              Chỉnh sửa
            </Button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-4">
          {favorites.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-40 object-cover cursor-pointer"
                  onClick={() => navigate(`/product/${product.id}`)}
                />
                <div className="absolute top-2 left-2 flex flex-col space-y-1">
                  {product.isNew && (
                    <Badge className="bg-green-500 text-white text-xs">NEW</Badge>
                  )}
                  {product.isTrending && (
                    <Badge className="bg-red-500 text-white text-xs">HOT</Badge>
                  )}
                  {product.discount > 0 && (
                    <Badge className="bg-orange-500 text-white text-xs">
                      -{product.discount}%
                    </Badge>
                  )}
                </div>
                <div className="absolute top-2 right-2 flex flex-col space-y-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 bg-white/80 hover:bg-white"
                    onClick={() => removeFavorite(product.id)}
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 bg-white/80 hover:bg-white"
                    onClick={() => shareProduct(product)}
                  >
                    <Share size={14} />
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-3">
                <h3 
                  className="font-medium text-sm mb-2 line-clamp-2 cursor-pointer hover:text-primary"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  {product.name}
                </h3>
                
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    <span className="text-yellow-400 text-sm mr-1">★</span>
                    <span className="text-xs text-gray-600">
                      {product.rating} ({product.reviews})
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-primary text-sm">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-gray-500 line-through ml-1">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => addToCart(product)}
                >
                  <ShoppingCart size={14} className="mr-1" />
                  Thêm vào giỏ
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
};
