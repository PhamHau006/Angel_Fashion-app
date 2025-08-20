// src/utils/chatUtils.ts
export const formatMessageTime = (timestamp?: number): string => {
    if (!timestamp) return '';
  
    const date = new Date(timestamp);
    const now = new Date();
  
    // If same day, show time only
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
  
    // If yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
  
    // If within a week
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (date > weekAgo) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
  
    // For older messages
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  export const formatLastMessageTime = (timestamp?: number): string => {
    if (!timestamp) return '';
  
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
    // Less than a minute
    if (diffInSeconds < 60) {
      return 'now';
    }
  
    // Less than an hour
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }
  
    // Less than a day
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }
  
    // Less than a week
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d`;
    }
  
    // More than a week
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  export const isValidImageUrl = (url: string): boolean => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };
  
  export const isValidVideoUrl = (url: string): boolean => {
    return /\.(mp4|webm|ogg)$/i.test(url);
  };
  
  export const truncateMessage = (message: string, maxLength: number = 50): string => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };
  
  export const getFileTypeFromUrl = (url: string): 'image' | 'video' | 'unknown' => {
    if (isValidImageUrl(url)) return 'image';
    if (isValidVideoUrl(url)) return 'video';
    return 'unknown';
  };
  
  export const validateFileForUpload = (file: File): { isValid: boolean; error?: string } => {
    // Check file size (20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File ${file.name} is too large. Maximum size is 20MB.`
      };
    }
  
    // Check file type
    const validTypes = ['image/', 'video/mp4', 'video/webm', 'video/ogg'];
    const isValidType = validTypes.some(type => file.type.startsWith(type));
    
    if (!isValidType) {
      return {
        isValid: false,
        error: `File ${file.name} is not a valid image or video file.`
      };
    }
  
    return { isValid: true };
  };
  
  export const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        resolve(URL.createObjectURL(file));
      } else {
        reject(new Error('Unsupported file type'));
      }
    });
  };
  
  export const playNotificationSound = (): void => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator2.frequency.setValueAtTime(600, audioContext.currentTime);
      
      oscillator1.type = 'sine';
      oscillator2.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.3);
      
      oscillator2.start(audioContext.currentTime);
      oscillator2.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Cannot play notification sound:', error);
    }
  };
  
  export const showBrowserNotification = (title: string, body: string, icon?: string): void => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        tag: 'chat-message'
      });
    }
  };
  
  export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  };