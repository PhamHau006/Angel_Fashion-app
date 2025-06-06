
import React from 'react';
import { Button } from '@/components/ui/button';
import { Gift, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SpecialOffers = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Ưu đãi đặc biệt</h3>
      
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg">Vòng quay may mắn</h4>
            <p className="text-sm opacity-90">Quay để nhận coupon giảm giá</p>
          </div>
          <Gift size={32} />
        </div>
        <Button 
          onClick={() => navigate('/lucky-wheel')}
          className="mt-3 bg-white text-purple-600 hover:bg-gray-100"
        >
          Quay ngay
        </Button>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-4 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg">AI Assistant</h4>
            <p className="text-sm opacity-90">Tư vấn thời trang cá nhân</p>
          </div>
          <Star size={32} />
        </div>
        <Button 
          onClick={() => navigate('/ai-chat')}
          className="mt-3 bg-white text-blue-600 hover:bg-gray-100"
        >
          Chat ngay
        </Button>
      </div>
    </div>
  );
};
