
import React, { useState, useRef } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Camera, Sparkles, Download, Share, RotateCcw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AITryOnPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);

  // Mock products for try-on
  const products = [
    {
      id: 1,
      name: 'Áo thun Angel Basic White',
      image: '/placeholder.svg',
      price: 299000,
    },
    {
      id: 2,
      name: 'Váy Angel Summer Pink',
      image: '/placeholder.svg',
      price: 599000,
    },
    {
      id: 3,
      name: 'Áo sơ mi Angel Classic',
      image: '/placeholder.svg',
      price: 399000,
    },
  ];

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
    if (!uploadedImage || !selectedProduct) return;
    
    setIsProcessing(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setTryOnResult('/placeholder.svg'); // Mock result
      setIsProcessing(false);
    }, 3000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="font-bold">AI Thử Đồ</h1>
              <p className="text-sm text-white/80">Thử trang phục ảo với AI</p>
            </div>
            <div className="ml-auto">
              <Badge className="bg-white/20 text-white border-white/30">
                <Zap size={12} className="mr-1" />
                AI
              </Badge>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="p-4 space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold mb-4">Bước 1: Tải ảnh của bạn</h3>
              {!uploadedImage ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Tải ảnh toàn thân của bạn</p>
                  <p className="text-sm text-gray-500">Định dạng: JPG, PNG (tối đa 10MB)</p>
                  <Button className="mt-4">
                    <Camera size={16} className="mr-2" />
                    Chọn ảnh
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setUploadedImage(null)}
                  >
                    <RotateCcw size={16} className="mr-1" />
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

          {/* Product Selection */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold mb-4">Bước 2: Chọn sản phẩm thử</h3>
              <div className="grid grid-cols-3 gap-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`border rounded-lg p-2 cursor-pointer transition-all ${
                      selectedProduct?.id === product.id
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full aspect-square object-cover rounded"
                    />
                    <p className="text-xs font-medium mt-2 truncate">{product.name}</p>
                    <p className="text-xs text-primary font-bold">{formatPrice(product.price)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Try On Button */}
          <Button
            className="w-full h-12"
            onClick={handleTryOn}
            disabled={!uploadedImage || !selectedProduct || isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <Sparkles size={20} className="mr-2" />
                Thử đồ với AI
              </>
            )}
          </Button>

          {/* Result */}
          {tryOnResult && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4">Kết quả thử đồ</h3>
                <div className="relative">
                  <img
                    src={tryOnResult}
                    alt="Try-on result"
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  <div className="absolute bottom-4 left-4 right-4 flex space-x-2">
                    <Button variant="secondary" className="flex-1">
                      <Download size={16} className="mr-2" />
                      Tải xuống
                    </Button>
                    <Button variant="secondary" className="flex-1">
                      <Share size={16} className="mr-2" />
                      Chia sẻ
                    </Button>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    🎉 Tuyệt vời! Bạn có thể thêm sản phẩm này vào giỏ hàng ngay.
                  </p>
                  <Button className="w-full mt-3" onClick={() => navigate('/cart')}>
                    Thêm vào giỏ hàng
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};
