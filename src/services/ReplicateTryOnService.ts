// src/services/ReplicateTryOnService.ts
interface TryOnResult {
    success: boolean;
    imageUrl?: string;
    error?: string;
  }
  
  class ReplicateTryOnService {
    private baseUrl: string;
  
    constructor() {
      this.baseUrl = 'https://api.replicate.com/v1';
      console.log('Replicate IDM-VTON Service initialized');
    }
  
    /**
     * REALISTIC Virtual Try-On using Replicate IDM-VTON
     */
    async processRealisticTryOn(personImage: File | string, garmentImage: File | string): Promise<TryOnResult> {
      try {
        console.log('🚀 Starting Replicate IDM-VTON (Realistic Try-On)...');
  
        const personB64 = await this.ensureBase64(personImage);
        const garmentB64 = await this.ensureBase64(garmentImage);
  
        // Use the latest IDM-VTON model on Replicate
        const response = await fetch(`${this.baseUrl}/predictions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: "c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2a15372670e2f21", // IDM-VTON
            input: {
              crop: false,
              seed: Math.floor(Math.random() * 1000000),
              steps: 30,
              category: "upper_body", // or "lower_body", "dresses"
              force_dc: false,
              garm_img: `data:image/jpeg;base64,${garmentB64}`,
              human_img: `data:image/jpeg;base64,${personB64}`,
              garment_des: "clothing item for virtual try-on"
            }
          })
        });
  
        if (!response.ok) {
          throw new Error(`Replicate API error: ${response.status}`);
        }
  
        const prediction = await response.json();
        console.log('Prediction started:', prediction.id);
  
        // Poll for completion with realistic timeout
        const result = await this.pollForCompletion(prediction.id);
  
        if (result.status === 'succeeded' && result.output) {
          // Convert result to blob URL for local use
          const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
          
          const imageResponse = await fetch(imageUrl);
          const blob = await imageResponse.blob();
          const localUrl = URL.createObjectURL(blob);
  
          console.log('✅ Realistic Try-On completed successfully!');
          return {
            success: true,
            imageUrl: localUrl
          };
        }
  
        throw new Error(`Processing failed with status: ${result.status}`);
  
      } catch (error) {
        console.error('❌ Realistic Try-On failed:', error);
        return {
          success: false,
          error: (error as Error).message
        };
      }
    }
  
    /**
     * Poll for prediction completion
     */
    private async pollForCompletion(predictionId: string, maxAttempts: number = 60): Promise<any> {
      let attempts = 0;
  
      while (attempts < maxAttempts) {
        try {
          const response = await fetch(`${this.baseUrl}/predictions/${predictionId}`);
          const result = await response.json();
  
          console.log(`Polling attempt ${attempts + 1}: ${result.status}`);
  
          if (result.status === 'succeeded' || result.status === 'failed' || result.status === 'canceled') {
            return result;
          }
  
          // Wait 2 seconds before next poll
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
  
        } catch (error) {
          console.error('Polling error:', error);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
  
      throw new Error('Processing timed out after 2 minutes');
    }
  
    /**
     * Alternative: Try with different model versions
     */
    async tryAlternativeModels(personB64: string, garmentB64: string): Promise<TryOnResult> {
      const models = [
        {
          name: "IDM-VTON (Alternative)",
          version: "906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f"
        },
        {
          name: "Virtual Try-On",
          version: "7bb2c4796d3ae25c70bbc9f42aee8bf04b3b4a05c0b6e5cda4a9a80e95b3e4d5"
        }
      ];
  
      for (const model of models) {
        try {
          console.log(`Trying ${model.name}...`);
          
          const response = await fetch(`${this.baseUrl}/predictions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              version: model.version,
              input: {
                person_image: `data:image/jpeg;base64,${personB64}`,
                garment_image: `data:image/jpeg;base64,${garmentB64}`,
                guidance_scale: 7.5,
                num_inference_steps: 20,
                seed: Math.floor(Math.random() * 1000000)
              }
            })
          });
  
          if (response.ok) {
            const prediction = await response.json();
            const result = await this.pollForCompletion(prediction.id, 30);
  
            if (result.status === 'succeeded' && result.output) {
              const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
              const imageResponse = await fetch(imageUrl);
              const blob = await imageResponse.blob();
              const localUrl = URL.createObjectURL(blob);
  
              return {
                success: true,
                imageUrl: localUrl
              };
            }
          }
        } catch (error) {
          console.log(`${model.name} failed, trying next...`);
          continue;
        }
      }
  
      throw new Error('All alternative models failed');
    }
  
    /**
     * Free Hugging Face Spaces alternative
     */
    async tryHuggingFaceSpaces(personB64: string, garmentB64: string): Promise<TryOnResult> {
      console.log('🤗 Trying Hugging Face Spaces...');
  
      const spaces = [
        'https://yisol-idm-vton.hf.space/api/predict',
        'https://levihsu-ootdiffusion.hf.space/api/predict',
        'https://kwai-kolors-kolors-virtual-try-on.hf.space/api/predict'
      ];
  
      for (const spaceUrl of spaces) {
        try {
          const response = await fetch(spaceUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: [
                `data:image/jpeg;base64,${personB64}`,    // Person image
                `data:image/jpeg;base64,${garmentB64}`,   // Garment image
                "Virtual try-on",                          // Description
                true,                                      // Auto-crop garment
                true,                                      // Auto-mask
                20,                                        // Steps
                42                                         // Seed
              ]
            }),
          });
  
          if (response.ok) {
            const result = await response.json();
            
            if (result.data && result.data.length > 0) {
              let imageUrl = result.data[0];
              
              // Handle base64 response
              if (typeof imageUrl === 'string' && imageUrl.startsWith('data:image/')) {
                const base64Data = imageUrl.split(',')[1];
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'image/jpeg' });
                const localUrl = URL.createObjectURL(blob);
                
                return {
                  success: true,
                  imageUrl: localUrl
                };
              }
            }
          }
        } catch (error) {
          console.log(`Space ${spaceUrl} failed, trying next...`);
          continue;
        }
      }
  
      throw new Error('All Hugging Face Spaces failed');
    }
  
    /**
     * Main processing with all fallbacks
     */
    async processWithAllFallbacks(personImage: File | string, garmentImage: File | string): Promise<TryOnResult> {
      const personB64 = await this.ensureBase64(personImage);
      const garmentB64 = await this.ensureBase64(garmentImage);
  
      // Try methods in order of quality
      const methods = [
        () => this.processRealisticTryOn(personImage, garmentImage),
        () => this.tryAlternativeModels(personB64, garmentB64),
        () => this.tryHuggingFaceSpaces(personB64, garmentB64)
      ];
  
      for (let i = 0; i < methods.length; i++) {
        try {
          console.log(`Trying method ${i + 1}/${methods.length}...`);
          const result = await methods[i]();
          
          if (result.success) {
            return result;
          }
        } catch (error) {
          console.log(`Method ${i + 1} failed:`, error);
          
          if (i === methods.length - 1) {
            // All methods failed
            return {
              success: false,
              error: 'All AI services are currently unavailable. Please try again later.'
            };
          }
        }
      }
  
      return {
        success: false,
        error: 'Unable to process try-on request'
      };
    }
  
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
  
    async urlToBase64(imageUrl: string): Promise<string> {
      // Implementation same as previous examples
      try {
        const response = await fetch(imageUrl);
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
        throw new Error('Failed to convert image URL to base64');
      }
    }
  
    validateImageFile(file: File): boolean {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 10 * 1024 * 1024;
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please use JPG, PNG, or WebP');
      }
      
      if (file.size > maxSize) {
        throw new Error('File too large. Maximum size is 10MB');
      }
      
      return true;
    }
  
    cleanupUrl(url: string): void {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }
  }
  
  export default new ReplicateTryOnService();