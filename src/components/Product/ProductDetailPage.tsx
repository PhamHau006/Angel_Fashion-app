
import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Heart, Share, Star, ShoppingCart, MessageCircle, Camera, Sparkles, Upload, RotateCcw } from 'lucide-react';
import { ProductReviews } from './ProductReviews';
import { SimilarProducts } from './SimilarProducts';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showTryOn, setShowTryOn] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock product data
  const product = {
    id: 1,
    name: 'Áo thun Angel Basic White',
    price: 299000,
    originalPrice: 399000,
    images: ['/placeholder.svg', '/placeholder.svg', '/placeholder.svg'],
    rating: 4.8,
    reviews: 124,
    description: 'Áo thun Angel Basic với chất liệu cotton 100% mềm mại, thoáng mát. Thiết kế đơn giản nhưng tinh tế, phù hợp cho mọi hoạt động hàng ngày.',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Trắng', value: 'white', color: '#FFFFFF' },
      { name: 'Đen', value: 'black', color: '#000000' },
      { name: 'Hồng', value: 'pink', color: '#EC4899' },
    ],
    stock: 50,
    isNew: true,
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTryOn = async () => {
    if (!uploadedImage) return;
    
    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setTryOnResult('/placeholder.svg'); // Mock result
      setIsProcessing(false);
    }, 3000);
  };

  const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <MobileLayout showBottomNav={false}>
      <div className="pb-20">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white border-b">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={24} />
            </Button>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Share size={20} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart size={20} className={isFavorite ? 'fill-red-500 text-red-500' : ''} />
              </Button>
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-gray-50">
          <div className="aspect-square">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex space-x-2 p-4 overflow-x-auto">
            {product.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${product.name} ${index + 1}`}
                className="w-16 h-16 object-cover rounded border-2 border-transparent hover:border-primary cursor-pointer"
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-4">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              {product.isNew && <Badge className="bg-green-500">Mới</Badge>}
              {discountPercent > 0 && <Badge className="bg-red-500">-{discountPercent}%</Badge>}
            </div>
            <h1 className="text-xl font-bold">{product.name}</h1>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-2xl font-bold text-primary">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-gray-500 line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="flex items-center">
                <Star size={16} className="text-yellow-400 fill-current" />
                <span className="ml-1 text-sm">{product.rating}</span>
              </div>
              <span className="text-sm text-gray-500">({product.reviews} đánh giá)</span>
              <span className="text-sm text-gray-500">• Còn {product.stock} sản phẩm</span>
            </div>
          </div>

          {/* AI Try-On Button */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-lg">
            <div className="flex items-center justify-between text-white">
              <div>
                <h3 className="font-bold">AI Thử Đồ</h3>
                <p className="text-sm text-white/80">Xem bạn mặc như thế nào</p>
              </div>
              <Button 
                onClick={() => setShowTryOn(true)}
                className="bg-white text-purple-500 hover:bg-white/90"
              >
                <Sparkles size={16} className="mr-2" />
                Thử ngay
              </Button>
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <h3 className="font-medium mb-2">Kích thước</h3>
            <div className="flex space-x-2">
              {product.sizes.map((size) => (
                <Button
                  key={size}
                  variant={selectedSize === size ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <h3 className="font-medium mb-2">Màu sắc</h3>
            <div className="flex space-x-3">
              {product.colors.map((color) => (
                <div
                  key={color.value}
                  className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer ${
                    selectedColor === color.value ? 'border-primary bg-primary/10' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedColor(color.value)}
                >
                  <div
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.color }}
                  />
                  <span className="text-sm">{color.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <h3 className="font-medium mb-2">Số lượng</h3>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </Button>
              <span className="w-12 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-medium mb-2">Mô tả sản phẩm</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
          </div>
        </div>

        {/* Reviews */}
        <ProductReviews productId={product.id} />

        {/* Similar Products */}
        <SimilarProducts />

        {/* AI Try-On Modal */}
        <Dialog open={showTryOn} onOpenChange={setShowTryOn}>
          <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Sparkles size={20} className="mr-2 text-purple-500" />
                AI Thử Đồ
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Current Product */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Sản phẩm thử:</h4>
                  <div className="flex items-center space-x-3">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-sm text-primary">{formatPrice(product.price)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upload Section */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Tải ảnh của bạn:</h4>
                  {!uploadedImage ? (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-1">Tải ảnh toàn thân</p>
                      <p className="text-xs text-gray-500">JPG, PNG (tối đa 10MB)</p>
                      <Button size="sm" className="mt-2">
                        <Camera size={14} className="mr-1" />
                        Chọn ảnh
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setUploadedImage(null)}
                      >
                        <RotateCcw size={14} className="mr-1" />
                        Thay đổi
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              {/* Try On Button */}
              <Button
                className="w-full"
                onClick={handleTryOn}
                disabled={!uploadedImage || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="mr-2" />
                    Thử đồ với AI
                  </>
                )}
              </Button>

              {/* Result */}
              {tryOnResult && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Kết quả thử đồ:</h4>
                    <img
                      src={tryOnResult}
                      alt="Try-on result"
                      className="w-full h-64 object-cover rounded-lg mb-3"
                    />
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800 mb-2">
                        🎉 Tuyệt vời! Bạn có thể thêm sản phẩm này vào giỏ hàng ngay.
                      </p>
                      <Button className="w-full" onClick={() => {
                        setShowTryOn(false);
                        navigate('/cart');
                      }}>
                        Thêm vào giỏ hàng
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t p-4">
          <div className="flex space-x-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/messenger')}>
              <MessageCircle size={20} className="mr-2" />
              Chat
            </Button>
            <Button className="flex-1" onClick={() => navigate('/cart')}>
              <ShoppingCart size={20} className="mr-2" />
              Thêm vào giỏ
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};
