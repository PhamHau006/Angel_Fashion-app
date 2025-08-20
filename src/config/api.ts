// config/api.ts
import { Capacitor } from '@capacitor/core';

/**
 * Centralized API configuration
 * Updated to use Dev Tunnel public URL
 */

// =============================================================================
// CẤU HÌNH API - SỬ DỤNG DEV TUNNEL PUBLIC URL
// =============================================================================
const API_CONFIG = {
  // Dev Tunnel public URL (no need for IP anymore)
  // DEV_TUNNEL_URL: 'https://97kbdg93-7218.euw.devtunnels.ms',
  DEV_TUNNEL_URL: 'https://9ddns03l-7218.asse.devtunnels.ms',
  // Local IP configuration (backup for local development)
  LOCAL_IP: '192.168.2.62',
  
  // Port configuration (for local development)
  MOBILE_PORT: 7218,   // HTTP port for mobile app
  WEB_PORT: 7217,      // HTTPS port for web development  
  
  // Protocol configuration
  DEV_TUNNEL_PROTOCOL: 'https',  // Dev tunnel uses HTTPS
  MOBILE_PROTOCOL: 'http',       // Local mobile uses HTTP
  WEB_PROTOCOL: 'https',         // Local web uses HTTPS
  
  // Environment modes
  USE_DEV_TUNNEL: true,  // Set to false to use local IP
  
  // Fallback URLs
  FALLBACK_URLS: [ 
       'https://9ddns03l-7218.asse.devtunnels.ms',
    'https://97kbdg93-7218.euw.devtunnels.ms', 
 // Dev tunnel
    'http://localhost:7218',                     // Localhost fallback
    'http://192.168.2.62:7218',                 // Local IP
  ]
};

// =============================================================================
// AUTHENTICATION HELPER FUNCTIONS
// =============================================================================

/**
 * Get authentication token from localStorage
 * Supports multiple token key formats for compatibility
 */
export const getAuthToken = (): string | null => {
  try {
    // Try different token key formats that might be used
    // IMPORTANT: 'accessToken' should be first as it's used in LoginForm
    const tokenKeys = ['accessToken', 'authToken', 'token', 'jwt', 'bearerToken'];
    
    for (const key of tokenKeys) {
      const token = localStorage.getItem(key);
      if (token && token.trim() !== '') {
        console.log(`✅ Found auth token with key: ${key}`);
        return token;
      }
    }
    
    console.warn('⚠️ No auth token found in localStorage');
    console.log('📋 Available localStorage keys:', Object.keys(localStorage));
    return null;
  } catch (error) {
    console.error('❌ Error getting auth token:', error);
    return null;
  }
};

/**
 * Set authentication token in localStorage
 * @param token - JWT token to store
 * @param key - Storage key (default: 'authToken')
 */
export const setAuthToken = (token: string, key: string = 'authToken'): void => {
  try {
    localStorage.setItem(key, token);
    console.log(`✅ Auth token stored with key: ${key}`);
  } catch (error) {
    console.error('❌ Error storing auth token:', error);
  }
};

/**
 * Remove authentication token from localStorage
 */
export const removeAuthToken = (): void => {
  try {
    const tokenKeys = ['authToken', 'token', 'accessToken', 'jwt', 'bearerToken'];
    
    tokenKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed token with key: ${key}`);
      }
    });
  } catch (error) {
    console.error('❌ Error removing auth token:', error);
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return token !== null && token.length > 0;
};

/**
 * Get customer ID from localStorage
 */
export const getCustomerId = (): number | null => {
  try {
    const customerIdKeys = ['customerId', 'userId', 'customer_id', 'user_id'];
    
    for (const key of customerIdKeys) {
      const id = localStorage.getItem(key);
      if (id && id.trim() !== '') {
        const parsedId = parseInt(id, 10);
        if (!isNaN(parsedId)) {
          console.log(`✅ Found customer ID with key: ${key}, value: ${parsedId}`);
          return parsedId;
        }
      }
    }
    
    console.warn('⚠️ No customer ID found in localStorage');
    return null;
  } catch (error) {
    console.error('❌ Error getting customer ID:', error);
    return null;
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get platform information for debugging
 */
export const getPlatformInfo = () => {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  
  return {
    isNative,
    platform,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
  };
};

/**
 * Get the appropriate API URL based on configuration
 * UPDATED: Prioritize Dev Tunnel for public access
 */
export const getApiUrl = (forceMobile = false) => {
  const { isNative, platform } = getPlatformInfo();
  
  console.log('API Config - Platform info:', { isNative, platform, forceMobile });
  
  // If Dev Tunnel is enabled, use it for both mobile and web
  if (API_CONFIG.USE_DEV_TUNNEL) {
    console.log('API Config - Using Dev Tunnel URL:', API_CONFIG.DEV_TUNNEL_URL);
    return API_CONFIG.DEV_TUNNEL_URL;
  }
  
  // FORCE MOBILE API for VNPay payments or when explicitly requested
  if (forceMobile || window.location.pathname.includes('checkout')) {
    const url = `${API_CONFIG.MOBILE_PROTOCOL}://${API_CONFIG.LOCAL_IP}:${API_CONFIG.MOBILE_PORT}`;
    console.log('API Config - Using FORCED mobile URL:', url);
    return url;
  }
  
  if (isNative && platform === 'android') {
    // Mobile app - use Dev Tunnel if enabled, otherwise local HTTP
    if (API_CONFIG.USE_DEV_TUNNEL) {
      console.log('API Config - Mobile using Dev Tunnel:', API_CONFIG.DEV_TUNNEL_URL);
      return API_CONFIG.DEV_TUNNEL_URL;
    }
    
    const url = `${API_CONFIG.MOBILE_PROTOCOL}://${API_CONFIG.LOCAL_IP}:${API_CONFIG.MOBILE_PORT}`;
    console.log('API Config - Using local mobile URL:', url);
    return url;
  }
  
  // Web development - use Dev Tunnel if enabled, otherwise local HTTPS
  if (API_CONFIG.USE_DEV_TUNNEL) {
    console.log('API Config - Web using Dev Tunnel:', API_CONFIG.DEV_TUNNEL_URL);
    return API_CONFIG.DEV_TUNNEL_URL;
  }
  
  const url = `${API_CONFIG.WEB_PROTOCOL}://localhost:${API_CONFIG.WEB_PORT}`;
  console.log('API Config - Using local web URL:', url);
  return url;
};

/**
 * Get base API URL (same as getApiUrl but with different name for clarity)
 */
export const getBaseApiUrl = getApiUrl;

/**
 * Get full API endpoint URL
 * @param endpoint - API endpoint (e.g., '/api/Account/Login')
 */
export const getApiEndpoint = (endpoint: string): string => {
  const baseUrl = getApiUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Get full API endpoint URL for Mobile VNPay specifically
 * UPDATED: Use Dev Tunnel if enabled
 * @param endpoint - API endpoint for mobile VNPay operations
 */
export const getMobileApiEndpoint = (endpoint: string): string => {
  let mobileUrl;
  
  if (API_CONFIG.USE_DEV_TUNNEL) {
    mobileUrl = API_CONFIG.DEV_TUNNEL_URL;
    console.log('🔧 Mobile VNPay using Dev Tunnel:', mobileUrl);
  } else {
    mobileUrl = `${API_CONFIG.MOBILE_PROTOCOL}://${API_CONFIG.LOCAL_IP}:${API_CONFIG.MOBILE_PORT}`;
    console.log('🔧 Mobile VNPay using local IP:', mobileUrl);
  }
  
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${mobileUrl}${cleanEndpoint}`;
  console.log('🔧 Mobile API Endpoint:', fullUrl);
  return fullUrl;
};

/**
 * Get image URL for products
 * UPDATED: Support Dev Tunnel
 * @param imageName - Name of the image file
 */
export const getImageUrl = (imageName: string): string => {
  if (!imageName || imageName === '/placeholder.svg') {
    return '/placeholder.svg';
  }
  
  // Check if imageName is already a full URL
  if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
    return imageName;
  }
  
  const baseUrl = getApiUrl();
  
  // Handle relative paths
  if (!imageName.startsWith('/')) {
    return `${baseUrl}/HinhAnh/Products/${imageName}`;
  }
  
  // Handle paths starting with /
  return `${baseUrl}${imageName}`;
};

/**
 * Test connection to API
 * Useful for debugging network issues
 */
export const testApiConnection = async (): Promise<boolean> => {
  try {
    const url = getApiUrl();
    console.log('Testing connection to:', url);
    
    const response = await fetch(`${url}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000) // 10 second timeout for Dev Tunnel
    });
    
    return response.ok;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};

/**
 * Test mobile API connection specifically
 */
export const testMobileApiConnection = async (): Promise<boolean> => {
  try {
    const url = getMobileApiEndpoint('/api/health');
    console.log('Testing mobile API connection to:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(10000) // 10 second timeout for Dev Tunnel
    });
    
    return response.ok;
  } catch (error) {
    console.error('Mobile API connection test failed:', error);
    return false;
  }
};

/**
 * Switch between Dev Tunnel and Local development
 * @param useDevTunnel - true to use Dev Tunnel, false for local IP
 */
export const switchApiMode = (useDevTunnel: boolean) => {
  API_CONFIG.USE_DEV_TUNNEL = useDevTunnel;
  console.log(`API Mode switched to: ${useDevTunnel ? 'Dev Tunnel' : 'Local Development'}`);
  
  // Log current URLs for debugging
  console.log('Current API URL:', getApiUrl());
  console.log('Current Mobile API URL:', getMobileApiEndpoint(''));
};

/**
 * Get debug information for troubleshooting
 * UPDATED: Include Dev Tunnel info
 */
export const getDebugInfo = () => {
  const platformInfo = getPlatformInfo();
  const apiUrl = getApiUrl();
  const mobileApiUrl = getMobileApiEndpoint('');
  
  return {
    ...platformInfo,
    apiUrl,
    mobileApiUrl,
    config: API_CONFIG,
    mode: API_CONFIG.USE_DEV_TUNNEL ? 'Dev Tunnel' : 'Local Development',
    timestamp: new Date().toISOString(),
    // Test some common endpoints
    endpoints: {
      login: getApiEndpoint('/api/Account/LoginCustomer'),
      products: getApiEndpoint('/api/Home/GetNewProduct'),
      categories: getApiEndpoint('/api/Home/categories'),
      health: getApiEndpoint('/api/health'),
      test: getApiEndpoint('/api/test'),
      swagger: `${apiUrl}/swagger/index.html`,
      mobileVnpayCreate: getMobileApiEndpoint('/api/MobileVNPAY/CreatePaymentUrl'),
    },
    // Authentication info
    auth: {
      hasToken: isAuthenticated(),
      customerId: getCustomerId(),
      tokenKeys: ['authToken', 'token', 'accessToken', 'jwt', 'bearerToken'].map(key => ({
        key,
        exists: !!localStorage.getItem(key)
      }))
    }
  };
};

/**
 * Smart API URL resolver - chooses best endpoint based on context
 * UPDATED: Support Dev Tunnel
 */
export const getSmartApiUrl = (endpoint: string, context?: 'mobile' | 'web' | 'vnpay'): string => {
  // For VNPay operations, use mobile API endpoint
  if (context === 'vnpay' || endpoint.includes('VNPay') || endpoint.includes('vnpay')) {
    return getMobileApiEndpoint(endpoint);
  }
  
  // For mobile context, use mobile API
  if (context === 'mobile') {
    return getMobileApiEndpoint(endpoint);
  }
  
  // Default behavior
  return getApiEndpoint(endpoint);
};

/**
 * Create authenticated fetch request with automatic token injection
 */
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log('🔐 Authenticated fetch to:', url);
  console.log('🔐 Has token:', !!token);
  
  return fetch(url, {
    ...options,
    headers,
  });
};

// =============================================================================
// EXPORT DEFAULT
// =============================================================================
export default {
  getApiUrl,
  getBaseApiUrl,
  getApiEndpoint,
  getMobileApiEndpoint,
  getImageUrl,
  getPlatformInfo,
  testApiConnection,
  testMobileApiConnection,
  switchApiMode,
  getDebugInfo,
  getSmartApiUrl,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  isAuthenticated,
  getCustomerId,
  authenticatedFetch,
  config: API_CONFIG
};

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================
export interface ApiConfig {
  DEV_TUNNEL_URL: string;
  LOCAL_IP: string;
  MOBILE_PORT: number;
  WEB_PORT: number;
  DEV_TUNNEL_PROTOCOL: string;
  MOBILE_PROTOCOL: string;
  WEB_PROTOCOL: string;
  USE_DEV_TUNNEL: boolean;
  FALLBACK_URLS: string[];
}

export interface PlatformInfo {
  isNative: boolean;
  platform: string;
  userAgent: string;
}

export interface DebugInfo extends PlatformInfo {
  apiUrl: string;
  mobileApiUrl: string;
  config: ApiConfig;
  mode: string;
  timestamp: string;
  endpoints: {
    login: string;
    products: string;
    categories: string;
    health: string;
    test: string;
    swagger: string;
    mobileVnpayCreate: string;
  };
  auth: {
    hasToken: boolean;
    customerId: number | null;
    tokenKeys: Array<{
      key: string;
      exists: boolean;
    }>;
  };
}