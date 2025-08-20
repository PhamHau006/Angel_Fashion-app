// src/hooks/useAuth.tsx
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { UserInfo } from '../types/chat';

const getApiUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    return 'http://192.168.1.150:7218';
  } else {
    return 'https://localhost:7217';
  }
};

// Function to decode JWT token
const decodeJWT = (token: string) => {
  try {
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload);
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getToken = (): string | null => {
    // For mobile app, prioritize localStorage over cookies
    return (
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken') ||
      Cookies.get('accessToken') ||
      null
    );
  };

  const getUserIdFromToken = (): number | null => {
    const token = getToken();
    if (!token) return null;

    try {
      const decoded = decodeJWT(token);
      console.log('🔍 Decoded JWT:', decoded);
      
      // JWT payload has 'sub' field which contains user ID
      const userId = decoded?.sub;
      
      if (userId) {
        const parsedUserId = parseInt(userId, 10);
        console.log('✅ User ID from token:', parsedUserId);
        return parsedUserId;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting user ID from token:', error);
      return null;
    }
  };

  const fetchUserInfo = async (): Promise<boolean> => {
    const token = getToken();
    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return false;
    }

    // Get user ID from token first
    const tokenUserId = getUserIdFromToken();
    console.log('🆔 Token User ID:', tokenUserId);

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/Chat/GetUserInfo`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const result = await response.json();
      console.log('📋 API Response:', result);

      if (result.success) {
        // Verify that API response ID matches token ID
        if (tokenUserId && result.data.id !== tokenUserId) {
          console.warn('⚠️ ID mismatch:', {
            tokenId: tokenUserId,
            apiId: result.data.id
          });
          
          // Use token ID as it's more reliable
          result.data.id = tokenUserId;
        }

        console.log('✅ Final user data:', result.data);
        setUser(result.data);
        setIsAuthenticated(true);
        return true;
      } else {
        throw new Error(result.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setIsAuthenticated(false);
      setUser(null);
      
      // Clear from all storage locations when authentication fails
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('refreshToken');
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear from all storage locations
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken'); // Also clear refresh token if exists
    sessionStorage.removeItem('refreshToken');
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    getToken,
    getUserIdFromToken,
    fetchUserInfo,
    logout,
  };
};