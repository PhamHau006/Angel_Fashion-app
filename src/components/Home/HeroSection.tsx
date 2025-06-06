
import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative gradient-angel p-6 text-white">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Angel Fashion</h1>
          <p className="text-sm opacity-90">Thời trang thiên thần</p>
        </div>
        <div className="flex space-x-3">
          <button className="p-2 bg-white/20 rounded-full">
            <Bell size={20} />
          </button>
          <button 
            onClick={() => navigate('/cart')}
            className="p-2 bg-white/20 rounded-full"
          >
            <ShoppingBag size={20} />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Bộ sưu tập mới</h2>
        <p className="text-lg opacity-90 mb-4">Thời trang angel 2024</p>
        <Button 
          onClick={() => navigate('/shop')}
          className="bg-white text-primary hover:bg-gray-100"
        >
          Khám phá ngay
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="text-2xl font-bold">50+</div>
          <div className="text-sm">Sản phẩm mới</div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <div className="text-2xl font-bold">1000+</div>
          <div className="text-sm">Khách hàng</div>
        </div>
      </div>
    </div>
  );
};
