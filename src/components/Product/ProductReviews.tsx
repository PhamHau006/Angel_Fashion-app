
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, ThumbsUp } from 'lucide-react';

interface ProductReviewsProps {
  productId: number;
}

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const reviews = [
    {
      id: 1,
      userName: 'Minh Thu',
      rating: 5,
      comment: 'Chất liệu áo rất mềm mại, mặc rất thoải mái. Màu sắc đúng như hình.',
      date: '2024-01-15',
      helpful: 12,
      images: ['/placeholder.svg'],
    },
    {
      id: 2,
      userName: 'Lan Anh',
      rating: 4,
      comment: 'Thiết kế đẹp, form áo vừa vặn. Giao hàng nhanh.',
      date: '2024-01-10',
      helpful: 8,
      images: [],
    },
    {
      id: 3,
      userName: 'Hoài An',
      rating: 5,
      comment: 'Rất hài lòng với sản phẩm. Sẽ mua thêm màu khác.',
      date: '2024-01-08',
      helpful: 15,
      images: ['/placeholder.svg', '/placeholder.svg'],
    },
  ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            className={star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle className="text-lg">Đánh giá sản phẩm</CardTitle>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold">4.8</span>
            {renderStars(5)}
          </div>
          <span className="text-gray-500">124 đánh giá</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-b pb-4 last:border-b-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium">{review.userName}</span>
                {renderStars(review.rating)}
              </div>
              <span className="text-sm text-gray-500">{review.date}</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
            {review.images.length > 0 && (
              <div className="flex space-x-2 mb-2">
                {review.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Review ${index + 1}`}
                    className="w-16 h-16 object-cover rounded"
                  />
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="text-gray-500">
              <ThumbsUp size={14} className="mr-1" />
              Hữu ích ({review.helpful})
            </Button>
          </div>
        ))}
        <Button variant="outline" className="w-full">
          Xem tất cả đánh giá
        </Button>
      </CardContent>
    </Card>
  );
};
