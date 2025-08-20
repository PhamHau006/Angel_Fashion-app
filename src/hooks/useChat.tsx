// src/hooks/useChat.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chat, Message, StaffInfo } from '../types/chat';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { 
  getDatabase,
  ref,
  onValue,
  set,
  push,
  serverTimestamp,
  off,
  get,
  update,
  Database
} from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDPxXUrCP-Juhj1kTGIflfbrb66_97MrCI",
  authDomain: "web-app-c1fa1.firebaseapp.com",
  databaseURL: "https://web-app-c1fa1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "web-app-c1fa1",
  storageBucket: "web-app-c1fa1.firebasestorage.app",
  messagingSenderId: "606306901710",
  appId: "1:606306901710:web:ebecaec41d0b89be5dfa9f",
  measurementId: "G-Y8K58MXYP0"
};

const app = initializeApp(firebaseConfig);
const rtdb: Database = getDatabase(app);

const getApiUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    return 'http://192.168.1.150:7218';
  } else {
    return 'https://localhost:7217';
  }
};

interface UseChatProps {
  userId: number | null;
  userName: string;
  userAvatar: string;
  accessToken: string | null;
}

export const useChat = ({ userId, userName, userAvatar, accessToken }: UseChatProps) => {
  const [activeChats, setActiveChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [staffList, setStaffList] = useState<StaffInfo[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const messagesListener = useRef<(() => void) | null>(null);
  const chatsListener = useRef<(() => void) | null>(null);

  // Update online status
  const updateOnlineStatus = useCallback((isOnlineStatus: boolean) => {
    if (!userId) return;

    if (!navigator.onLine && isOnlineStatus) {
      isOnlineStatus = false;
    }

    console.log(`🔄 Updating online status for user ${userId}: ${isOnlineStatus}`);

    try {
      const userStatusRef = ref(rtdb, `userStatus/${userId}`);
      set(userStatusRef, {
        isOnline: isOnlineStatus,
        lastSeen: serverTimestamp(),
        name: userName,
        avatar: userAvatar,
        type: 'customer',
        userId: userId // Add explicit userId field
      });
    } catch (error) {
      console.error('❌ Error updating status:', error);
    }
  }, [userId, userName, userAvatar]);

  // Load active chats
  const loadActiveChats = useCallback(() => {
    if (!userId) return;

    try {
      const chatsRef = ref(rtdb, 'conversations');

      if (chatsListener.current) {
        off(chatsRef, 'value', chatsListener.current);
      }

      const listener = onValue(chatsRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setActiveChats([]);
          setIsLoading(false);
          return;
        }

        console.log('🔍 Filtering chats for userId:', userId);
        console.log('📋 All conversations:', Object.keys(data));

        const chats = Object.entries(data)
          .filter(([_, chat]: [string, any]) => {
            console.log(`Chat ${_.substring(0, 8)}: maKH = ${chat.maKH}, looking for userId = ${userId}`);
            return chat.maKH === userId;
          })
          .map(([id, chat]: [string, any]) => ({
            id,
            ...chat,
            ngayCapNhat: chat.ngayCapNhat || Date.now(),
            staffOnline: false
          } as Chat))
          .sort((a, b) => b.ngayCapNhat - a.ngayCapNhat);

        console.log(`✅ Found ${chats.length} chats for user ${userId}`);
        setActiveChats(chats);
        setIsLoading(false);

        // Only auto-select first chat if no current chat is selected
        if (chats.length > 0 && !currentChat) {
          // Use setTimeout to avoid state update during render
          setTimeout(() => {
            selectChat(chats[0].id);
          }, 0);
        } else if (chats.length === 0) {
          // Use setTimeout to avoid state update during render
          setTimeout(() => {
            createNewChat();
          }, 0);
        }
      }, (error) => {
        console.error('Error loading chats:', error);
        setIsLoading(false);
        alert('Failed to load conversations. Please try again.');
      });

      chatsListener.current = listener;
    } catch (error) {
      console.error('Error setting up chats listener:', error);
      setIsLoading(false);
    }
  }, [userId]); // Remove currentChat from dependencies

  // Select specific chat
  const selectChat = useCallback((chatId: string) => {
    if (!userId) return;

    try {
      // Clean up previous message listener
      if (messagesListener.current && currentChat) {
        off(ref(rtdb, `messages/${currentChat.id}`), 'value', messagesListener.current);
      }

      const chatRef = ref(rtdb, `conversations/${chatId}`);
      onValue(chatRef, (snapshot) => {
        const chatData = snapshot.val();
        if (!chatData) {
          alert('Conversation not found or has been deleted.');
          return;
        }

        const newCurrentChat: Chat = {
          id: chatId,
          ...chatData,
          staffOnline: false
        };

        setCurrentChat(newCurrentChat);

        // Listen to staff online status
        if (chatData.maNV) {
          const staffStatusRef = ref(rtdb, `userStatus/${chatData.maNV}`);
          onValue(staffStatusRef, (staffSnapshot) => {
            const staffData = staffSnapshot.val();
            const isOnline = staffData && staffData.isOnline === true;

            setCurrentChat(prev => prev ? { ...prev, staffOnline: isOnline } : null);

            setStaffList([{
              id: chatData.maNV,
              name: staffData ? staffData.name : (chatData.tenNV || 'Staff'),
              isOnline: isOnline,
              lastSeen: staffData ? staffData.lastSeen : Date.now(),
              avatar: staffData ? staffData.avatar : '/default-avatar.png'
            }]);
          });
        } else {
          setStaffList([]);
        }

        // Mark chat as read
        set(ref(rtdb, `conversations/${chatId}/soTinNhanChuaDoc`), 0);

        // Listen to messages
        const messagesRef = ref(rtdb, `messages/${chatId}`);
        const messageListener = onValue(messagesRef, (snapshot) => {
          const messagesData = snapshot.val();
          if (!messagesData) {
            setMessages([]);
            return;
          }

          const messagesList = Object.entries(messagesData).map(([id, message]: [string, any]) => ({
            id,
            ...message,
            thoiGian: typeof message.thoiGian === 'number' ? message.thoiGian : Date.now()
          } as Message));

          setMessages(messagesList);

          // Mark staff messages as read
          Object.entries(messagesData).forEach(([id, message]: [string, any]) => {
            if (message.loaiNguoiGui === 'staff' && !message.daDoc) {
              set(ref(rtdb, `messages/${chatId}/${id}/daDoc`), true);
              set(ref(rtdb, `messages/${chatId}/${id}/thoiGianDoc`), serverTimestamp());
            }
          });
        });

        messagesListener.current = messageListener;
      });
    } catch (error) {
      console.error('Error selecting chat:', error);
      alert('Failed to load conversation. Please try again.');
    }
  }, [userId]); // Remove currentChat from dependencies

  // Create new chat
  const createNewChat = useCallback(async () => {
    if (!userId) return;

    try {
      console.log('🆕 Creating new chat for user:', userId);

      const existingChats = activeChats.filter(chat => chat.maKH === userId);
      if (existingChats.length > 0) {
        console.log('✅ Chat already exists, selecting first chat');
        selectChat(existingChats[0].id);
        return;
      }

      const conversationsRef = ref(rtdb, 'conversations');
      const newChatRef = push(conversationsRef);
      const chatId = newChatRef.key;

      if (!chatId) {
        throw new Error('Failed to generate chat ID');
      }

      console.log('🆕 Creating new chat with ID:', chatId);

      const chatData = {
        maKH: userId,
        tenKH: userName,
        anhDaiDienKH: userAvatar,
        tinNhanCuoi: 'Hello, I need support.',
        thoiGianTinNhanCuoi: serverTimestamp(),
        soTinNhanChuaDoc: 0,
        soTinNhanChuaDocStaff: 1,
        ngayTao: serverTimestamp(),
        ngayCapNhat: serverTimestamp()
      };

      await set(newChatRef, chatData);
      console.log('✅ Chat data saved');

      const messagesRef = ref(rtdb, `messages/${chatId}`);
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, {
        nguoiGui: userId,
        tenNguoiGui: userName,
        loaiNguoiGui: 'customer',
        noiDung: 'Hello, I need support.',
        thoiGian: serverTimestamp(),
        daDoc: false,
        trangThai: 'sent',
        loai: 'text'
      });

      console.log('✅ First message created');
      selectChat(chatId);
    } catch (error) {
      console.error('Error creating new chat:', error);
      alert('Failed to create new conversation. Please try again.');
    }
  }, [userId, userName, userAvatar, activeChats, selectChat]);

  // Send message
  const sendMessage = useCallback(async (messageText: string, imageFiles: File[] = []) => {
    if (!currentChat || !userId || !accessToken) {
      console.log('❌ Cannot send message - missing required data');
      return;
    }

    if (!messageText.trim() && imageFiles.length === 0) {
      console.log('❌ Empty message, not sending');
      return;
    }

    try {
      let imageUrls: string[] = [];

      // Upload images if any
      if (imageFiles.length > 0) {
        const apiUrl = getApiUrl();
        
        for (const file of imageFiles) {
          const formData = new FormData();
          formData.append('file', file);

          const uploadResponse = await fetch(`${apiUrl}/api/Chat/upload-media`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            body: formData
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload file');
          }

          const uploadResult = await uploadResponse.json();

          if (uploadResult.success) {
            imageUrls.push(`${apiUrl}${uploadResult.data.url}`);
          } else {
            throw new Error(uploadResult.message || 'Upload failed');
          }
        }
      }

      const isVideoOnly = imageFiles.length > 0 && imageFiles.every(file => file.type.startsWith('video/'));
      const messageData = {
        nguoiGui: userId,
        tenNguoiGui: userName,
        loaiNguoiGui: 'customer' as const,
        noiDung: messageText.trim(),
        anhUrls: imageUrls.length > 0 ? imageUrls : null,
        thoiGian: serverTimestamp(),
        daDoc: false,
        trangThai: 'sent' as const,
        loai: isVideoOnly && !messageText.trim() ? 'video' as const : (imageUrls.length > 0 ? 'image' as const : 'text' as const)
      };

      console.log('📤 Sending message with userId:', userId, messageData);

      // Send message to Firebase
      const messagesRef = ref(rtdb, `messages/${currentChat.id}`);
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, messageData);

      // Update chat metadata
      const updateData = {
        tinNhanCuoi: imageUrls.length > 0 ? (isVideoOnly ? '🎥 Video' : '📷 Image') : messageText.trim(),
        thoiGianTinNhanCuoi: serverTimestamp(),
        soTinNhanChuaDocStaff: (currentChat.soTinNhanChuaDocStaff || 0) + 1,
        ngayCapNhat: serverTimestamp()
      };

      // Update each field separately to ensure proper timestamp handling
      Object.entries(updateData).forEach(([key, value]) => {
        set(ref(rtdb, `conversations/${currentChat.id}/${key}`), value);
      });

      console.log('✅ Message sent and chat updated:', currentChat.id);
    } catch (error) {
      console.error('Error sending message:', error);
      alert((error as Error).message || 'Failed to send message. Please try again.');
    }
  }, [currentChat, userId, userName, accessToken]);

  // Initialize when user is available
  useEffect(() => {
    if (userId) {
      updateOnlineStatus(navigator.onLine);
    }
  }, [userId, updateOnlineStatus]);

  // Separate useEffect for loading chats to prevent infinite loop
  useEffect(() => {
    if (userId) {
      loadActiveChats();
    }
  }, [userId]); // Only depend on userId

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup listeners
      if (messagesListener.current && currentChat) {
        off(ref(rtdb, `messages/${currentChat.id}`), 'value', messagesListener.current);
      }

      if (chatsListener.current) {
        off(ref(rtdb, 'conversations'), 'value', chatsListener.current);
      }

      // Set offline status
      if (userId) {
        const userStatusRef = ref(rtdb, `userStatus/${userId}`);
        set(userStatusRef, {
          isOnline: false,
          lastSeen: serverTimestamp(),
          name: userName,
          avatar: userAvatar,
          type: 'customer'
        });
      }
    };
  }, [userId, userName, userAvatar, currentChat]);

  return {
    activeChats,
    currentChat,
    messages,
    isLoading,
    staffList,
    isOnline,
    selectChat,
    createNewChat,
    sendMessage,
  };
};