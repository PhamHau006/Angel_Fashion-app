
import React, { useState } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Star, Sparkles } from 'lucide-react';

interface Prize {
  id: number;
  name: string;
  type: 'discount' | 'gift' | 'points';
  value: string;
  color: string;
  probability: number;
}

export const LuckyWheelPage = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null);
  const [spinCount, setSpinCount] = useState(3);

  const prizes: Prize[] = [
    { id: 1, name: 'Giảm 10%', type: 'discount', value: '10%', color: '#EC4899', probability: 30 },
    { id: 2, name: 'Tặng sticker', type: 'gift', value: 'Sticker Angel', color: '#60A5FA', probability: 25 },
    { id: 3, name: 'Giảm 20%', type: 'discount', value: '20%', color: '#FDE68A', probability: 15 },
    { id: 4, name: '100 điểm', type: 'points', value: '100 points', color: '#34D399', probability: 20 },
    { id: 5, name: 'Giảm 5%', type: 'discount', value: '5%', color: '#F87171', probability: 35 },
    { id: 6, name: 'Giảm 30%', type: 'discount', value: '30%', color: '#A78BFA', probability: 5 },
  ];

  const spinWheel = () => {
    if (isSpinning || spinCount <= 0) return;

    setIsSpinning(true);
    setSpinCount(prev => prev - 1);

    // Simulate spinning
    setTimeout(() => {
      // Random prize selection based on probability
      const random = Math.random() * 100;
      let cumulativeProbability = 0;
      let selectedPrize = prizes[0];

      for (const prize of prizes) {
        cumulativeProbability += prize.probability;
        if (random <= cumulativeProbability) {
          selectedPrize = prize;
          break;
        }
      }

      setCurrentPrize(selectedPrize);
      setIsSpinning(false);
    }, 3000);
  };

  const getPrizeIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Star className="text-yellow-500" size={20} />;
      case 'gift':
        return <Gift className="text-pink-500" size={20} />;
      case 'points':
        return <Sparkles className="text-blue-500" size={20} />;
      default:
        return <Gift size={20} />;
    }
  };

  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary via-secondary to-accent p-6 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">🎰 Vòng quay may mắn</h1>
          <p className="text-white/80">Quay để nhận những phần quà hấp dẫn!</p>
          <div className="mt-4">
            <Badge className="bg-white/20 text-white border-white/30">
              Còn {spinCount} lượt quay
            </Badge>
          </div>
        </div>

        {/* Wheel */}
        <div className="p-6">
          <div className="relative mx-auto w-80 h-80">
            {/* Wheel Background */}
            <div 
              className={`w-full h-full rounded-full border-8 border-white shadow-2xl transition-transform duration-3000 ease-out ${
                isSpinning ? 'animate-spin-wheel' : ''
              }`}
              style={{
                background: `conic-gradient(${prizes.map((prize, index) => {
                  const startAngle = (360 / prizes.length) * index;
                  const endAngle = (360 / prizes.length) * (index + 1);
                  return `${prize.color} ${startAngle}deg ${endAngle}deg`;
                }).join(', ')})`
              }}
            >
              {/* Prize Labels */}
              {prizes.map((prize, index) => {
                const angle = (360 / prizes.length) * index + (360 / prizes.length) / 2;
                const radius = 120;
                const x = Math.cos((angle - 90) * (Math.PI / 180)) * radius;
                const y = Math.sin((angle - 90) * (Math.PI / 180)) * radius;
                
                return (
                  <div
                    key={prize.id}
                    className="absolute text-white font-bold text-sm transform -translate-x-1/2 -translate-y-1/2 text-center"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                    }}
                  >
                    {prize.name}
                  </div>
                );
              })}
            </div>

            {/* Center Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                onClick={spinWheel}
                disabled={isSpinning || spinCount <= 0}
                className="w-20 h-20 rounded-full bg-white text-primary hover:bg-gray-100 shadow-lg font-bold text-lg"
              >
                {isSpinning ? '...' : 'QUAY'}
              </Button>
            </div>

            {/* Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white"></div>
            </div>
          </div>
        </div>

        {/* Result */}
        {currentPrize && !isSpinning && (
          <div className="mx-4 mb-6">
            <Card className="bg-gradient-to-r from-green-400 to-blue-500 text-white">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold mb-2">Chúc mừng!</h3>
                <p className="mb-4">Bạn đã nhận được:</p>
                <div className="flex items-center justify-center space-x-2 mb-4">
                  {getPrizeIcon(currentPrize.type)}
                  <span className="text-lg font-bold">{currentPrize.name}</span>
                </div>
                <Button variant="secondary" className="bg-white text-primary hover:bg-gray-100">
                  Sử dụng ngay
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Prize List */}
        <div className="mx-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold mb-4">Danh sách phần thưởng</h3>
              <div className="space-y-3">
                {prizes.map((prize) => (
                  <div key={prize.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getPrizeIcon(prize.type)}
                      <span>{prize.name}</span>
                    </div>
                    <Badge variant="outline">
                      {prize.probability}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How to get more spins */}
        <div className="mx-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold mb-2">Cách nhận thêm lượt quay</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Mua sắm từ 500,000đ: +1 lượt</li>
                <li>• Đánh giá sản phẩm: +1 lượt</li>
                <li>• Chia sẻ ứng dụng: +2 lượt</li>
                <li>• Mỗi ngày đăng nhập: +1 lượt</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
};
