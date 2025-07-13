// ProductReviews.tsx - Mobile Component with API Integration
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, ThumbsUp, ImageIcon, User, Calendar, MessageSquare, Send } from 'lucide-react';
import { getApiUrl, getImageUrl } from '@/config/api';
import { CapacitorHttp } from '@capacitor/core';

// =============================================
// INTERFACES & TYPES
// =============================================

interface ReviewResponseDTO {
  id: number;
  maKh: number;
  maSp?: number;
  maCombo?: number;
  noiDung: string;
  soSao: number;
  ngayDanhGia: string;
  shopPhanHoi?: string;
  ngayPhanHoi?: string;
  tenKhachHang: string;
  tenDoiTuong: string;
  kichThuoc?: string;
  mauSac?: string;
  donGia?: number;
  tenHinhAnh?: string;
  hinhAnhs?: string[] | string; // Can be array or comma-separated string
}

interface ResponseAPI<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

interface ProductReviewsProps {
  productId: number;
  isProduct?: boolean; // true for product, false for combo
  showWriteReview?: boolean;
  currentUserId?: number;
  onReviewSubmitted?: () => void;
}

interface WriteReviewState {
  isOpen: boolean;
  rating: number;
  content: string;
  images: File[];
  isSubmitting: boolean;
}

// =============================================
// API SERVICE FUNCTIONS
// =============================================

class ReviewApiService {
  private static baseUrl = getApiUrl();

  // Get reviews by product ID
  static async getProductReviews(productId: number): Promise<ResponseAPI<ReviewResponseDTO[]>> {
    try {
      const url = `${this.baseUrl}/api/Review/products/${productId}`;
      
      const response = await CapacitorHttp.request({
        method: 'GET',
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      return {
        success: false,
        message: 'Không thể tải đánh giá',
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get reviews by combo ID
  static async getComboReviews(comboId: number): Promise<ResponseAPI<ReviewResponseDTO[]>> {
    try {
      const url = `${this.baseUrl}/api/Review/combos/${comboId}`;
      
      const response = await CapacitorHttp.request({
        method: 'GET',
        url: url,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching combo reviews:', error);
      return {
        success: false,
        message: 'Không thể tải đánh giá',
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Submit new review
  static async submitReview(
    reviewData: {
      maSp?: number;
      maCombo?: number;
      noiDung: string;
      soSao: number;
      maCtHd: number;
    },
    images: File[],
    isProduct: boolean,
    authToken: string
  ): Promise<ResponseAPI<ReviewResponseDTO>> {
    try {
      const formData = new FormData();
      
      // Add review data
      formData.append('noiDung', reviewData.noiDung);
      formData.append('soSao', reviewData.soSao.toString());
      formData.append('maCtHd', reviewData.maCtHd.toString());
      
      if (isProduct && reviewData.maSp) {
        formData.append('maSp', reviewData.maSp.toString());
      }
      if (!isProduct && reviewData.maCombo) {
        formData.append('maCombo', reviewData.maCombo.toString());
      }

      // Add images
      images.forEach(image => {
        formData.append('hinhAnhs', image);
      });

      const url = `${this.baseUrl}/api/Review?isProduct=${isProduct}`;
      
      const response = await CapacitorHttp.request({
        method: 'POST',
        url: url,
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        data: formData,
      });

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.data?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      return {
        success: false,
        message: 'Không thể gửi đánh giá',
        data: {} as ReviewResponseDTO,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Không xác định';
  }
};

const formatPrice = (price: number): string => {
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  } catch {
    return `${price.toLocaleString()} ₫`;
  }
};

// Safe function to get review images
const getReviewImages = (hinhAnhs?: string[] | string): string[] => {
  if (!hinhAnhs) return [];
  
  if (Array.isArray(hinhAnhs)) {
    return hinhAnhs.filter(img => img && img.trim() !== '');
  }
  
  if (typeof hinhAnhs === 'string') {
    return hinhAnhs.split(',').map(img => img.trim()).filter(img => img !== '');
  }
  
  return [];
};

// =============================================
// STAR RATING COMPONENT
// =============================================

const StarRating: React.FC<{
  rating: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}> = ({ rating, size = 16, interactive = false, onRatingChange }) => {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`${
            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          } ${interactive ? 'cursor-pointer hover:text-yellow-500' : ''}`}
          onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
        />
      ))}
      <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
    </div>
  );
};

// =============================================
// REVIEW ITEM COMPONENT
// =============================================

const ReviewItem: React.FC<{ review: ReviewResponseDTO }> = ({ review }) => {
  const reviewImages = getReviewImages(review.hinhAnhs);

  return (
    <div className="border-b border-gray-200 pb-4 last:border-b-0">
      {/* User info and rating */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User size={16} className="text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{review.tenKhachHang}</p>
            <StarRating rating={review.soSao} size={12} />
          </div>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <Calendar size={12} className="mr-1" />
          {formatDate(review.ngayDanhGia)}
        </div>
      </div>

      {/* Review content */}
      <p className="text-sm text-gray-700 mb-3 leading-relaxed">
        {review.noiDung}
      </p>

      {/* Review images */}
      {reviewImages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {reviewImages.map((imageName, index) => (
            <div key={index} className="relative">
              <img
                src={getImageUrl(`Reviews/${imageName}`)}
                alt={`Review image ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Product info */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="flex items-center space-x-3">
          {review.tenHinhAnh && (
            <img
              src={getImageUrl(`Products/${review.tenHinhAnh}`)}
              alt="Product"
              className="w-12 h-12 object-cover rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
          )}
          <div className="flex-1">
            <p className="font-medium text-sm">{review.tenDoiTuong}</p>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              {review.kichThuoc && <span>Size: {review.kichThuoc}</span>}
              {review.mauSac && <span>Màu: {review.mauSac}</span>}
              {review.donGia && <span>{formatPrice(review.donGia)}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Shop reply */}
      {review.shopPhanHoi && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquare size={14} className="text-blue-600" />
            <span className="font-medium text-sm text-blue-800">Phản hồi từ shop</span>
            {review.ngayPhanHoi && (
              <span className="text-xs text-blue-600">
                {formatDate(review.ngayPhanHoi)}
              </span>
            )}
          </div>
          <p className="text-sm text-blue-700">{review.shopPhanHoi}</p>
        </div>
      )}

      {/* Helpful button */}
      <div className="flex items-center justify-end mt-3">
        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
          <ThumbsUp size={14} className="mr-1" />
          Hữu ích
        </Button>
      </div>
    </div>
  );
};

// =============================================
// WRITE REVIEW COMPONENT
// =============================================

const WriteReviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  isProduct: boolean;
  onSubmitSuccess: () => void;
}> = ({ isOpen, onClose, productId, isProduct, onSubmitSuccess }) => {
  const [reviewState, setReviewState] = useState<WriteReviewState>({
    isOpen: false,
    rating: 5,
    content: '',
    images: [],
    isSubmitting: false
  });

  const handleSubmit = async () => {
    if (!reviewState.content.trim()) {
      alert('Vui lòng nhập nội dung đánh giá');
      return;
    }

    setReviewState(prev => ({ ...prev, isSubmitting: true }));

    try {
      // Get auth token from storage (implement based on your auth system)
      const authToken = localStorage.getItem('accessToken') || '';
      
      const reviewData = {
        [isProduct ? 'maSp' : 'maCombo']: productId,
        noiDung: reviewState.content,
        soSao: reviewState.rating,
        maCtHd: 1 // This should come from order context
      };

      const result = await ReviewApiService.submitReview(
        reviewData,
        reviewState.images,
        isProduct,
        authToken
      );

      if (result.success) {
        alert('Đánh giá đã được gửi thành công!');
        onSubmitSuccess();
        onClose();
        setReviewState({
          isOpen: false,
          rating: 5,
          content: '',
          images: [],
          isSubmitting: false
        });
      } else {
        alert(result.message || 'Có lỗi xảy ra khi gửi đánh giá');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setReviewState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Viết đánh giá</h3>
        
        {/* Rating */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Đánh giá sao</label>
          <StarRating
            rating={reviewState.rating}
            size={24}
            interactive
            onRatingChange={(rating) => 
              setReviewState(prev => ({ ...prev, rating }))
            }
          />
        </div>

        {/* Content */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Nội dung đánh giá</label>
          <textarea
            value={reviewState.content}
            onChange={(e) => 
              setReviewState(prev => ({ ...prev, content: e.target.value }))
            }
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24"
          />
        </div>

        {/* Images */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Hình ảnh (tối đa 5)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 5) {
                alert('Chỉ được chọn tối đa 5 ảnh');
                return;
              }
              setReviewState(prev => ({ ...prev, images: files }));
            }}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
          {reviewState.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {reviewState.images.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={reviewState.isSubmitting}
            className="flex-1"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={reviewState.isSubmitting || !reviewState.content.trim()}
            className="flex-1"
          >
            {reviewState.isSubmitting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send size={16} className="mr-2" />
                Gửi đánh giá
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// =============================================
// MAIN COMPONENT
// =============================================

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  isProduct = true,
  showWriteReview = false,
  currentUserId,
  onReviewSubmitted
}) => {
  const [reviews, setReviews] = useState<ReviewResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState(3);

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.soSao, 0) / reviews.length 
    : 0;

  // Load reviews
  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = isProduct 
        ? await ReviewApiService.getProductReviews(productId)
        : await ReviewApiService.getComboReviews(productId);

      if (result.success) {
        setReviews(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải đánh giá');
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, isProduct]);

  // Load reviews on mount
  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Handle review submitted
  const handleReviewSubmitted = () => {
    loadReviews();
    onReviewSubmitted?.();
  };

  // Show more reviews
  const showMoreReviews = () => {
    setExpandedReviews(prev => prev + 5);
  };

  return (
    <>
      <Card className="m-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Đánh giá sản phẩm</CardTitle>
            {showWriteReview && (
              <Button
                size="sm"
                onClick={() => setShowWriteModal(true)}
                className="ml-auto"
              >
                <Star size={16} className="mr-2" />
                Viết đánh giá
              </Button>
            )}
          </div>
          
          {/* Rating summary */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">
                {averageRating.toFixed(1)}
              </span>
              <StarRating rating={averageRating} size={20} />
            </div>
            <span className="text-gray-500">
              {reviews.length} đánh giá
            </span>
          </div>
        </CardHeader>

        <CardContent>
          {/* Loading state */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Reviews list */}
          {!loading && !error && reviews.length > 0 && (
            <div className="space-y-4">
              {reviews.slice(0, expandedReviews).map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
              
              {expandedReviews < reviews.length && (
                <Button
                  variant="outline"
                  onClick={showMoreReviews}
                  className="w-full"
                >
                  Xem thêm đánh giá ({reviews.length - expandedReviews} còn lại)
                </Button>
              )}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && reviews.length === 0 && (
            <div className="text-center py-8">
              <Star size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">Chưa có đánh giá nào</p>
              {showWriteReview && (
                <Button onClick={() => setShowWriteModal(true)}>
                  Viết đánh giá đầu tiên
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={showWriteModal}
        onClose={() => setShowWriteModal(false)}
        productId={productId}
        isProduct={isProduct}
        onSubmitSuccess={handleReviewSubmitted}
      />
    </>
  );
};