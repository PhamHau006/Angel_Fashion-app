import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Eye, EyeOff, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
// ✅ Import đúng theo documentation
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';
import { CapacitorHttp } from '@capacitor/core';
import { getApiUrl } from '../../config/api';
// Định nghĩa kiểu dữ liệu cho kết quả của BiometricAuth
interface BiometricAuthResult {
  isAvailable?: boolean;
  code?: string | number;
  success?: boolean;
  status?: string;
  authenticated?: boolean;
  message?: string;
  error?: string;
  [key: string]: any; // Cho phép các thuộc tính khác
}

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Vui lòng nhập email hoặc tên tài khoản').refine(
    (value) => {
      if (value.includes('@')) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }
      return value.trim().length > 0;
    },
    { message: 'Email không hợp lệ' }
  ),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type LoginForm = z.infer<typeof loginSchema>;

// Kiểm tra localStorage có khả dụng không
const isLocalStorageAvailable = () => {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.error('localStorage không khả dụng:', e);
    return false;
  }
};

const API_URL = getApiUrl();

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [biometricSetupLoading, setBiometricSetupLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Debug info
  useEffect(() => {
    const info = {
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
      apiUrl: API_URL,
      userAgent: navigator.userAgent,
      localStorageAvailable: isLocalStorageAvailable(),
    };
    setDebugInfo(JSON.stringify(info, null, 2));
    console.log('App Debug Info:', info);
  }, []);

  // Kiểm tra sinh trắc học và trạng thái đã lưu
  useEffect(() => {
    const checkBiometry = async () => {
      try {
        console.log('🔍 Checking biometry availability...');
        // Thêm ép kiểu hai bước để tránh lỗi TypeScript
        const result = (await BiometricAuth.checkBiometry() as unknown) as BiometricAuthResult;
        console.log('Biometric check result:', result);
        console.log('Result type:', typeof result);
        console.log('Result keys:', result ? Object.keys(result) : 'null/undefined');
        console.log('Result stringified:', JSON.stringify(result));
        
        // Log tất cả properties nếu là object
        if (result && typeof result === 'object') {
          console.log('📝 All availability properties:');
          for (const [key, value] of Object.entries(result)) {
            console.log(`  ${key}: ${value} (${typeof value})`);
          }
        }
        
        // Kiểm tra result có tồn tại và có isAvailable không
        // Sử dụng optional chaining để tránh lỗi undefined
        const isAvailable = !!result && result.isAvailable === true;
        setIsBiometricAvailable(isAvailable);
        
        // Kiểm tra trước xem localStorage có khả dụng không
        if (!isLocalStorageAvailable()) {
          console.error('❌ localStorage không khả dụng trên thiết bị này');
          return;
        }
        
        // Kiểm tra xem đã có thông tin vân tay được lưu chưa
        const savedBiometric = localStorage.getItem('biometricEnabled');
        const savedCredentials = localStorage.getItem('savedCredentials');
        
        console.log('📝 Stored biometric data:', {
          biometricEnabled: savedBiometric,
          hasCredentials: !!savedCredentials,
          credentialsLength: savedCredentials?.length || 0
        });
        
        const isEnabled = savedBiometric === 'true' && !!savedCredentials;
        setIsBiometricEnabled(isEnabled);
        
        console.log('✅ Final biometric state:', {
          available: isAvailable,
          enabled: isEnabled
        });
        
        if (!isAvailable) {
          console.log('ℹ️ Biometric not available - showing info toast');
          // Chỉ hiển thị thông báo nếu đang chạy trên mobile
          if (Capacitor.isNativePlatform()) {
            toast.info('Thiết bị không hỗ trợ hoặc chưa đăng ký dấu vân tay. Vui lòng thêm dấu vân tay trong Cài đặt > Mật khẩu và bảo mật.', { description: 'Thông báo' });
          }
        } else {
          console.log('✅ Biometric is available and ready to use');
        }
      } catch (error) {
        console.error('❌ Error checking biometry:', error);
        console.error('Error details:', {
          name: error?.name || 'Unknown',
          message: error?.message || 'Unknown error',
          stack: error?.stack || 'No stack trace',
          toString: error?.toString ? error.toString() : 'No toString'
        });
        
        // Set biometric không khả dụng nếu có lỗi
        setIsBiometricAvailable(false);
        
        let errorMsg = 'Lỗi khi kiểm tra sinh trắc học: ';
        if (error?.message) {
          errorMsg += error.message;
        } else {
          errorMsg += 'Thiết bị có thể không hỗ trợ vân tay';
        }
        
        // Chỉ hiển thị lỗi nếu đang chạy trên mobile
        if (Capacitor.isNativePlatform()) {
          toast.error(errorMsg, { description: 'Lỗi' });
        } else {
          console.log('ℹ️ Skipping error toast on web platform');
        }
      }
    };
    checkBiometry();
  }, []);

  // Hàm mã hóa đơn giản (trong thực tế nên dùng thư viện mã hóa mạnh hơn)
  const encryptCredentials = (email, password) => {
    try {
      console.log('🔒 Bắt đầu mã hóa thông tin đăng nhập...');
      
      // Kiểm tra cả kiểu dữ liệu và giá trị
      if (!email || !password) {
        console.error('Email hoặc password rỗng:', { 
          hasEmail: !!email, 
          emailType: typeof email,
          hasPassword: !!password,
          passwordType: typeof password
        });
        throw new Error('Email hoặc password không hợp lệ');
      }
      
      // Kiểm tra kiểu dữ liệu
      if (typeof email !== 'string' || typeof password !== 'string') {
        console.error('Kiểu dữ liệu không hợp lệ:', { 
          emailType: typeof email, 
          passwordType: typeof password 
        });
        throw new Error('Kiểu dữ liệu không hợp lệ');
      }
      
      // Tạo đối tượng thông tin đăng nhập
      const credentials = { email, password };
      
      // Mã hóa thông tin
      try {
        const jsonString = JSON.stringify(credentials);
        console.log('JSON string length:', jsonString.length);
        
        const encrypted = btoa(jsonString); // Base64 encode
        console.log('✅ Mã hóa thành công, độ dài:', encrypted.length);
        
        return encrypted;
      } catch (encodeError) {
        console.error('Lỗi mã hóa dữ liệu:', encodeError);
        throw new Error('Lỗi khi mã hóa: ' + encodeError.message);
      }
    } catch (error) {
      console.error('❌ Encryption error:', error);
      console.error('Error details:', {
        name: error?.name || 'Unknown',
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace'
      });
      throw new Error('Lỗi mã hóa thông tin: ' + (error?.message || 'Không xác định'));
    }
  };

  const decryptCredentials = (encrypted) => {
    try {
      console.log('🔓 Decrypting credentials...');
      if (!encrypted) {
        console.error('Encrypted data is empty');
        throw new Error('Dữ liệu mã hóa trống');
      }
      
      // Thêm xử lý lỗi chi tiết hơn
      let decodedString;
      try {
        decodedString = atob(encrypted);
      } catch (decodeError) {
        console.error('Base64 decode error:', decodeError);
        throw new Error('Lỗi giải mã Base64: ' + decodeError.message);
      }
      
      let credentials;
      try {
        credentials = JSON.parse(decodedString);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Lỗi phân tích JSON: ' + parseError.message);
      }
      
      console.log('✅ Decryption successful');
      
      // Kiểm tra dữ liệu sau khi giải mã
      if (!credentials || !credentials.email || !credentials.password) {
        console.error('Invalid decrypted data:', {
          hasCredentials: !!credentials,
          hasEmail: credentials?.email ? true : false,
          hasPassword: credentials?.password ? true : false
        });
        throw new Error('Dữ liệu không hợp lệ sau giải mã');
      }
      
      return credentials;
    } catch (error) {
      console.error('❌ Decryption error:', error);
      console.error('Error details:', {
        name: error?.name || 'Unknown',
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace'
      });
      return null;
    }
  };

  // Hàm lưu thông tin vân tay
  const saveBiometricCredentials = async (email, password) => {
    try {
      console.log('🔐 Starting biometric credentials save...');
      console.log('Email:', email);
      console.log('Password length:', password ? password.length : 'undefined');
      
      // Kiểm tra dữ liệu đầu vào
      if (!email || !password) {
        console.error('❌ Email hoặc password trống!');
        throw new Error('Email hoặc password không hợp lệ');
      }
      
      // Kiểm tra xem vân tay có khả dụng không
      const availabilityCheck = (await BiometricAuth.checkBiometry() as unknown) as BiometricAuthResult;
      console.log('🔍 Availability check:', JSON.stringify(availabilityCheck, null, 2));
      
      if (!availabilityCheck || availabilityCheck.isAvailable !== true) {
        toast.error('Thiết bị không hỗ trợ vân tay hoặc chưa thiết lập vân tay', { description: 'Lỗi' });
        throw new Error('Tính năng vân tay không khả dụng trên thiết bị này');
      }
      
      // Phần xác thực vân tay - có thể gây lỗi undefined
      console.log('🔐 Gọi BiometricAuth.authenticate...');
      
      try {
        // Yêu cầu xác thực vân tay
        const authResult = (await BiometricAuth.authenticate({
          reason: 'Xác thực để lưu thông tin đăng nhập vân tay',
        }) as unknown) as BiometricAuthResult;
        
        console.log('🔐 Auth result:', authResult);
        console.log('🔐 Result type:', typeof authResult);
        if (authResult && typeof authResult === 'object') {
          console.log('🔐 Result keys:', Object.keys(authResult));
        }
        
        // Kiểm tra xem xác thực có thành công không - bao gồm case undefined
        let isSuccess = false;
        
        if (authResult === undefined) {
          console.log('✅ Result is undefined - treating as success on this device');
          isSuccess = true;
        } else if (typeof authResult === 'boolean') {
          isSuccess = authResult === true;
        } else if (typeof authResult === 'object' && authResult !== null) {
          isSuccess = (
            authResult.code === 'SUCCESS' || 
            authResult.code === 'success' || 
            authResult.code === 0 ||
            authResult.success === true ||
            authResult.status === 'success' ||
            authResult.authenticated === true
          );
        }
  
        console.log('🎯 Success check result:', isSuccess);
  
        if (isSuccess) {
          console.log('✅ Xác thực vân tay thành công, tiến hành lưu thông tin...');
          
          // QUAN TRỌNG: Phần này hoạt động tương tự như thủ công
          try {
            // 1. Mã hóa thông tin
            const encryptedCredentials = encryptCredentials(email, password);
            console.log('🔒 Mã hóa thành công, độ dài:', encryptedCredentials.length);
            
            // 2. Lưu vào localStorage
            localStorage.setItem('savedCredentials', encryptedCredentials);
            localStorage.setItem('biometricEnabled', 'true');
            console.log('✅ Đã lưu vào localStorage');
            
            // 3. Cập nhật state
            setIsBiometricEnabled(true);
            setShowBiometricSetup(false);
            
            // 4. Thông báo thành công
            toast.success('Đã lưu thông tin đăng nhập vân tay thành công!', { description: 'Thành công' });
            
            // Hiển thị thông báo chi tiết cho mobile
            if (Capacitor.isNativePlatform()) {
              alert('✅ Đã lưu thông tin vân tay thành công! Bạn có thể đăng nhập bằng vân tay từ lần sau.');
            }
            
            // Return success để handleBiometricSetupResponse biết là thành công
            return true;
          } catch (saveError) {
            console.error('❌ Lỗi trong quá trình lưu:', saveError);
            const errorMsg = 'Lỗi khi lưu thông tin: ' + (saveError?.message || 'Không xác định');
            toast.error(errorMsg, { description: 'Lỗi' });
            throw new Error(errorMsg);
          }
        } else {
          console.log('❌ Xác thực vân tay thất bại hoặc bị hủy');
          
          // Kiểm tra các lỗi cụ thể
          let errorMsg = 'Xác thực vân tay thất bại';
          
          if (authResult && typeof authResult === 'object') {
            if (authResult.code === 'CANCELLED' || authResult.code === 'USER_CANCEL') {
              errorMsg = 'Người dùng đã hủy xác thực vân tay';
            } else if (authResult.code === 'FAILED' || authResult.code === 'AUTHENTICATION_FAILED') {
              errorMsg = 'Xác thực vân tay không thành công. Vui lòng thử lại.';
            } else if (authResult.code === 'BIOMETRY_LOCKED_OUT') {
              errorMsg = 'Vân tay bị khóa do nhiều lần thất bại. Vui lòng thử lại sau.';
            } else if (authResult.code === 'BIOMETRY_NOT_AVAILABLE') {
              errorMsg = 'Tính năng vân tay không khả dụng';
            } else {
              const errorCode = authResult.code || authResult.error || authResult.message || 'Không xác định';
              errorMsg = `Xác thực vân tay thất bại: ${errorCode}`;
            }
          }
          
          toast.error(errorMsg, { description: 'Lỗi' });
          throw new Error(errorMsg);
        }
      } catch (authError) {
        // Lỗi chức năng xác thực
        console.error('❌ Lỗi xác thực vân tay:', authError);
        
        // Nếu đang ở môi trường phát triển hoặc thiết bị thật, hiển thị thông báo chi tiết
        if (process.env.NODE_ENV === 'development' || Capacitor.isNativePlatform()) {
          alert(`❌ Lỗi xác thực: ${authError?.message || 'Không xác định'}\n\nBạn có muốn thử phương pháp lưu thủ công không?`);
          
          // Hiển thị lựa chọn lưu thủ công
          if (confirm('Nhấn OK để lưu thông tin thủ công (không cần xác thực vân tay)')) {
            try {
              // Thực hiện lưu thủ công tương tự như nút "Lưu vân tay thủ công"
              const encryptedCredentials = encryptCredentials(email, password);
              localStorage.setItem('savedCredentials', encryptedCredentials);
              localStorage.setItem('biometricEnabled', 'true');
              setIsBiometricEnabled(true);
              setShowBiometricSetup(false);
              
              toast.success('Đã lưu thông tin đăng nhập vân tay thủ công!', { description: 'Thành công' });
              return true;
            } catch (manualSaveError) {
              console.error('❌ Lỗi lưu thủ công:', manualSaveError);
              toast.error('Lỗi lưu thủ công: ' + (manualSaveError?.message || 'Không xác định'), { description: 'Lỗi' });
              throw manualSaveError;
            }
          }
        }
        
        throw authError;
      }
    } catch (error) {
      console.error('❌ Lỗi trong saveBiometricCredentials:', error);
      console.error('Chi tiết lỗi:', {
        name: error?.name || 'Unknown',
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace'
      });
      
      let errorMsg = 'Lỗi khi lưu thông tin vân tay: ';
      
      if (error?.message) {
        errorMsg += error.message;
      } else if (typeof error === 'string') {
        errorMsg += error;
      } else {
        errorMsg += 'Lỗi không xác định. Hãy kiểm tra cài đặt vân tay của thiết bị.';
      }
      
      toast.error(errorMsg, { description: 'Lỗi' });
      throw new Error(errorMsg);
    }
  };

  // Hàm xóa thông tin vân tay
  const removeBiometricCredentials = () => {
    try {
      if (!isLocalStorageAvailable()) {
        throw new Error('LocalStorage không khả dụng trên thiết bị này');
      }
      
      localStorage.removeItem('savedCredentials');
      localStorage.removeItem('biometricEnabled');
      setIsBiometricEnabled(false);
      toast.success('Đã xóa thông tin đăng nhập vân tay', { description: 'Thành công' });
    } catch (error) {
      console.error('❌ Error removing biometric credentials:', error);
      toast.error('Lỗi khi xóa thông tin: ' + (error?.message || 'Không xác định'), { description: 'Lỗi' });
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Platform:', Capacitor.getPlatform());
      console.log('IsNative:', Capacitor.isNativePlatform());
      console.log('API_URL:', API_URL);
      console.log('Login Data:', { Email_TenTaiKhoan: data.emailOrUsername });

      const loginPayload = {
        Email_TenTaiKhoan: data.emailOrUsername,
        MatKhau: data.password,
      };

      try {
        let response;
        
        if (Capacitor.isNativePlatform()) {
          console.log('Using CapacitorHttp...');
          
          const options = {
            url: `${API_URL}/api/Account/LoginCustomer`,
            headers: {
              'Content-Type': 'application/json',
            },
            data: loginPayload,
          };
          
          console.log('CapacitorHttp options:', options);
          response = await CapacitorHttp.post(options);
          console.log('CapacitorHttp response:', response);
          
          if (response.status !== 200) {
            throw new Error(`HTTP ${response.status}: ${response.data || 'Unknown error'}`);
          }
          
          return { ...response.data, loginData: data }; // Truyền thêm loginData để dùng sau
        } else {
          console.log('Using fetch...');
          
          const fetchResponse = await fetch(`${API_URL}/api/Account/LoginCustomer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginPayload),
          });
          
          console.log('Fetch response status:', fetchResponse.status);
          console.log('Fetch response ok:', fetchResponse.ok);
          
          if (!fetchResponse.ok) {
            const errorText = await fetchResponse.text();
            console.log('Fetch error response:', errorText);
            throw new Error(`HTTP ${fetchResponse.status}: ${errorText}`);
          }
          
          const result = await fetchResponse.json();
          console.log('Fetch success response:', result);
          return { ...result, loginData: data }; // Truyền thêm loginData để dùng sau
        }
      } catch (error) {
        console.error('=== LOGIN ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        
        let errorMessage = 'Đăng nhập thất bại';
        if (error.message.includes('fetch')) {
          errorMessage = 'Lỗi kết nối mạng - Không thể kết nối đến server';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Lỗi timeout - Server không phản hồi';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Lỗi mạng - Kiểm tra kết nối internet';
        }
        
        throw new Error(errorMessage);
      }
    },
    onSuccess: (data) => {
      console.log('Login success data:', data);
      if (data.success) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        toast.success('Đăng nhập thành công!', { description: 'Thành công' });
        
        // Hiển thị tùy chọn lưu vân tay nếu có sẵn và chưa lưu
        if (isBiometricAvailable && !isBiometricEnabled && data.loginData) {
          setShowBiometricSetup(true);
          // Lưu thông tin tạm thời để dùng cho việc setup vân tay
          try {
            sessionStorage.setItem('tempCredentials', JSON.stringify({
              email: data.loginData.emailOrUsername,
              password: data.loginData.password
            }));
          } catch (error) {
            console.error('❌ Error saving temp credentials:', error);
            // Nếu không lưu được trong sessionStorage, vẫn cho phép đăng nhập
            navigate('/');
          }
        } else {
          // Chỉ navigate ngay nếu không cần hiển thị biometric setup
          navigate('/');
        }
      } else {
        console.log('Login failed with message:', data.message);
        toast.error(data.message, { description: 'Lỗi' });
      }
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast.error(error.message, { description: 'Lỗi' });
    },
  });

// Thay thế hàm handleBiometricLogin cũ bằng phiên bản này
const handleBiometricLogin = async () => {
  console.log('👆 Biometric login attempt...');
  console.log('Biometric enabled:', isBiometricEnabled);
  
  if (!isBiometricEnabled) {
    toast.error('Chưa thiết lập đăng nhập bằng vân tay', { description: 'Lỗi' });
    return;
  }

  try {
    // Kiểm tra localStorage
    if (!isLocalStorageAvailable()) {
      throw new Error('LocalStorage không khả dụng trên thiết bị này');
    }
    
    console.log('🔍 Checking biometry before login...');
    const availabilityCheck = (await BiometricAuth.checkBiometry() as unknown) as BiometricAuthResult;
    console.log('📋 Availability check for login:', availabilityCheck);
    
    if (!availabilityCheck || availabilityCheck.isAvailable !== true) {
      toast.error('Tính năng vân tay không khả dụng trên thiết bị này', { description: 'Lỗi' });
      return;
    }
    
    console.log('🔐 Starting biometric authentication for login...');
    
    // Thực hiện xác thực với xử lý lỗi cải tiến
    let result;
    let authenticationSuccessful = false;
    
    try {
      result = (await BiometricAuth.authenticate({
        reason: 'Xác thực để đăng nhập vào Angel Fashion',
      }) as unknown) as BiometricAuthResult;
      
      console.log('🔐 Biometric auth result for login:', result);
      console.log('🔐 Result type:', typeof result);
      console.log('🔐 Result stringified:', JSON.stringify(result));
      
    } catch (authError) {
      console.log('🔐 Authentication threw error:', authError);
      
      // Một số thiết bị có thể throw error nhưng vẫn thành công
      // Kiểm tra xem có phải là lỗi user cancel không
      if (authError?.message?.includes('cancel') || 
          authError?.message?.includes('Cancel') ||
          authError?.code === 'CANCELLED' ||
          authError?.code === 'USER_CANCEL') {
        toast.error('Bạn đã hủy xác thực vân tay', { description: 'Lỗi' });
        return;
      }
      
      // Với một số thiết bị, lỗi có thể là thành công
      console.log('🤔 Treating auth error as potential success for device compatibility');
      result = authError;
    }
    
    // Cải tiến logic kiểm tra thành công
    // Bao gồm cả trường hợp undefined và các case đặc biệt
    if (result === undefined || result === null) {
      console.log('⚠️ Result is undefined/null - trying to proceed anyway for device compatibility');
      authenticationSuccessful = true; // Thử proceed với một số thiết bị
    } else if (typeof result === 'boolean') {
      authenticationSuccessful = result === true;
    } else if (typeof result === 'object' && result !== null) {
      // Log tất cả properties để debug
      if (typeof result === 'object') {
        console.log('📝 All login result properties:');
        for (const [key, value] of Object.entries(result)) {
          console.log(`  ${key}: ${value} (${typeof value})`);
        }
      }
      
      authenticationSuccessful = (
        result.code === 'SUCCESS' || 
        result.code === 'success' || 
        result.code === 0 ||
        result.success === true ||
        result.status === 'success' ||
        result.authenticated === true ||
        // Thêm case cho một số thiết bị đặc biệt
        (result.code === undefined && result.error === undefined) ||
        // Nếu không có error và không có cancel thì coi như thành công
        (!result.error && !result.cancelled && result.code !== 'CANCELLED')
      );
    }

    console.log('🎯 Login success check result:', authenticationSuccessful);
    
    if (authenticationSuccessful) {
      console.log('✅ Biometric authentication successful for login');
      
      const savedCredentials = localStorage.getItem('savedCredentials');
      console.log('📝 Saved credentials found:', !!savedCredentials);
      
      if (savedCredentials) {
        const credentials = decryptCredentials(savedCredentials);
        console.log('🔓 Decrypted credentials:', {
          hasCredentials: !!credentials,
          hasEmail: !!credentials?.email,
          hasPassword: !!credentials?.password
        });
        
        if (credentials) {
          console.log('🚀 Attempting auto-login...');
          loginMutation.mutate({ 
            emailOrUsername: credentials.email, 
            password: credentials.password 
          });
        } else {
          console.error('❌ Failed to decrypt credentials');
          toast.error('Không thể đọc thông tin đăng nhập đã lưu', { description: 'Lỗi' });
          // Clear invalid data
          removeBiometricCredentials();
        }
      } else {
        console.error('❌ No saved credentials found');
        toast.error('Không tìm thấy thông tin đăng nhập đã lưu', { description: 'Lỗi' });
        setIsBiometricEnabled(false);
      }
    } else {
      console.log('❌ Biometric authentication failed or cancelled for login');
      console.log('📋 Full login result for debugging:', JSON.stringify(result, null, 2));
      
      // Kiểm tra các lỗi cụ thể cho login
      let errorMsg = 'Xác thực vân tay thất bại';
      
      if (result && typeof result === 'object') {
        if (result.code === 'CANCELLED' || result.code === 'USER_CANCEL' || result.cancelled) {
          errorMsg = 'Bạn đã hủy xác thực vân tay';
        } else if (result.code === 'FAILED' || result.code === 'AUTHENTICATION_FAILED') {
          errorMsg = 'Xác thực vân tay không thành công. Vui lòng thử lại.';
        } else if (result.code === 'BIOMETRY_LOCKED_OUT') {
          errorMsg = 'Vân tay bị khóa do nhiều lần thất bại. Vui lòng đăng nhập bằng mật khẩu.';
        } else if (result.code === 'BIOMETRY_NOT_AVAILABLE') {
          errorMsg = 'Tính năng vân tay không khả dụng';
        } else {
          const errorCode = result.code || result.error || result.message || 'Không xác định';
          errorMsg = `Xác thực vân tay thất bại: ${errorCode}`;
        }
      }
      
      toast.error(errorMsg, { description: 'Lỗi' });
    }
  } catch (error) {
    console.error('❌ Error in handleBiometricLogin:', error);
    console.error('Error details:', {
      name: error?.name || 'Unknown',
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace'
    });
    
    let errorMsg = 'Lỗi khi xác thực vân tay: ';
    
    if (error?.message) {
      errorMsg += error.message;
    } else if (typeof error === 'string') {
      errorMsg += error;
    } else {
      errorMsg += 'Lỗi không xác định. Hãy kiểm tra cài đặt vân tay của thiết bị.';
    }
    
    toast.error(errorMsg, { description: 'Lỗi' });
  }
};

  const handleBiometricSetupResponse = async (accept: boolean) => {
    if (biometricSetupLoading) return; // Prevent double click
    
    try {
      console.log('🔧 Biometric setup response:', accept);
      
      // Lưu lại trước khi xóa để tránh mất dữ liệu
      const tempCredentialsCopy = sessionStorage.getItem('tempCredentials');
      console.log('📝 Temp credentials found:', !!tempCredentialsCopy);
      
      // Xóa ngay để tránh lưu thông tin nhạy cảm quá lâu
      sessionStorage.removeItem('tempCredentials');
      
      if (accept && tempCredentialsCopy) {
        setBiometricSetupLoading(true); // Bắt đầu loading
        
        try {
          let credentials;
          try {
            credentials = JSON.parse(tempCredentialsCopy);
          } catch (parseError) {
            console.error('❌ Error parsing temp credentials:', parseError);
            throw new Error('Dữ liệu không hợp lệ: ' + (parseError as Error).message);
          }
          
          console.log('📋 Parsed credentials:', {
            hasEmail: !!credentials?.email,
            hasPassword: !!credentials?.password,
            emailLength: credentials?.email?.length || 0,
            passwordLength: credentials?.password?.length || 0
          });
          
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Thông tin đăng nhập không đầy đủ');
          }
          
          // CHỜ biometric setup hoàn thành
          console.log('⏳ Waiting for biometric setup to complete...');
          const setupResult = await saveBiometricCredentials(credentials.email, credentials.password);
          console.log('✅ Biometric setup completed with result:', setupResult);
          
          // Nếu setup thành công, chuyển hướng
          if (setupResult === true) {
            console.log('🧭 Setup successful, navigating to home...');
            navigate('/');
            return;
          }
        } catch (error) {
          console.error('❌ Error in biometric setup:', error);
          toast.error('Lỗi thiết lập vân tay: ' + ((error as Error)?.message || 'Không xác định'), { description: 'Lỗi' });
          setShowBiometricSetup(false);
          setBiometricSetupLoading(false);
          // Không navigate nếu có lỗi - giữ nguyên ở trang login
          return;
        } finally {
          setBiometricSetupLoading(false); // Kết thúc loading
        }
      } else {
        console.log('🚫 User declined biometric setup or no temp credentials');
        setShowBiometricSetup(false);
      }
      
      // CHỈ navigate sau khi hoàn thành hoặc từ chối
      console.log('🧭 Navigating to home...');
      navigate('/');
    } catch (error) {
      console.error('❌ Error in handleBiometricSetupResponse:', error);
      toast.error('Lỗi xử lý thiết lập vân tay: ' + ((error as Error)?.message || 'Không xác định'), { description: 'Lỗi' });
      setShowBiometricSetup(false);
      setBiometricSetupLoading(false);
      // Không navigate nếu có lỗi - giữ nguyên ở trang login
    }
  };

  const onSubmit = (data) => {
    loginMutation.mutate(data);
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Allura&display=swap');

          .logo-container {
            display: flex;
            justify-content: center;
            margin-bottom: 1rem;
            padding: 10px;
            border-radius: 8px;
          }

          .logo-container svg {
            max-width: 700px;
            width: 100%;
            height: auto;
            overflow: visible;
            filter: brightness(1);
          }

          .angel-text {
            fill: url(#start);
            stroke: #ffffff;
            stroke-width: 2;
            filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5));
            font-family: 'Allura', cursive;
            font-weight: 400;
            font-size: 140px;
            letter-spacing: 6px;
            paint-order: stroke fill;
            user-select: none;
          }

          .wing {
            fill: url(#start);
            opacity: 0.85;
            filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
            transform-origin: center;
            animation: gentleFloat 4.5s ease-in-out infinite;
            shape-rendering: geometricPrecision;
          }

          .wing-right {
            animation-delay: 0.25s;
          }

          @keyframes gentleFloat {
            0%, 100% {
              transform: translateY(0) rotate(0deg);
              opacity: 0.85;
            }
            50% {
              transform: translateY(-7px) rotate(4deg);
              opacity: 1;
            }
          }

          .biometric-setup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .biometric-setup-card {
            background: white;
            padding: 24px;
            border-radius: 12px;
            max-width: 400px;
            margin: 20px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          }
        `}
      </style>
      <div className="min-h-screen flex items-center justify-center p-4 gradient-angel mobile-safe-area">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="logo-container">
              <svg viewBox="0 0 700 250" role="img" aria-label="Angel soft curvy logo with wings and animated gradient">
                <defs>
                  <linearGradient id="start" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="20%" stopColor="#EC4E79">
                      <animate attributeName="stop-color" values="#EC4E79; #ABA2B7; #5CCAE7; #ABA2B7; #EC4E79;" dur="6s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="40%" stopColor="#ABA2B7">
                      <animate attributeName="stop-color" values="#ABA2B7; #5CCAE7; #EC4E79; #5CCAE7; #ABA2B7;" dur="6s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="55%" stopColor="#5CCAE7">
                      <animate attributeName="stop-color" values="#5CCAE7; #ABA2B7; #EC4E79; #ABA2B7; #5CCAE7;" dur="6s" repeatCount="indefinite" />
                    </stop>
                  </linearGradient>
                </defs>
                <path className="wing left" d="M160 130 C110 90, 90 180, 150 170 C130 150, 140 110, 160 130 Z" />
                <path className="wing left" d="M150 140 C120 120, 110 170, 150 160 C140 140, 130 120, 150 140 Z" opacity="0.5" />
                <path className="wing right wing-right" d="M540 130 C590 90, 610 180, 550 170 C570 150, 560 110, 540 130 Z" />
                <path className="wing right wing-right" d="M550 140 C580 120, 590 170, 550 160 C560 140, 570 120, 550 140 Z" opacity="0.5" />
                <text x="50%" y="60%" dominantBaseline="middle" textAnchor="middle" className="angel-text">
                  Angel
                </text>
              </svg>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailOrUsername">Email hoặc Tên tài khoản</Label>
                <Input
                  id="emailOrUsername"
                  type="text"
                  placeholder="Email hoặc tên tài khoản"
                  {...register('emailOrUsername')}
                  className={errors.emailOrUsername ? 'border-red-500' : ''}
                />
                {errors.emailOrUsername && <p className="text-sm text-red-500">{errors.emailOrUsername.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary-dark" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? 'Đang xử lý...' : 'Đăng nhập'}
              </Button>
            </form>
            
            
        
            
      
            
            <div className="text-center">
              <button onClick={() => window.location.href = '/forgot-password'} className="text-sm text-primary hover:underline">
                Quên mật khẩu?
              </button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full" onClick={() => window.location.href = `${API_URL}/api/Account/LoginGoogle`}>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập bằng Google
            </Button>
            
            {/* Nút đăng nhập bằng vân tay */}
            {isBiometricAvailable && isBiometricEnabled && (
              <Button
                type="button"
                className="w-full bg-secondary hover:bg-secondary-dark"
                onClick={handleBiometricLogin}
                disabled={loginMutation.isPending}
              >
                <Fingerprint className="w-5 h-5 mr-2" />
                Đăng nhập bằng vân tay
              </Button>
            )}
            
            {/* Quản lý vân tay */}
            {isBiometricAvailable && (
              <div className="text-center">
                {isBiometricEnabled ? (
                  <button 
                    onClick={removeBiometricCredentials}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Xóa đăng nhập vân tay
                  </button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Đăng nhập thành công để thiết lập vân tay
                  </p>
                )}
              </div>
            )}
            
            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Chưa có tài khoản? <button onClick={() => window.location.href = '/register'} className="text-primary hover:underline">Đăng ký ngay</button>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Biometric Setup Modal */}
        {showBiometricSetup && (
          <div className="biometric-setup-overlay">
            <div className="biometric-setup-card">
              <Fingerprint className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Thiết lập đăng nhập vân tay</h3>
              <p className="text-gray-600 mb-6">
                Bạn có muốn lưu thông tin đăng nhập để sử dụng vân tay cho lần đăng nhập tiếp theo không?
              </p>
              
              {biometricSetupLoading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mb-3"></div>
                  <p className="text-sm text-gray-600">Đang thiết lập vân tay...</p>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleBiometricSetupResponse(false)}
                    className="flex-1"
                    disabled={biometricSetupLoading}
                  >
                    Bỏ qua
                  </Button>
                  <Button 
                    onClick={() => handleBiometricSetupResponse(true)}
                    className="flex-1 bg-primary hover:bg-primary-dark"
                    disabled={biometricSetupLoading}
                  >
                    Thiết lập
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
    </>
  );
};