import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorHttp } from '@capacitor/core';

interface ImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

export const ImageLoader: React.FC<ImageLoaderProps> = ({ 
  src, 
  alt, 
  className = '', 
  onLoad, 
  onError 
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 ImageLoader starting for:', src);
        console.log('📱 Platform:', Capacitor.getPlatform());
        console.log('🏠 Is Native:', Capacitor.isNativePlatform());
        
        if (Capacitor.isNativePlatform()) {
          console.log('📱 Loading image via Capacitor HTTP:', src);
          
          try {
            // Sử dụng Capacitor HTTP để fetch ảnh
            const response = await CapacitorHttp.get({
              url: src,
              headers: {
                'Accept': 'image/*'
              }
            });

            console.log('📡 Capacitor HTTP response:', {
              status: response.status,
              headers: response.headers,
              dataType: typeof response.data
            });

            if (response.status === 200) {
              let base64Data = response.data;
              
              // Nếu data là string và không có prefix data:image
              if (typeof base64Data === 'string' && !base64Data.startsWith('data:')) {
                base64Data = `data:image/jpeg;base64,${base64Data}`;
              }
              
              console.log('✅ Base64 image created, length:', base64Data.length);
              console.log('🖼️ Base64 preview:', base64Data.substring(0, 100) + '...');
              
              setImageSrc(base64Data);
              onLoad?.();
            } else {
              throw new Error(`HTTP ${response.status}: Failed to load image`);
            }
          } catch (capacitorError) {
            console.error('❌ Capacitor HTTP error:', capacitorError);
            
            // Fallback: thử fetch thông thường
            console.log('🔄 Trying fallback fetch...');
            const fallbackResponse = await fetch(src);
            
            if (fallbackResponse.ok) {
              const blob = await fallbackResponse.blob();
              const base64 = await blobToBase64(blob);
              console.log('✅ Fallback fetch success');
              setImageSrc(base64);
              onLoad?.();
            } else {
              throw new Error(`Fallback fetch failed: ${fallbackResponse.status}`);
            }
          }
        } else {
          // Web platform - sử dụng src trực tiếp
          console.log('🌐 Loading image on web platform:', src);
          setImageSrc(src);
        }
      } catch (err) {
        console.error('❌ ImageLoader error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        onError?.(err);
      } finally {
        setLoading(false);
      }
    };

    if (src) {
      loadImage();
    }
  }, [src]);

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleImageLoad = () => {
    console.log('✅ Image displayed successfully');
    onLoad?.();
  };

  const handleImageError = (e: any) => {
    console.error('❌ Image display error:', e);
    setError('Failed to display image');
    onError?.(e);
  };

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mx-auto mb-1"></div>
          <div className="text-xs text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-red-50 border border-red-200`}>
        <div className="text-center p-2">
          <div className="text-red-500 text-xs mb-1">❌</div>
          <div className="text-xs text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );
};