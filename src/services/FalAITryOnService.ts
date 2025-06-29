// src/services/FalAITryOnService.ts
interface TryOnResult {
    success: boolean;
    imageUrl?: string;
    error?: string;
  }
  
  class FalAITryOnService {
    private apiKey: string;
    private baseUrl: string;
  
    constructor() {
      // Fal.AI API configuration (có free tier)
      this.apiKey = import.meta.env.VITE_FAL_API_KEY || '';
      this.baseUrl = 'https://fal.run/fal-ai';
      
      console.log('Fal.AI API Key:', this.apiKey ? 'Present' : 'Missing');
    }
  
    /**
     * Main function for realistic virtual try-on
     * @param personImage - User's photo (File object or base64)
     * @param garmentImage - Product image (File object or base64)
     * @returns Promise with realistic try-on result
     */
    async processRealisticTryOn(personImage: File | string, garmentImage: File | string): Promise<TryOnResult> {
      try {
        console.log('🚀 Starting Fal.AI Virtual Try-On...');
  
        // Convert images to proper format
        const personB64 = await this.ensureBase64(personImage);
        const garmentB64 = await this.ensureBase64(garmentImage);
  
        // Method 1: Try Fal.AI IDM-VTON model
        try {
          return await this.procesWithFalAI(personB64, garmentB64);
        } catch (falError) {
          console.log('Fal.AI failed, trying Replicate...');
          
          // Method 2: Try Replicate as backup
          return await this.processWithReplicate(personB64, garmentB64);
        }
  
      } catch (error) {
        console.error('❌ All AI services failed:', error);
        return {
          success: false,
          error: `AI processing failed: ${(error as Error).message}`
        };
      }
    }
  
    /**
     * Process with Fal.AI IDM-VTON model (realistic try-on)
     */
    private async procesWithFalAI(personB64: string, garmentB64: string): Promise<TryOnResult> {
      console.log('🎯 Using Fal.AI IDM-VTON model...');
  
      const response = await fetch('https://fal.run/fal-ai/idm-vton', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          person_image_url: `data:image/jpeg;base64,${personB64}`,
          garment_image_url: `data:image/jpeg;base64,${garmentB64}`,
          garment_description: "clothing item for virtual try-on",
          is_checked: true,
          is_checked_crop: false,
          denoise_steps: 30,
          seed: 42
        })
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fal.AI API Error:', errorText);
        throw new Error(`Fal.AI API error: ${response.status}`);
      }
  
      const result = await response.json();
      console.log('Fal.AI response:', result);
  
      if (result.image_url || result.image) {
        const imageUrl = result.image_url || result.image;
        
        // Convert to blob URL for local use
        const imageResponse = await fetch(imageUrl);
        const blob = await imageResponse.blob();
        const localUrl = URL.createObjectURL(blob);
  
        return {
          success: true,
          imageUrl: localUrl
        };
      }
  
      throw new Error('No image returned from Fal.AI');
    }
  
    /**
     * Process with Replicate as backup
     */
    private async processWithReplicate(personB64: string, garmentB64: string): Promise<TryOnResult> {
      console.log('🔄 Using Replicate IDM-VTON backup...');
  
      // Use public Replicate endpoint (no auth needed for some models)
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2a15372670e2f21", // IDM-VTON model
          input: {
            crop: false,
            seed: 42,
            steps: 30,
            person_img: `data:image/jpeg;base64,${personB64}`,
            garment_img: `data:image/jpeg;base64,${garmentB64}`,
            garment_des: "clothing item"
          }
        })
      });
  
      if (!response.ok) {
        throw new Error(`Replicate API error: ${response.status}`);
      }
  
      const prediction = await response.json();
      
      // Poll for completion
      let result = prediction;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout
  
      while ((result.status === 'starting' || result.status === 'processing') && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`);
        result = await statusResponse.json();
        attempts++;
      }
  
      if (result.status === 'succeeded' && result.output) {
        // Convert result to blob URL
        const imageResponse = await fetch(result.output);
        const blob = await imageResponse.blob();
        const localUrl = URL.createObjectURL(blob);
  
        return {
          success: true,
          imageUrl: localUrl
        };
      }
  
      throw new Error('Replicate processing failed or timed out');
    }
  
    /**
     * FREE Alternative: Use RunPod Serverless (if available)
     */
    async processWithRunPod(personB64: string, garmentB64: string): Promise<TryOnResult> {
      console.log('⚡ Using RunPod Serverless...');
  
      const response = await fetch('https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/runsync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            person_image: personB64,
            garment_image: garmentB64,
            prompt: "realistic virtual try-on, high quality, detailed",
            num_inference_steps: 20,
            guidance_scale: 7.5
          }
        })
      });
  
      const result = await response.json();
      
      if (result.output && result.output.image_url) {
        const imageResponse = await fetch(result.output.image_url);
        const blob = await imageResponse.blob();
        const localUrl = URL.createObjectURL(blob);
  
        return {
          success: true,
          imageUrl: localUrl
        };
      }
  
      throw new Error('RunPod processing failed');
    }
  
    /**
     * Ensure image is in base64 format
     */
    private async ensureBase64(image: File | string): Promise<string> {
      if (typeof image === 'string') {
        return image.includes(',') ? image.split(',')[1] : image;
      }
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(image);
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
      });
    }
  
    /**
     * Fetch image from URL and convert to base64
     */
    async urlToBase64(imageUrl: string): Promise<string> {
      try {
        console.log('🔄 Fetching image from URL:', imageUrl);
        
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = error => reject(error);
        });
      } catch (error) {
        // Fallback to canvas method
        return this.convertImageToBase64Fallback(imageUrl);
      }
    }
  
    /**
     * Canvas fallback for CORS images
     */
    private async convertImageToBase64Fallback(imageUrl: string): Promise<string> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              throw new Error('Cannot get canvas context');
            }
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            const base64 = dataURL.split(',')[1];
            
            console.log('✅ Image converted via canvas method');
            resolve(base64);
          } catch (canvasError) {
            console.error('❌ Canvas conversion failed:', canvasError);
            reject(new Error('Không thể chuyển đổi ảnh sản phẩm'));
          }
        };
        
        img.onerror = () => {
          reject(new Error('Không thể tải ảnh sản phẩm'));
        };
        
        img.src = imageUrl;
      });
    }
  
    /**
     * Validate image file
     */
    validateImageFile(file: File): boolean {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Định dạng file không hợp lệ. Vui lòng sử dụng JPG, PNG, hoặc WebP');
      }
      
      if (file.size > maxSize) {
        throw new Error('File quá lớn. Kích thước tối đa là 10MB');
      }
      
      return true;
    }
  
    /**
     * Clean up URLs
     */
    cleanupUrl(url: string): void {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
        console.log('🧹 Cleaned up URL');
      }
    }
  }
  
  // Export singleton instance
  export default new FalAITryOnService();