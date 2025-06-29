// src/services/cartService.ts - Enhanced Debug Version

import { getApiUrl } from '../config/api';

const API_URL = getApiUrl();

// Unified cart item interface theo API của bạn
export interface CartItemData {
  maKh: number;
  maCtsp: number;         // > 0 for products, 0 for combos
  maCombo: number;        // > 0 for combos, 0 for products  
  soLuong: number;
  donGia: number;
  giamGia: number;        // 0 for products, discount amount for combos
  tenHinhAnh: string;
  giohangctcombos: Array<{
    maCtsp: number;
    soLuong: number;
    donGia: number;
  }>;
}

export interface CartResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  validationErrors?: string[];
}

// Enhanced JSON parser with better error details
const safeJsonParse = async (response: Response): Promise<any> => {
  const text = await response.text();
  
  console.log('🔍 Response details:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    bodyLength: text.length,
    bodyPreview: text.substring(0, 200)
  });
  
  // Check if response is empty
  if (!text || text.trim() === '') {
    console.log('📝 Empty response body');
    return { 
      success: response.ok, 
      message: response.ok ? 'Thành công' : 'Có lỗi xảy ra',
      error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
    };
  }

  try {
    const parsed = JSON.parse(text);
    console.log('✅ Successfully parsed JSON:', parsed);
    return parsed;
  } catch (error) {
    console.error('❌ JSON parse error:', error);
    
    // If it's HTML (likely an error page), extract meaningful info
    if (text.includes('<html>') || text.includes('<!DOCTYPE')) {
      // Try to extract error message from HTML
      const titleMatch = text.match(/<title>(.*?)<\/title>/i);
      const h1Match = text.match(/<h1[^>]*>(.*?)<\/h1>/i);
      const errorMessage = titleMatch?.[1] || h1Match?.[1] || 'Server error';
      
      return { 
        success: false, 
        error: `Server error: ${errorMessage}`,
        message: 'Lỗi server - trang HTML được trả về thay vì JSON',
        rawResponse: text.substring(0, 500)
      };
    }
    
    // Check if it's a .NET error response
    if (text.includes('Exception') || text.includes('StackTrace')) {
      return {
        success: false,
        error: 'Database or server exception occurred',
        message: 'Lỗi cơ sở dữ liệu',
        details: text.substring(0, 300)
      };
    }
    
    return { 
      success: false, 
      error: `Invalid JSON response: ${error.message}`,
      message: 'Phản hồi không hợp lệ từ server',
      rawResponse: text.substring(0, 200)
    };
  }
};

// Validation helper for cart data
const validateCartData = (cartData: CartItemData): string[] => {
  const errors: string[] = [];
  
  if (!cartData.maKh || cartData.maKh <= 0) {
    errors.push('maKh must be a positive number');
  }
  
  if (cartData.maCtsp === 0 && cartData.maCombo === 0) {
    errors.push('Either maCtsp or maCombo must be greater than 0');
  }
  
  if (cartData.maCtsp > 0 && cartData.maCombo > 0) {
    errors.push('Only one of maCtsp or maCombo should be greater than 0');
  }
  
  if (!cartData.soLuong || cartData.soLuong <= 0) {
    errors.push('soLuong must be a positive number');
  }
  
  if (cartData.donGia < 0) {
    errors.push('donGia cannot be negative');
  }
  
  if (cartData.giamGia < 0) {
    errors.push('giamGia cannot be negative');
  }
  
  // For combos, validate combo items
  if (cartData.maCombo > 0) {
    if (!cartData.giohangctcombos || cartData.giohangctcombos.length === 0) {
      errors.push('Combo must have at least one item in giohangctcombos');
    } else {
      cartData.giohangctcombos.forEach((item, index) => {
        if (!item.maCtsp || item.maCtsp <= 0) {
          errors.push(`Combo item ${index + 1}: maCtsp must be positive`);
        }
        if (!item.soLuong || item.soLuong <= 0) {
          errors.push(`Combo item ${index + 1}: soLuong must be positive`);
        }
        if (item.donGia < 0) {
          errors.push(`Combo item ${index + 1}: donGia cannot be negative`);
        }
      });
    }
  }
  
  return errors;
};

export class CartService {
  
  // ===== ADD SINGLE PRODUCT TO CART =====
  static async addProductToCart(
    customerId: number,
    productDetailId: number,
    quantity: number,
    price: number,
    imageName?: string,
    size?: string,
    color?: string
  ): Promise<CartResponse> {
    try {
      console.log('🛒 CartService: Adding product with params:', { customerId, productDetailId, quantity, price, imageName, size, color });
  
      const cartData: CartItemData = {
        maKh: customerId,
        maCtsp: productDetailId,
        maCombo: 0,
        soLuong: quantity,
        donGia: price,
        giamGia: 0,
        tenHinhAnh: imageName || '',
        giohangctcombos: []
      };
  
      const validationErrors = validateCartData(cartData);
      if (validationErrors.length > 0) {
        console.error('❌ Validation errors:', validationErrors);
        return { success: false, message: 'Dữ liệu không hợp lệ', error: validationErrors.join(', '), validationErrors };
      }
  
      console.log('📦 Sending cart data:', JSON.stringify(cartData, null, 2));
  
      const response = await fetch(`${API_URL}/api/Cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(cartData)
      });
  
      console.log('🔍 Response status:', response.status); // Thêm log trạng thái
      const result = await safeJsonParse(response);
  
      if (!response.ok) {
        console.error('❌ Server responded with error:', { status: response.status, statusText: response.statusText, result });
        let errorMessage = 'Không thể thêm sản phẩm';
        if (response.status === 400) errorMessage = result.error || 'Dữ liệu không hợp lệ';
        return { success: false, message: errorMessage, error: result.error || `HTTP ${response.status}` };
      }
  
      console.log('✅ CartService: Product added successfully');
      return { success: true, message: result.message || 'Đã thêm sản phẩm', data: result };
    } catch (error) {
      console.error('❌ Network or unexpected error:', error);
      return { success: false, message: 'Lỗi kết nối', error: error.message };
    }
  }

  // ===== ADD COMBO TO CART =====
  static async addComboToCart(
    customerId: number,
    comboId: number,
    quantity: number,
    comboPrice: number,
    discountAmount: number,
    comboImage: string,
    comboItems: Array<{
      maCtsp: number;
      soLuong: number;
      donGia: number;
    }>
  ): Promise<CartResponse> {
    try {
      console.log('🎁 CartService: Adding combo to cart with params:', {
        customerId,
        comboId,
        quantity,
        comboPrice,
        discountAmount,
        comboImage,
        comboItems
      });

      const cartData: CartItemData = {
        maKh: customerId,
        maCtsp: 0,
        maCombo: comboId,
        soLuong: quantity,
        donGia: comboPrice,
        giamGia: discountAmount,
        tenHinhAnh: comboImage,
        giohangctcombos: comboItems
      };

      // Validate data before sending
      const validationErrors = validateCartData(cartData);
      if (validationErrors.length > 0) {
        console.error('❌ Validation errors:', validationErrors);
        return {
          success: false,
          message: 'Dữ liệu combo không hợp lệ',
          error: validationErrors.join(', '),
          validationErrors
        };
      }

      console.log('📦 Sending combo cart data:', JSON.stringify(cartData, null, 2));

      const response = await fetch(`${API_URL}/api/Cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(cartData)
      });

      const result = await safeJsonParse(response);

      if (!response.ok) {
        console.error('❌ Server responded with error:', {
          status: response.status,
          statusText: response.statusText,
          result
        });
        
        let errorMessage = 'Không thể thêm combo vào giỏ hàng';
        
        if (response.status === 400) {
          errorMessage = 'Dữ liệu combo không hợp lệ';
        } else if (response.status === 500) {
          errorMessage = 'Lỗi server khi xử lý combo';
        }
        
        return {
          success: false,
          message: errorMessage,
          error: result.error || result.message || `HTTP ${response.status}`,
          data: result
        };
      }

      console.log('✅ CartService: Combo added successfully');
      return {
        success: true,
        message: result.message || 'Đã thêm combo vào giỏ hàng',
        data: result
      };

    } catch (error) {
      console.error('❌ CartService: Network or unexpected error:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi thêm combo',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ===== TEST CONNECTION =====
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔗 Testing API connection to:', API_URL);
      
      const response = await fetch(`${API_URL}/api/Cart/1`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Test response status:', response.status);
      
      // Even if cart is empty (404), the API is reachable
      return response.status === 200 || response.status === 404;
      
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  // ===== GET CART ITEMS =====
  static async getCartItems(customerId: number): Promise<CartResponse> {
    try {
      console.log(`🛒 CartService: Fetching cart for customer ${customerId}`);

      const response = await fetch(`${API_URL}/api/Cart/${customerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await safeJsonParse(response);

      if (!response.ok) {
        return {
          success: false,
          message: 'Không thể tải giỏ hàng',
          error: result.error || `HTTP ${response.status}`
        };
      }

      console.log('✅ CartService: Cart items loaded');
      return {
        success: true,
        message: 'Tải giỏ hàng thành công',
        data: result
      };

    } catch (error) {
      console.error('❌ CartService: Get cart error:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi tải giỏ hàng',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ===== REMOVE ITEM FROM CART =====
  static async removeFromCart(cartItemId: number): Promise<CartResponse> {
    try {
      console.log(`🗑️ CartService: Removing item ${cartItemId}`);

      const response = await fetch(`${API_URL}/api/Cart/${cartItemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await safeJsonParse(response);

      if (!response.ok) {
        return {
          success: false,
          message: 'Không thể xóa sản phẩm',
          error: result.error || `HTTP ${response.status}`
        };
      }

      console.log('✅ CartService: Item removed');
      return {
        success: true,
        message: result.message || 'Đã xóa khỏi giỏ hàng',
        data: result
      };

    } catch (error) {
      console.error('❌ CartService: Remove from cart error:', error);
      return {
        success: false,
        message: 'Lỗi kết nối khi xóa sản phẩm',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// ===== UTILITY FUNCTIONS =====
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

export const getCurrentCustomerId = (): number => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return parseInt(payload.sub, 10) || 1;
      } catch (error) {
        console.error('Error decoding token:', error);
        return 1; // Fallback to default
      }
    }
    return 1; // Default if no token
  };

// ===== VALIDATION HELPERS =====
export const validateProductCartData = (
  customerId: number,
  productDetailId: number,
  quantity: number,
  price: number
): string | null => {
  if (!customerId || customerId <= 0) return 'Customer ID không hợp lệ';
  if (!productDetailId || productDetailId <= 0) return 'Product Detail ID không hợp lệ';
  if (quantity <= 0) return 'Số lượng phải lớn hơn 0';
  if (price < 0) return 'Giá sản phẩm không thể âm';
  
  return null;
};

export const validateComboCartData = (
  customerId: number,
  comboId: number,
  quantity: number,
  comboPrice: number,
  comboItems: Array<any>
): string | null => {
  if (!customerId || customerId <= 0) return 'Customer ID không hợp lệ';
  if (!comboId || comboId <= 0) return 'Combo ID không hợp lệ';
  if (quantity <= 0) return 'Số lượng phải lớn hơn 0';
  if (comboPrice < 0) return 'Giá combo không thể âm';
  if (!comboItems || comboItems.length === 0) return 'Combo phải có ít nhất một sản phẩm';
  
  return null;
};