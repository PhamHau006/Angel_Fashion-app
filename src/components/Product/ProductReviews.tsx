import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, User, Calendar, MessageSquare, Send, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { getApiUrl, getImageUrl, getPlatformInfo } from '@/config/api';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { useToast } from '@/hooks/use-toast';

// Extended JWT interface for user data
interface CustomJwtPayload extends JwtPayload {
  userId?: string;
  sub?: string;
  nameid?: string;
  unique_name?: string;
}

// Interfaces and types
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
  tenDoiTuong?: string;
  kichThuoc?: string;
  mauSac?: string;
  donGia?: number;
  tenHinhAnh?: string;
  avatarUrl?: string;
  hinhAnhs?: string[] | string;
  maCtHd: number;
}

interface ResponseAPI<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

interface ProductReviewsProps {
  productId: number;
  isProduct?: boolean;
  showWriteReview?: boolean;
  currentUserId?: number;
  orderDetailId?: number;
  onReviewSubmitted?: () => void;
}

// Modal Component
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Helper functions
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Không xác định';
  }
};

const formatPrice = (price?: number): string => {
  if (price == null) return 'N/A';
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  } catch {
    return `${price?.toLocaleString()} ₫`;
  }
};

const getReviewImages = (hinhAnhs?: string[] | string): string[] => {
  if (!hinhAnhs) return [];
  if (Array.isArray(hinhAnhs)) return hinhAnhs.filter(img => img?.trim());
  if (typeof hinhAnhs === 'string' && hinhAnhs.trim()) {
    return hinhAnhs.split(',').map(img => img.trim()).filter(img => img);
  }
  return [];
};

const getProductImage = (imageName: string | undefined, productName: string): string => {
  if (imageName && imageName !== 'placeholder.svg') {
    return getImageUrl(imageName);
  }
  const fallbackImages: Record<string, string> = {
    'áo khoác nam': 'aKhoacNam1.jpg',
    'áo khoác nữ': 'aKhoacNu1.jpg',
    'quần jean nam': 'qJeansNam1.jpg',
    'quần jean nữ': 'qJeansNu1.jpg',
    'quần jeans nữ': 'qJeansNu1.jpg',
  };
  const nameLower = (productName || 'unknown').toLowerCase();
  const matchedKey = Object.keys(fallbackImages).find(key => nameLower.includes(key));
  const image = matchedKey ? fallbackImages[matchedKey] : 'placeholder.svg';
  return getImageUrl(image);
};

// Enhanced ReviewApiService
class ReviewApiService {
  private static baseUrl = getApiUrl();

  static debugAuthAndApi(): void {
    const token = localStorage.getItem('accessToken');
    console.log('🔍 Debug Review API Info:');
    console.log(' - Auth Token:', token ? 'Có token' : 'Không có token');
    console.log(' - API Base URL:', this.baseUrl);
    console.log(' - Platform:', getPlatformInfo());
    if (token) {
      try {
        const decoded = jwtDecode<CustomJwtPayload>(token);
        console.log(' - Token User ID:', decoded.userId || decoded.nameid || decoded.sub || 'Không tìm thấy');
        console.log(' - Token Expiry:', decoded.exp ? new Date(decoded.exp * 1000).toLocaleString() : 'Không xác định');
      } catch (error) {
        console.error(' - Token decode error:', error);
      }
    }
  }

  static async addReview(
    reviewData: { maSp?: number; maCombo?: number; noiDung: string; soSao: number; maCtHd: number },
    images: File[],
    isProduct: boolean,
    authToken: string
  ): Promise<ResponseAPI<ReviewResponseDTO>> {
    try {
      this.debugAuthAndApi();

      if (!authToken) throw new Error('Vui lòng đăng nhập để gửi đánh giá');

      if (reviewData.maCtHd === 0 || !reviewData.maCtHd) {
        throw new Error('Bạn cần mua sản phẩm này để gửi đánh giá');
      }

      if (isProduct && (!reviewData.maSp || reviewData.maSp <= 0)) {
        throw new Error('Mã sản phẩm không hợp lệ');
      }

      if (!isProduct && (!reviewData.maCombo || reviewData.maCombo <= 0)) {
        throw new Error('Mã combo không hợp lệ');
      }

      if (!reviewData.noiDung || reviewData.noiDung.length < 10) {
        throw new Error('Nội dung đánh giá phải dài ít nhất 10 ký tự');
      }

      // Check for existing review via API
      const existingReviews = await this.getReviews(reviewData.maSp || reviewData.maCombo || 0, isProduct);
      const hasExistingReview = existingReviews.data.some(review =>
        review.maCtHd === reviewData.maCtHd &&
        (isProduct ? review.maSp === reviewData.maSp : review.maCombo === reviewData.maCombo) &&
        review.maKh === parseInt(jwtDecode<CustomJwtPayload>(authToken).sub || jwtDecode<CustomJwtPayload>(authToken).userId || jwtDecode<CustomJwtPayload>(authToken).nameid || '0')
      );
      if (hasExistingReview) {
        throw new Error('Bạn đã gửi đánh giá cho sản phẩm này rồi');
      }

      const formData = new FormData();
      formData.append('noiDung', reviewData.noiDung);
      formData.append('soSao', reviewData.soSao.toString());
      formData.append('maCtHd', reviewData.maCtHd.toString());

      if (isProduct && reviewData.maSp) formData.append('maSp', reviewData.maSp.toString());
      else if (!isProduct && reviewData.maCombo) formData.append('maCombo', reviewData.maCombo.toString());

      images.forEach((image, index) => {
        console.log(`📤 hinhAnhs[${index}]: ${image.name}, ${image.size} bytes, type: ${image.type}`);
        formData.append('hinhAnhs', image);
      });

      for (let [key, value] of formData.entries()) {
        console.log(`📤 ${key}: ${typeof value === 'object' ? value.name : value}`);
      }

      const url = `${this.baseUrl}/api/Review?isProduct=${isProduct}`;
      console.log('📤 Gửi đánh giá:', { url, reviewData, images: images.length });

      const response = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
        validateStatus: (status) => status < 500,
      });

      console.log('📥 Add Review Response:', response.data);

      if (response.status === 200 || response.status === 201) {
        if (response.data.success) return response.data;
        throw new Error(response.data.message || 'API trả về success=false');
      }

      throw new Error(`HTTP ${response.status}: ${response.data.message || 'Lỗi không xác định'}`);
    } catch (error) {
      console.error('❌ Lỗi thêm đánh giá:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        if (error.response?.status === 400) {
          throw new Error(error.response.data?.message || 'Dữ liệu không hợp lệ');
        }
        if (error.response?.status === 403) {
          throw new Error('Bạn không có quyền gửi đánh giá này');
        }
        if (error.response?.status === 404) {
          throw new Error('Không tìm thấy sản phẩm hoặc đơn hàng');
        }
        if (error.response?.status === 500) {
          console.error('🔍 Server 500 Error Details:', error.response.data);
          throw new Error(error.response.data?.message || 'Lỗi máy chủ nội bộ. Vui lòng liên hệ quản trị viên.');
        }
        if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
          throw new Error('Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.');
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Timeout: Upload mất quá nhiều thời gian. Vui lòng thử lại.');
        }
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Không thể thêm đánh giá.',
        data: {} as ReviewResponseDTO,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      };
    }
  }

  static async getReviews(productId: number, isProduct: boolean): Promise<ResponseAPI<ReviewResponseDTO[]>> {
    try {
      this.debugAuthAndApi();

      if (!productId || productId <= 0) throw new Error('Mã sản phẩm không hợp lệ');

      const authToken = localStorage.getItem('accessToken');
      if (!authToken) throw new Error('Vui lòng đăng nhập để xem đánh giá');

      const endpoint = isProduct ? `products/${productId}` : `combos/${productId}`;
      const url = `${this.baseUrl}/api/Review/${endpoint}`;

      console.log('🔍 Lấy đánh giá từ:', url);

      const response = await axios.get(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        timeout: 15000,
      });

      console.log('📥 Get Reviews Response:', response.data);

      if (response.data.success === false && response.data.message?.includes('Không có đánh giá')) {
        return { success: true, message: 'Không có đánh giá nào cho sản phẩm này', data: [] };
      }

      return response.data;
    } catch (error) {
      console.error('❌ Lỗi lấy đánh giá:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        if (error.response?.status === 404 || error.response?.data?.message?.includes('Không có đánh giá')) {
          return { success: true, message: 'Không có đánh giá nào cho sản phẩm này', data: [] };
        }
        if (error.response?.status === 500) {
          console.error('🔍 Server 500 Error Details:', error.response.data);
          return { success: true, message: 'Không có đánh giá nào cho sản phẩm này', data: [] };
        }
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Không thể tải đánh giá',
        data: [],
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      };
    }
  }

  static async updateReview(
    reviewData: { noiDung: string; soSao: number; maCtHd: number },
    images: File[],
    isProduct: boolean,
    authToken: string
  ): Promise<ResponseAPI<ReviewResponseDTO>> {
    try {
      if (!authToken) throw new Error('Vui lòng đăng nhập để cập nhật đánh giá');

      if (!reviewData.noiDung || reviewData.noiDung.length < 10) {
        throw new Error('Nội dung đánh giá phải dài ít nhất 10 ký tự');
      }

      const formData = new FormData();
      formData.append('noiDung', reviewData.noiDung);
      formData.append('soSao', reviewData.soSao.toString());
      formData.append('maCtHd', reviewData.maCtHd.toString());

      images.forEach((image, index) => {
        console.log(`📤 hinhAnhs[${index}]: ${image.name}, ${image.size} bytes, type: ${image.type}`);
        formData.append('hinhAnhs', image);
      });

      const url = `${this.baseUrl}/api/Review?isProduct=${isProduct}`;
      console.log('📤 Cập nhật đánh giá:', { url, reviewData, images: images.length });

      const response = await axios.put(url, formData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      console.log('📥 Update Review Response:', response.data);

      return response.data;
    } catch (error) {
      console.error('❌ Lỗi cập nhật đánh giá:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        if (error.response?.status === 400) {
          throw new Error(error.response.data?.message || 'Dữ liệu không hợp lệ');
        }
        if (error.response?.status === 500) {
          console.error('🔍 Server 500 Error Details:', error.response.data);
          throw new Error(error.response.data?.message || 'Lỗi máy chủ nội bộ. Vui lòng liên hệ quản trị viên.');
        }
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Không thể cập nhật đánh giá.',
        data: {} as ReviewResponseDTO,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      };
    }
  }

  static async deleteReview(reviewId: number, authToken: string): Promise<ResponseAPI<null>> {
    try {
      if (!authToken) throw new Error('Vui lòng đăng nhập để xóa đánh giá');

      const url = `${this.baseUrl}/api/Review/${reviewId}`;
      const response = await axios.delete(url, {
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        timeout: 15000,
      });

      return { success: true, message: 'Xóa đánh giá thành công', data: null };
    } catch (error) {
      console.error('❌ Lỗi xóa đánh giá:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        if (error.response?.status === 403) {
          throw new Error('Bạn không có quyền xóa đánh giá này');
        }
        if (error.response?.status === 500) {
          console.error('🔍 Server 500 Error Details:', error.response.data);
          throw new Error(error.response.data?.message || 'Lỗi máy chủ nội bộ. Vui lòng liên hệ quản trị viên.');
        }
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Không thể xóa đánh giá.',
        data: null,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      };
    }
  }

  static async checkOrderStatus(orderDetailId: number): Promise<boolean> {
    try {
      const authToken = localStorage.getItem('accessToken') || '';
      const decoded = jwtDecode<CustomJwtPayload>(authToken);
      const maKh = decoded.sub || decoded.userId || decoded.nameid;
      const response = await axios.get(`${this.baseUrl}/api/CustomerOrders/${maKh}`, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 15000,
      });
      console.log(`🔍 API Response from /api/CustomerOrders/${maKh}:`, JSON.stringify(response.data, null, 2));
      const order = response.data?.data?.find(o => o.cthoadons.some(i => i.id === orderDetailId));
      if (!order) {
        console.log(`🔍 Không tìm thấy đơn hàng với maCthd: ${orderDetailId}`);
        return false;
      }
      console.log(`🔍 Order ${orderDetailId} - MaHd: ${order.maHd}, MaKh: ${order.maKh}, Status: ${order.tinhTrang}`);
      if (order.maKh !== parseInt(maKh)) {
        console.log(`🔍 Mismatch: Token User ID (${maKh}) != Order MaKh (${order.maKh})`);
        return false;
      }
      const orderStatus = order.tinhTrang?.toLowerCase()?.trim();
      const validStatuses = ['đã nhận', 'đã thanh toán', 'da nhan', 'da thanh toan', 'Đã Nhận', 'Đã Thanh Toán'];
      console.log(`🔍 Order Status Check: ${orderStatus}, Valid: ${validStatuses.includes(orderStatus)}`);
      return validStatuses.includes(orderStatus);
    } catch (error) {
      console.error(`❌ Lỗi kiểm tra trạng thái đơn hàng ${orderDetailId}:`, error);
      if (axios.isAxiosError(error)) {
        console.error(`🔍 Mã lỗi: ${error.response?.status}, Thông điệp: ${error.response?.data?.message || 'Không xác định'}`);
      }
      return false;
    }
  }
}

// StarRating Component
const StarRating: React.FC<{
  rating: number;
  size?: string | number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}> = ({ rating, size = 16, interactive = false, onRatingChange }) => (
  <div className="flex items-center space-x-1" role="group" aria-label={`Đánh giá ${rating} sao`}>
    {[1, 2, 3, 4, 5].map(star => (
      <button
        key={star}
        type={interactive ? 'button' : undefined}
        onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
        className={`${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} ${
          interactive ? 'cursor-pointer hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500' : ''
        }`}
        aria-label={`Chọn ${star} sao`}
        disabled={!interactive}
      >
        <Star size={size} />
      </button>
    ))}
    <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
  </div>
);

// ReviewItem Component
const ReviewItem: React.FC<{
  review: ReviewResponseDTO;
  currentUserId?: number;
  onReviewUpdated: () => void;
  onReviewDeleted: () => void;
}> = ({ review, currentUserId, onReviewUpdated, onReviewDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newRating, setNewRating] = useState(review.soSao);
  const [newComment, setNewComment] = useState(review.noiDung);
  const [reviewImages, setReviewImages] = useState<string[]>(getReviewImages(review.hinhAnhs));
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const maxImages = 5;
  const maxImageSize = 5 * 1024 * 1024; // 5MB

  useEffect(() => {
    return () => {
      reviewImages.forEach(img => {
        if (img.startsWith('blob:')) URL.revokeObjectURL(img);
      });
    };
  }, [reviewImages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const nonImageFiles = files.filter(file => !file.type.startsWith('image/'));
    if (nonImageFiles.length > 0) {
      setError(`Các tệp sau không phải hình ảnh: ${nonImageFiles.map(f => f.name).join(', ')}`);
      return;
    }

    const totalImages = newImages.length + files.length;
    if (totalImages > maxImages) {
      setError(`Bạn chỉ có thể tải lên tối đa ${maxImages} ảnh.`);
      return;
    }

    const oversizedFiles = files.filter(file => file.size > maxImageSize);
    if (oversizedFiles.length > 0) {
      setError(
        `Các ảnh sau vượt quá dung lượng ${maxImageSize / 1024 / 1024}MB: ${oversizedFiles.map(f => f.name).join(', ')}`
      );
      return;
    }

    setNewImages([...newImages, ...files]);
    setReviewImages([...reviewImages, ...files.map(file => URL.createObjectURL(file))]);
    setError(null);
  };

  const removeImage = (index: number) => {
    const newReviewImages = [...reviewImages];
    const removedUrl = newReviewImages.splice(index, 1)[0];
    setReviewImages(newReviewImages);

    if (removedUrl.startsWith('blob:')) {
      const fileIndex = newImages.findIndex(file => URL.createObjectURL(file) === removedUrl);
      if (fileIndex > -1) {
        const newSelectedImages = [...newImages];
        newSelectedImages.splice(fileIndex, 1);
        setNewImages(newSelectedImages);
      }
      URL.revokeObjectURL(removedUrl);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`❌ Hình ảnh không tải được cho đánh giá ${review.id}: ${e.currentTarget.src}`);
    e.currentTarget.src = getImageUrl('placeholder.svg');
  };

  const handleEditSubmit = async () => {
    if (!newRating || newRating < 1 || newRating > 5) {
      setError('Vui lòng chọn số sao để đánh giá.');
      return;
    }
    if (!newComment.trim()) {
      setError('Vui lòng nhập nội dung đánh giá.');
      return;
    }
    if (newComment.length < 10) {
      setError('Nội dung đánh giá phải dài ít nhất 10 ký tự.');
      return;
    }
    if (!review.maCtHd || review.maCtHd === 0) {
      setError('Không thể chỉnh sửa đánh giá do thiếu mã chi tiết hóa đơn.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const authToken = localStorage.getItem('accessToken') || '';
      const reviewData = { noiDung: newComment, soSao: newRating, maCtHd: review.maCtHd };
      const result = await ReviewApiService.updateReview(reviewData, newImages, !!review.maSp, authToken);

      if (result.success) {
        setSuccess('Cập nhật đánh giá thành công!');
        toast({ title: 'Thành công', description: 'Cập nhật đánh giá thành công!' });
        setTimeout(() => {
          setIsEditing(false);
          setSuccess(null);
          setNewImages([]);
          setReviewImages(getReviewImages(result.data.hinhAnhs));
          onReviewUpdated();
        }, 2000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật đánh giá:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật đánh giá.';
      setError(errorMessage);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/login');
        toast({ title: 'Lỗi', description: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', variant: 'destructive' });
      } else {
        toast({ title: 'Lỗi', description: errorMessage, variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const authToken = localStorage.getItem('accessToken') || '';
      const result = await ReviewApiService.deleteReview(review.id, authToken);

      if (result.success) {
        toast({ title: 'Thành công', description: 'Xóa đánh giá thành công!' });
        onReviewDeleted();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('❌ Lỗi khi xóa đánh giá:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể xóa đánh giá.';
      setError(errorMessage);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/login');
        toast({ title: 'Lỗi', description: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', variant: 'destructive' });
      } else {
        toast({ title: 'Lỗi', description: errorMessage, variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {review.avatarUrl ? (
            <img
              src={getImageUrl(`Users/${review.avatarUrl}`)}
              alt={`Ảnh đại diện của ${review.tenKhachHang}`}
              className="w-8 h-8 rounded-full object-cover"
              onError={e => { e.currentTarget.src = getImageUrl('placeholder-user.svg'); }}
              loading="lazy"
            />
          ) : (
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
          )}
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

      <p className="text-sm text-gray-700 mb-3">{review.noiDung}</p>

      {reviewImages.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {reviewImages.map((imageName, index) => (
            <div key={index} className="relative">
              <img
                src={imageName.startsWith('blob:') ? imageName : getImageUrl(`Reviews/${imageName}`)}
                alt={`Hình ảnh đánh giá ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                onError={handleImageError}
                loading="lazy"
              />
              {isEditing && (
                <button
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  onClick={() => removeImage(index)}
                  aria-label={`Xóa ảnh ${index + 1}`}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <div className="flex items-center space-x-3">
          <img
            src={getProductImage(review.tenHinhAnh, review.tenDoiTuong || 'Sản phẩm không xác định')}
            alt={review.tenDoiTuong || 'Sản phẩm không xác định'}
            className="w-12 h-12 object-cover rounded-lg"
            onError={handleImageError}
            loading="lazy"
          />
          <div className="flex-1">
            <p className="font-medium text-sm">{review.tenDoiTuong || 'Sản phẩm không xác định'}</p>
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              {review.kichThuoc && <span>Size: {review.kichThuoc}</span>}
              {review.mauSac && <span>Màu: {review.mauSac}</span>}
              {review.donGia && <span>{formatPrice(review.donGia)}</span>}
            </div>
          </div>
        </div>
      </div>

      {review.shopPhanHoi && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg mt-3">
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquare size={14} className="text-blue-600" />
            <span className="font-medium text-sm text-blue-800">Phản hồi từ shop</span>
            {review.ngayPhanHoi && <span className="text-xs text-blue-600">{formatDate(review.ngayPhanHoi)}</span>}
          </div>
          <p className="text-sm text-blue-700">{review.shopPhanHoi}</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mt-3">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {currentUserId === review.maKh && (
        <div className="flex items-center justify-end mt-3 space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Chỉnh sửa đánh giá"
            disabled={isSubmitting}
          >
            Chỉnh sửa
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700"
            aria-label="Xóa đánh giá"
            disabled={isSubmitting}
          >
            Xóa
          </Button>
        </div>
      )}

      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Chỉnh sửa đánh giá">
        <div className="space-y-4">
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}

          <div>
            <p className="text-sm mb-1 font-medium">Chọn số sao</p>
            <StarRating rating={newRating} size={16} interactive onRatingChange={setNewRating} />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Nội dung đánh giá</label>
            <Textarea
              placeholder="Sản phẩm dùng có tốt không? Bạn có hài lòng không? Hãy chia sẻ cảm nhận của bạn (tối thiểu 10 ký tự)."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="min-h-24"
              aria-label="Nội dung đánh giá"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Hình ảnh (tối đa 5 ảnh, mỗi ảnh không quá 5MB)</label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              disabled={reviewImages.length >= maxImages}
              aria-label="Chọn hình ảnh đánh giá"
            />
            <small className="text-gray-500">Tối đa {maxImages} ảnh, mỗi ảnh không quá {maxImageSize / 1024 / 1024}MB.</small>
            {reviewImages.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {reviewImages.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={img}
                      alt={`Ảnh ${idx + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                      onError={handleImageError}
                      loading="lazy"
                    />
                    <button
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                      onClick={() => removeImage(idx)}
                      aria-label={`Xóa ảnh ${idx + 1}`}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
              aria-label="Hủy chỉnh sửa"
            >
              Hủy
            </Button>
            <Button
              className="flex-1"
              onClick={handleEditSubmit}
              disabled={isSubmitting || !newRating || !newComment.trim() || newComment.length < 10}
              aria-label="Cập nhật đánh giá"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Cập nhật
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Main Component
const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  isProduct = true,
  showWriteReview = false,
  currentUserId,
  orderDetailId = 0,
  onReviewSubmitted,
}) => {
  const [reviews, setReviews] = useState<ReviewResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [expandedReviews, setExpandedReviews] = useState(3);
  const [canReview, setCanReview] = useState<boolean>(false);
  const maxImages = 5;
  const maxImageSize = 5 * 1024 * 1024; // 5MB

  const navigate = useNavigate();
  const { toast } = useToast();

  const averageRating = useMemo(
    () => (reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.soSao, 0) / reviews.length : 0),
    [reviews]
  );

  useEffect(() => {
    const authToken = localStorage.getItem('accessToken') || '';
    if (authToken) {
      try {
        const userInfo = jwtDecode<CustomJwtPayload>(authToken);
        console.log('🔍 Thông tin người dùng đăng nhập:', userInfo);
      } catch (error) {
        console.log('❌ Lỗi decode token:', error);
      }
    } else {
      console.log('⚠️ Không tìm thấy authToken, người dùng chưa đăng nhập.');
    }
  }, []);

  useEffect(() => {
    const verifyCanReview = async () => {
      if (showWriteReview && orderDetailId) {
        try {
          const can = await ReviewApiService.checkOrderStatus(orderDetailId);
          setCanReview(can);
          if (!can) {
            setFormError(
              'Đơn hàng chưa đủ điều kiện để đánh giá (phải ở trạng thái "Đã nhận" hoặc "Đã thanh toán" và thuộc về bạn).'
            );
          }
        } catch (err) {
          setCanReview(false);
          setFormError('Không thể kiểm tra trạng thái đơn hàng.');
        }
      }
    };
    verifyCanReview();
  }, [showWriteReview, orderDetailId]);

  useEffect(() => {
    return () => {
      reviewImages.forEach(img => {
        if (img.startsWith('blob:')) URL.revokeObjectURL(img);
      });
    };
  }, [reviewImages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const nonImageFiles = files.filter(file => !file.type.startsWith('image/'));
    if (nonImageFiles.length > 0) {
      setFormError(`Các tệp sau không phải hình ảnh: ${nonImageFiles.map(f => f.name).join(', ')}`);
      return;
    }

    const totalImages = newImages.length + files.length;
    if (totalImages > maxImages) {
      setFormError(`Bạn chỉ có thể tải lên tối đa ${maxImages} ảnh.`);
      return;
    }

    const oversizedFiles = files.filter(file => file.size > maxImageSize);
    if (oversizedFiles.length > 0) {
      setFormError(
        `Các ảnh sau vượt quá dung lượng ${maxImageSize / 1024 / 1024}MB: ${oversizedFiles.map(f => f.name).join(', ')}`
      );
      return;
    }

    setNewImages([...newImages, ...files]);
    setReviewImages([...reviewImages, ...files.map(file => URL.createObjectURL(file))]);
    setFormError(null);
  };

  const removeImage = (index: number) => {
    const newReviewImages = [...reviewImages];
    const removedUrl = newReviewImages.splice(index, 1)[0];
    setReviewImages(newReviewImages);

    if (removedUrl.startsWith('blob:')) {
      const fileIndex = newImages.findIndex(file => URL.createObjectURL(file) === removedUrl);
      if (fileIndex > -1) {
        const newSelectedImages = [...newImages];
        newSelectedImages.splice(fileIndex, 1);
        setNewImages(newSelectedImages);
      }
      URL.revokeObjectURL(removedUrl);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`❌ Hình ảnh không tải được: ${e.currentTarget.src}`);
    e.currentTarget.src = getImageUrl('placeholder.svg');
  };

  const handleSubmit = async () => {
    if (!newRating || newRating < 1 || newRating > 5) {
      setFormError('Vui lòng chọn số sao để đánh giá.');
      return;
    }
    if (!newComment.trim()) {
      setFormError('Vui lòng nhập nội dung đánh giá.');
      return;
    }
    if (newComment.length < 10) {
      setFormError('Nội dung đánh giá phải dài ít nhất 10 ký tự.');
      return;
    }
    if (!orderDetailId || orderDetailId <= 0) {
      setFormError('Mã chi tiết hóa đơn không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }
    if (!productId || productId <= 0) {
      setFormError('Mã sản phẩm không hợp lệ.');
      return;
    }
    if (!canReview) {
      setFormError('Đơn hàng chưa đủ điều kiện để đánh giá (phải ở trạng thái "Đã nhận" hoặc "Đã thanh toán").');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const authToken = localStorage.getItem('accessToken') || '';
      if (!authToken) {
        setFormError('Vui lòng đăng nhập để gửi đánh giá.');
        navigate('/login');
        toast({ title: 'Lỗi', description: 'Vui lòng đăng nhập để gửi đánh giá.', variant: 'destructive' });
        return;
      }

      const reviewData = {
        noiDung: newComment,
        soSao: newRating,
        maCtHd: orderDetailId,
        [isProduct ? 'maSp' : 'maCombo']: productId,
      };

      console.log(`📝 Gửi đánh giá mới với dữ liệu:`, reviewData);
      console.log('📤 FormData nội dung:');
      const formData = new FormData();
      formData.append('noiDung', reviewData.noiDung);
      formData.append('soSao', reviewData.soSao.toString());
      formData.append('maCtHd', reviewData.maCtHd.toString());
      if (isProduct && reviewData.maSp) formData.append('maSp', reviewData.maSp.toString());
      else if (!isProduct && reviewData.maCombo) formData.append('maCombo', reviewData.maCombo.toString());
      newImages.forEach((image, index) => {
        console.log(`📤 hinhAnhs[${index}]: ${image.name}, ${image.size} bytes, type: ${image.type}`);
        formData.append('hinhAnhs', image);
      });
      for (let [key, value] of formData.entries()) {
        console.log(`📤 ${key}: ${typeof value === 'object' ? value.name : value}`);
      }

      const result = await ReviewApiService.addReview(reviewData, newImages, isProduct, authToken);

      if (result.success) {
        setFormSuccess('Gửi đánh giá thành công!');
        toast({ title: 'Thành công', description: 'Gửi đánh giá thành công!' });
        onReviewSubmitted?.();
        setTimeout(() => {
          setShowReviewForm(false);
          setFormSuccess(null);
          setNewRating(5);
          setNewComment('');
          setNewImages([]);
          setReviewImages([]);
          loadReviews();
        }, 1500);
      } else {
        throw new Error(result.message || 'Không thể gửi đánh giá.');
      }
    } catch (error) {
      console.error('❌ Lỗi khi gửi đánh giá:', error);
      let errorMessage = 'Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.';
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          navigate('/login');
        } else if (error.response?.status === 400) {
          errorMessage = error.response.data?.message || 'Dữ liệu đánh giá không hợp lệ.';
        } else if (error.response?.status === 403) {
          errorMessage = 'Bạn không có quyền gửi đánh giá này.';
        } else if (error.response?.status === 404) {
          errorMessage = 'Không tìm thấy sản phẩm hoặc đơn hàng.';
        } else if (error.response?.status === 500) {
          errorMessage = error.response.data?.message || 'Lỗi máy chủ nội bộ. Vui lòng liên hệ quản trị viên.';
          console.error('🔍 Server 500 Error Details:', error.response.data);
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setFormError(errorMessage);
      toast({ title: 'Lỗi', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadReviews = useCallback(async () => {
    if (!productId || productId <= 0) {
      setError('Mã sản phẩm không hợp lệ');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ReviewApiService.getReviews(productId, isProduct);
      if (result.success) {
        setReviews(result.data);
        console.log(`📥 Đã tải ${result.data.length} đánh giá cho ${isProduct ? 'maSp' : 'maCombo'} ${productId}`);
        if (result.data.length === 0) {
          setError('Chưa có đánh giá nào cho sản phẩm này');
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('❌ Lỗi khi tải đánh giá:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải đánh giá';
      setError(errorMessage);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        navigate('/login');
        toast({ title: 'Lỗi', description: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  }, [productId, isProduct, navigate, toast]);

  const handleReviewChange = useCallback(async () => {
    try {
      await loadReviews();
      onReviewSubmitted?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể làm mới danh sách đánh giá';
      setError(errorMessage);
      toast({ title: 'Lỗi', description: errorMessage, variant: 'destructive' });
    }
  }, [loadReviews, onReviewSubmitted]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return (
    <Card className="m-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Đánh giá {isProduct ? 'sản phẩm' : 'combo'}</CardTitle>
          {showWriteReview && orderDetailId !== 0 && canReview && (
            <Button size="sm" onClick={() => setShowReviewForm(true)} aria-label="Viết đánh giá">
              <Star size={16} className="mr-2" />
              Viết đánh giá
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
            <StarRating rating={averageRating} size={20} />
          </div>
          <span className="text-gray-500">{reviews.length} đánh giá</span>
        </div>
      </CardHeader>

      <CardContent>
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showWriteReview && (!orderDetailId || orderDetailId === 0) && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>Bạn cần mua sản phẩm này để gửi đánh giá.</AlertDescription>
          </Alert>
        )}

        {showWriteReview && orderDetailId !== 0 && !canReview && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>Bạn chỉ có thể đánh giá khi đơn hàng ở trạng thái "Đã nhận" hoặc "Đã thanh toán".</AlertDescription>
          </Alert>
        )}

        {!loading && !error && reviews.length > 0 && (
          <div className="space-y-4">
            {reviews.slice(0, expandedReviews).map(review => (
              <ReviewItem
                key={review.id}
                review={review}
                currentUserId={currentUserId}
                onReviewUpdated={handleReviewChange}
                onReviewDeleted={handleReviewChange}
              />
            ))}
            {expandedReviews < reviews.length && (
              <Button
                variant="outline"
                onClick={() => setExpandedReviews(prev => prev + 5)}
                className="w-full"
                aria-label={`Xem thêm ${Math.min(5, reviews.length - expandedReviews)} đánh giá`}
              >
                Xem thêm
              </Button>
            )}
          </div>
        )}

        <Modal isOpen={showReviewForm} onClose={() => setShowReviewForm(false)} title="Viết đánh giá">
          <div className="space-y-4">
            {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
            {formSuccess && <Alert><AlertDescription>{formSuccess}</AlertDescription></Alert>}

            <div>
              <p className="text-sm mb-1 font-medium">Chọn số sao</p>
              <StarRating rating={newRating} size={16} interactive onRatingChange={setNewRating} />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Nội dung đánh giá</label>
              <Textarea
                placeholder="Sản phẩm dùng có tốt không? Bạn có hài lòng không? Hãy chia sẻ cảm nhận của bạn (tối thiểu 10 ký tự)."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="min-h-24"
                aria-label="Nội dung đánh giá"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Hình ảnh (tối đa 5 ảnh, mỗi ảnh không quá 5MB)</label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                disabled={reviewImages.length >= maxImages}
                aria-label="Chọn hình ảnh đánh giá"
              />
              <small className="text-gray-500">Tối đa {maxImages} ảnh, mỗi ảnh không quá {maxImageSize / 1024 / 1024}MB.</small>
              {reviewImages.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {reviewImages.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img}
                        alt={`Ảnh ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded border"
                        onError={handleImageError}
                        loading="lazy"
                      />
                      <button
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        onClick={() => removeImage(idx)}
                        aria-label={`Xóa ảnh ${idx + 1}`}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowReviewForm(false)}
                disabled={isSubmitting}
                aria-label="Hủy viết đánh giá"
              >
                Hủy
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting || !newRating || !newComment.trim() || newComment.length < 10}
                aria-label="Gửi đánh giá"
              >
                {isSubmitting ? (
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
        </Modal>
      </CardContent>
    </Card>
  );
};

export default ProductReviews;