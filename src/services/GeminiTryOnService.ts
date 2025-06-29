// GeminiTryOnService.ts
interface TryOnResult {
    success: boolean;
    imageUrl?: string;
    error?: string;
  }
  
  interface ApiResponse {
    responseCode: number;
    result?: string;
    errorMessage?: string;
  }
  
  class GeminiTryOnService {
    static API_ENDPOINT = 'http://localhost:5261/api/Gemini/Response';
  
    /**
     * Kiểm tra tính hợp lệ của file ảnh
     * @param file File ảnh cần kiểm tra
     * @returns boolean True nếu file hợp lệ
     * @throws Error nếu file không hợp lệ
     */
    static validateImageFile(file: File): boolean {
      // Kiểm tra kích thước file
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 10MB.');
      }
      
      // Kiểm tra định dạng file
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        throw new Error('Chỉ hỗ trợ các định dạng ảnh: JPG, JPEG, PNG');
      }
      
      return true;
    }
  
    /**
     * Chuyển đổi URL thành base64
     * @param url URL của hình ảnh
     * @returns Promise<string> Chuỗi base64 của hình ảnh
     */
    static async urlToBase64(url: string): Promise<string> {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              const base64Data = reader.result.split(',')[1];
              resolve(base64Data);
            } else {
              reject(new Error('Kết quả không phải là chuỗi'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Lỗi khi chuyển URL sang base64:', error);
        throw error;
      }
    }
  
    /**
     * Thử xử lý với API Gemini
     * @param userImageBase64 Ảnh người dùng dạng base64 hoặc data URL
     * @param productImageBase64 Ảnh sản phẩm dạng base64
     * @param prompt Câu hỏi gửi đến API
     * @returns Promise<TryOnResult>
     */
    static async tryWithGeminiAPI(
      userImageBase64: string,
      productImageBase64: string,
      prompt: string = 'Mặc cái áo này lên người này giúp tôi'
    ): Promise<TryOnResult> {
      try {
        console.log('🚀 Bắt đầu xử lý với Gemini API...');
        
        // Nếu userImageBase64 là data URL, trích xuất phần base64
        let userImage = userImageBase64;
        if (userImageBase64.includes('base64,')) {
          userImage = userImageBase64.split('base64,')[1];
        }
        
        const requestData = {
          cauHoi: prompt,
          hinhAnh: [userImage, productImageBase64],
        };
  
        const response = await fetch(this.API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
  
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
  
        const data: ApiResponse = await response.json();
  
        if (data.responseCode === 201 && data.result) {
          console.log('✅ Gemini API xử lý thành công!');
          return {
            success: true,
            imageUrl: `data:image/png;base64,${data.result}`
          };
        } else {
          throw new Error(data.errorMessage || 'Có lỗi xảy ra khi xử lý yêu cầu');
        }
      } catch (error: any) {
        console.error('❌ Gemini API xử lý thất bại:', error);
        return {
          success: false,
          error: error.message || 'Có lỗi xảy ra với Gemini API. Vui lòng thử lại!'
        };
      }
    }
  
    /**
     * Xử lý Try-On với các prompt khác nhau
     * @param userImageBase64 Ảnh người dùng dạng base64 hoặc data URL
     * @param productImageBase64 Ảnh sản phẩm dạng base64
     * @returns Promise<TryOnResult> Kết quả của quá trình try-on
     */
    static async processWithAllFallbacks(
      userImageBase64: string, 
      productImageBase64: string
    ): Promise<TryOnResult> {
      // Thử với các prompt khác nhau
      const prompts = [
        'Mặc cái áo này lên người này giúp tôi',
        'Chỉnh sửa ảnh để người trong ảnh thứ nhất mặc quần áo trong ảnh thứ hai. Hãy đảm bảo kết quả trông tự nhiên.',
        'Hãy làm cho người trong ảnh đầu tiên mặc trang phục trong ảnh thứ hai một cách hài hòa.',
        'Ghép ảnh quần áo ở ảnh thứ hai vào người ở ảnh thứ nhất. Cố gắng làm cho kết quả trông chân thực.',
        'Chỉnh sửa ảnh để người trong ảnh đầu tiên mặc trang phục trong ảnh thứ hai, kết quả trông giống như chụp ảnh thật.',
        'Photoshop người trong ảnh đầu tiên để họ mặc quần áo trong ảnh thứ hai.'
      ];
      
      let lastError = '';
      
      // Thử từng prompt cho đến khi thành công
      for (const prompt of prompts) {
        console.log(`🔄 Thử với prompt: "${prompt.substring(0, 30)}..."`);
        
        const result = await this.tryWithGeminiAPI(userImageBase64, productImageBase64, prompt);
        if (result.success) return result;
        
        lastError = result.error || lastError;
      }
      
      // Tạo ảnh demo nếu tất cả các phương thức đều thất bại (Chỉ để demo)
      if (process.env.NODE_ENV === 'development') {
        try {
          return await this.createDemoResult(userImageBase64, productImageBase64);
        } catch (error) {
          console.error('Không thể tạo kết quả demo:', error);
        }
      }
      
      // Nếu tất cả đều thất bại, trả về lỗi cuối cùng
      return {
        success: false,
        error: lastError || 'Không thể xử lý ảnh. Vui lòng thử lại với ảnh khác.'
      };
    }
  
    /**
     * Tạo kết quả demo (chỉ dùng khi phát triển)
     * @param userImageBase64 Ảnh người dùng
     * @param productImageBase64 Ảnh sản phẩm 
     * @returns Promise<TryOnResult>
     */
    private static async createDemoResult(
      userImageBase64: string,
      productImageBase64: string
    ): Promise<TryOnResult> {
      console.log('⚠️ Tạo kết quả demo để kiểm thử...');
      
      // Dùng ảnh sản phẩm làm kết quả demo trong trường hợp API thất bại
      // Trong môi trường thực tế, bạn nên loại bỏ đoạn mã này
      
      return {
        success: true,
        imageUrl: userImageBase64.includes('base64,') ? userImageBase64 : `data:image/jpeg;base64,${userImageBase64}`
      };
    }
  
    /**
     * Chuyển đổi file sang base64
     * @param file File cần chuyển đổi
     * @returns Promise<string> Chuỗi base64 của file
     */
    static readFileAsBase64(file: File): Promise<string> {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const base64Data = reader.result.split(',')[1];
            resolve(base64Data);
          } else {
            reject(new Error('Kết quả không phải là chuỗi'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }
  
  export default GeminiTryOnService;