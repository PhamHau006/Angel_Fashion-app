// src/components/Messenger/MessengerPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Image, Mic, Smile, Paperclip, Phone, Video, MoreVertical } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { Message } from '../../types/chat';
// import Swal from 'sweetalert2'; // Uncomment if you install sweetalert2

// Get API URL function
const getApiUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    return 'http://192.168.1.150:7218'; // Replace with your actual IP
  } else {
    return 'https://localhost:7217'; // Or your web API URL
  }
};

export const MessengerPage = () => {
  // Authentication and user data
  const { user, isAuthenticated, isLoading: authLoading, getToken, getUserIdFromToken } = useAuth();
  const accessToken = getToken();

  // Debug user ID
  useEffect(() => {
    if (user) {
      console.log('👤 Current user from API:', user);
      const tokenUserId = getUserIdFromToken();
      console.log('🆔 User ID from token:', tokenUserId);
      
      if (tokenUserId && user.id !== tokenUserId) {
        console.warn('⚠️ USER ID MISMATCH!', {
          apiUserId: user.id,
          tokenUserId: tokenUserId
        });
      }
    }
  }, [user, getUserIdFromToken]);

  // Chat functionality - use token user ID if available
  const finalUserId = getUserIdFromToken() || user?.id || null;
  
  const {
    activeChats,
    currentChat,
    messages,
    isLoading: chatLoading,
    staffList,
    isOnline,
    selectChat,
    createNewChat,
    sendMessage,
  } = useChat({
    userId: finalUserId,
    userName: user?.hoTen || '',
    userAvatar: user?.hinh || '',
    accessToken,
  });

  // Component state
  const [newMessage, setNewMessage] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<{ type: string; url: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChatList, setShowChatList] = useState(true);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Emoji list
  const emojiList = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘'];

  // Debug log for input area visibility
  useEffect(() => {
    console.log('🎯 Chat state:', {
      showChatList,
      hasCurrentChat: !!currentChat,
      isOnline,
      messageLength: newMessage.length,
      imageFilesCount: imageFiles.length
    });
  }, [showChatList, currentChat, isOnline, newMessage, imageFiles]);

  // Helper functions
  const getImageUrl = (relativePath?: string): string => {
    if (!relativePath) return '/default-avatar.png';
    const apiUrl = getApiUrl();
    
    if (relativePath.includes('AnhKhachHang')) {
      const fileName = relativePath.split('/').pop();
      return `${apiUrl}/api/Customer/image/${fileName}`;
    }
    return `${apiUrl}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
  };

  const formatTime = (timestamp?: number): string => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortedMessages = messages
    .slice()
    .sort((a, b) => (a.thoiGian || 0) - (b.thoiGian || 0));

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter(file => {
      // Check file size (20MB limit)
      if (file.size > 20 * 1024 * 1024) {
        alert(`Tệp ${file.name} quá lớn. Vui lòng chọn tệp nhỏ hơn 20MB.`);
        return false;
      }

      // Check file type
      const validTypes = ['image/', 'video/mp4', 'video/webm', 'video/ogg'];
      if (!validTypes.some(type => file.type.startsWith(type))) {
        alert(`Tệp ${file.name} không phải là tệp hình ảnh hoặc video hợp lệ.`);
        return false;
      }

      return true;
    });

    setImageFiles(prev => [...prev, ...validFiles]);

    // Create previews
    const newPreviews = validFiles.map(file => {
      return new Promise<{ type: string; url: string }>((resolve) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => resolve({ type: 'image', url: e.target?.result as string });
          reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
          resolve({ type: 'video', url: URL.createObjectURL(file) });
        }
      });
    });

    Promise.all(newPreviews).then(previews => {
      setImagePreviews(prev => [...prev, ...previews]);
    });
  };

  // Remove image/video preview
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Add emoji to message
  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Handle message send
  const handleSendMessage = async () => {
    if (!newMessage.trim() && imageFiles.length === 0) return;

    try {
      await sendMessage(newMessage, imageFiles);
      setNewMessage('');
      setImageFiles([]);
      setImagePreviews([]);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle voice recording (placeholder)
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Start recording logic here
      setTimeout(() => {
        setIsRecording(false);
        // Handle recorded audio
      }, 3000);
    }
  };

  // Open media in new window
  const openMedia = (url: string) => {
    window.open(url, '_blank');
  };

  // Handle chat selection
  const handleChatSelect = (chatId: string) => {
    selectChat(chatId);
    setShowChatList(false); // Hide chat list on mobile after selection
  };

  // Loading state
  if (authLoading || chatLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MobileLayout>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center h-screen p-4">
          <h2 className="text-xl font-semibold mb-4">Vui lòng đăng nhập</h2>
          <p className="text-gray-600 mb-4">Bạn cần đăng nhập để sử dụng tính năng nhắn tin.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Đi đến đăng nhập
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div 
        className="flex flex-col bg-gray-50" 
        style={{
          height: 'calc(100vh - 80px)', // Subtract navigation height
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: '80px' // Add padding for mobile navigation
        }}
      >
        {/* Mobile: Toggle between chat list and current chat */}
        <div className="md:hidden" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {showChatList ? (
            // Chat List View (Mobile)
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="bg-white border-b p-4 flex items-center justify-between flex-shrink-0">
                <h1 className="text-xl font-semibold">Tin nhắn</h1>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                  </span>
                </div>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto">
                {activeChats.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-gray-500 mb-4">Chưa có cuộc trò chuyện nào</p>
                    <Button onClick={createNewChat}>
                      Bắt đầu trò chuyện
                    </Button>
                  </div>
                ) : (
                  activeChats.map((chat) => (
                    <div
                      key={chat.id}
                      className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                      onClick={() => handleChatSelect(chat.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={getImageUrl(chat.anhDaiDienKH)}
                            alt="Avatar"
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          {chat.staffOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-gray-900 truncate">
                              {chat.tenKH}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {formatTime(chat.thoiGianTinNhanCuoi)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {chat.tinNhanCuoi?.startsWith('📷') && '📷 Hình ảnh'}
                            {chat.tinNhanCuoi?.startsWith('🎥') && '🎥 Video'}
                            {!chat.tinNhanCuoi?.startsWith('📷') && !chat.tinNhanCuoi?.startsWith('🎥') && chat.tinNhanCuoi}
                          </p>
                          {chat.soTinNhanChuaDoc > 0 && (
                            <span className="inline-block bg-primary text-white text-xs rounded-full px-2 py-1 mt-1">
                              {chat.soTinNhanChuaDoc}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            // Current Chat View (Mobile) - FIX: Ensure proper layout
            currentChat && (
              <div className="flex flex-col h-full">
                {/* Chat Header - Fixed height */}
                <div className="bg-white border-b p-4 flex items-center space-x-3 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChatList(true)}
                    className="p-1"
                  >
                    ←
                  </Button>
                  <div className="relative">
                    <img
                      src={staffList.length > 0 ? getImageUrl(staffList[0].avatar) : '/staff-avatar.png'}
                      alt="Staff Avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {staffList.length > 0 && staffList[0].isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold">
                      {staffList.length > 0 ? staffList[0].name : 'Nhân viên hỗ trợ'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {staffList.length > 0 && staffList[0].isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Phone size={20} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video size={20} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical size={20} />
                    </Button>
                  </div>
                </div>

                {/* Messages - Flexible height */}
                <div 
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    paddingBottom: '120px' // Extra space for fixed input
                  }}
                >
                  {sortedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.loaiNguoiGui === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[80%] ${message.loaiNguoiGui === 'customer' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {message.loaiNguoiGui === 'staff' && (
                          <img
                            src={staffList.length > 0 ? getImageUrl(staffList[0].avatar) : '/staff-avatar.png'}
                            alt="Staff Avatar"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <div
                          className={`p-3 rounded-lg shadow-sm ${
                            message.loaiNguoiGui === 'customer'
                              ? 'bg-primary text-white'
                              : 'bg-white text-gray-800'
                          }`}
                        >
                          {/* Images/Videos */}
                          {message.anhUrls && message.anhUrls.length > 0 && (
                            <div className="mb-2 space-y-2">
                              {message.anhUrls.map((url, index) => (
                                <div key={index}>
                                  {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                    <img
                                      src={url}
                                      alt="Shared image"
                                      className="max-w-full h-auto rounded cursor-pointer"
                                      onClick={() => openMedia(url)}
                                    />
                                  ) : url.match(/\.(mp4|webm|ogg)$/i) ? (
                                    <video
                                      src={url}
                                      controls
                                      className="max-w-full h-auto rounded"
                                    />
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Text Content */}
                          {message.noiDung && (
                            <p className="text-sm whitespace-pre-wrap">{message.noiDung}</p>
                          )}

                          {/* Timestamp and Status */}
                          <div className={`text-xs mt-1 flex items-center justify-end space-x-1 ${
                            message.loaiNguoiGui === 'customer' ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            <span>{formatTime(message.thoiGian)}</span>
                            {message.loaiNguoiGui === 'customer' && (
                              <span>
                                {message.trangThai === 'sent' && '✓'}
                                {message.trangThai === 'delivered' && '✓✓'}
                                {message.daDoc && '✓✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />

                  {sortedMessages.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Bắt đầu cuộc trò chuyện của bạn!</p>
                    </div>
                  )}
                </div>

                {/* Image Previews - Fixed position */}
                {imagePreviews.length > 0 && (
                  <div 
                    className="bg-white border-t p-4"
                    style={{
                      position: 'fixed',
                      bottom: '140px', // Above input area
                      left: 0,
                      right: 0,
                      zIndex: 40,
                      backgroundColor: 'white',
                      borderTop: '1px solid #e5e7eb'
                    }}
                  >
                    <p className="text-sm text-gray-600 mb-2">Tệp đã chọn:</p>
                    <div className="flex space-x-2 overflow-x-auto">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative flex-shrink-0">
                          {preview.type === 'image' ? (
                            <img
                              src={preview.url}
                              alt="Preview"
                              className="w-16 h-16 object-cover rounded border-2 border-gray-200"
                            />
                          ) : (
                            <video
                              src={preview.url}
                              className="w-16 h-16 object-cover rounded border-2 border-gray-200"
                            />
                          )}
                          <button
                            onClick={() => {
                              console.log('🗑️ Removing image at index:', index);
                              removeImage(index);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area - Always visible at bottom */}
                <div 
                  className="bg-white border-t p-4"
                  style={{
                    flexShrink: 0,
                    position: 'fixed',
                    bottom: '80px', // Above mobile navigation
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    backgroundColor: 'white',
                    borderTop: '1px solid #e5e7eb',
                    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
                  }}
                >
                

                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-8 gap-2">
                        {emojiList.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => addEmoji(emoji)}
                            className="text-xl p-1 hover:bg-gray-200 rounded"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-1 bg-white p-3 rounded-lg border shadow-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('📎 Paperclip clicked');
                        fileInputRef.current?.click();
                      }}
                      disabled={!isOnline}
                      title="Tải lên hình ảnh/video"
                      className="hover:bg-gray-100 p-2"
                    >
                      <Paperclip size={18} className="text-gray-600" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('😊 Emoji clicked');
                        setShowEmojiPicker(!showEmojiPicker);
                      }}
                      title="Thêm emoji"
                      className="hover:bg-gray-100 p-2"
                    >
                      <Smile size={18} className="text-gray-600" />
                    </Button>
                    
                    <Input
                      value={newMessage}
                      onChange={(e) => {
                        console.log('📝 Message changed:', e.target.value);
                        setNewMessage(e.target.value);
                      }}
                      placeholder="Gửi tin nhắn..."
                      onKeyPress={(e) => {
                        console.log('⌨️ Key pressed:', e.key);
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 border-0 bg-gray-50 focus:bg-white transition-colors text-sm"
                      disabled={!isOnline}
                      style={{ minHeight: '40px' }}
                    />
                    
                    <Button
                      variant={isRecording ? 'destructive' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        console.log('🎤 Mic clicked');
                        toggleRecording();
                      }}
                      disabled={!isOnline}
                      title="Ghi âm tin nhắn"
                      className="hover:bg-gray-100 p-2"
                    >
                      <Mic size={18} className={isRecording ? 'animate-pulse text-red-500' : 'text-gray-600'} />
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => {
                        console.log('📤 Send clicked');
                        handleSendMessage();
                      }}
                      disabled={!isOnline || (!newMessage.trim() && imageFiles.length === 0)}
                      className="bg-primary hover:bg-primary/80 text-white px-4 py-2"
                      title="Gửi tin nhắn"
                    >
                      <Send size={18} />
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      console.log('📁 Files selected:', e.target.files?.length);
                      handleFileUpload(e);
                    }}
                  />
                </div>
              </div>
            )
          )}
        </div>

        {/* Desktop: Side by side layout */}
        <div className="hidden md:flex h-screen">
          {/* Chat List Sidebar */}
          <div className="w-1/3 bg-white border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-xl font-semibold">Tin nhắn</h1>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                </span>
              </div>
            </div>

            <div className="overflow-y-auto h-full">
              {activeChats.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-gray-500 mb-4">Chưa có cuộc trò chuyện nào</p>
                  <Button onClick={createNewChat}>
                    Bắt đầu trò chuyện
                  </Button>
                </div>
              ) : (
                activeChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      currentChat?.id === chat.id ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                    }`}
                    onClick={() => handleChatSelect(chat.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={getImageUrl(chat.anhDaiDienKH)}
                          alt="Avatar"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {chat.staffOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-gray-900 truncate">
                            {chat.tenKH}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatTime(chat.thoiGianTinNhanCuoi)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {chat.tinNhanCuoi?.startsWith('📷') && '📷 Hình ảnh'}
                          {chat.tinNhanCuoi?.startsWith('🎥') && '🎥 Video'}
                          {!chat.tinNhanCuoi?.startsWith('📷') && !chat.tinNhanCuoi?.startsWith('🎥') && chat.tinNhanCuoi}
                        </p>
                        {chat.soTinNhanChuaDoc > 0 && (
                          <span className="inline-block bg-primary text-white text-xs rounded-full px-2 py-1 mt-1">
                            {chat.soTinNhanChuaDoc}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {currentChat ? (
              <>
                {/* Chat Header */}
                <div className="bg-white border-b p-4 flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={staffList.length > 0 ? getImageUrl(staffList[0].avatar) : '/staff-avatar.png'}
                      alt="Staff Avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {staffList.length > 0 && staffList[0].isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold">
                      {staffList.length > 0 ? staffList[0].name : 'Nhân viên hỗ trợ'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {staffList.length > 0 && staffList[0].isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Phone size={20} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video size={20} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical size={20} />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {sortedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.loaiNguoiGui === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[70%] ${message.loaiNguoiGui === 'customer' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {message.loaiNguoiGui === 'staff' && (
                          <img
                            src={staffList.length > 0 ? getImageUrl(staffList[0].avatar) : '/staff-avatar.png'}
                            alt="Staff Avatar"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <div
                          className={`p-3 rounded-lg shadow-sm ${
                            message.loaiNguoiGui === 'customer'
                              ? 'bg-primary text-white'
                              : 'bg-white text-gray-800'
                          }`}
                        >
                          {/* Images/Videos */}
                          {message.anhUrls && message.anhUrls.length > 0 && (
                            <div className="mb-2 space-y-2">
                              {message.anhUrls.map((url, index) => (
                                <div key={index}>
                                  {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                    <img
                                      src={url}
                                      alt="Shared image"
                                      className="max-w-xs h-auto rounded cursor-pointer"
                                      onClick={() => openMedia(url)}
                                    />
                                  ) : url.match(/\.(mp4|webm|ogg)$/i) ? (
                                    <video
                                      src={url}
                                      controls
                                      className="max-w-xs h-auto rounded"
                                    />
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Text Content */}
                          {message.noiDung && (
                            <p className="text-sm whitespace-pre-wrap">{message.noiDung}</p>
                          )}

                          {/* Timestamp and Status */}
                          <div className={`text-xs mt-1 flex items-center justify-end space-x-1 ${
                            message.loaiNguoiGui === 'customer' ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            <span>{formatTime(message.thoiGian)}</span>
                            {message.loaiNguoiGui === 'customer' && (
                              <span>
                                {message.trangThai === 'sent' && '✓'}
                                {message.trangThai === 'delivered' && '✓✓'}
                                {message.daDoc && '✓✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />

                  {sortedMessages.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Bắt đầu cuộc trò chuyện của bạn!</p>
                    </div>
                  )}
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="p-4 bg-white border-t">
                    <div className="flex space-x-2 overflow-x-auto">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative flex-shrink-0">
                          {preview.type === 'image' ? (
                            <img
                              src={preview.url}
                              alt="Preview"
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <video
                              src={preview.url}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area - Always visible at bottom */}
                <div 
                  className="bg-white border-t p-4"
                  style={{
                    flexShrink: 0,
                    backgroundColor: 'white',
                    borderTop: '1px solid #e5e7eb'
                  }}
                >
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-10 gap-2">
                        {emojiList.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => addEmoji(emoji)}
                            className="text-xl p-1 hover:bg-gray-200 rounded"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!isOnline}
                      title="Tải lên hình ảnh/video"
                    >
                      <Paperclip size={20} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      title="Thêm emoji"
                    >
                      <Smile size={20} />
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                      disabled={!isOnline}
                    />
                    <Button
                      variant={isRecording ? 'destructive' : 'ghost'}
                      size="sm"
                      onClick={toggleRecording}
                      disabled={!isOnline}
                      title="Ghi âm tin nhắn"
                    >
                      <Mic size={20} className={isRecording ? 'animate-pulse' : ''} />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={!isOnline || (!newMessage.trim() && imageFiles.length === 0)}
                      className="bg-primary hover:bg-primary-dark text-white"
                      title="Gửi tin nhắn"
                    >
                      <Send size={20} />
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="text-6xl text-gray-300 mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa chọn cuộc trò chuyện</h3>
                  <p className="text-gray-500 mb-4">Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
                  {activeChats.length === 0 && (
                    <Button onClick={createNewChat}>
                      Bắt đầu trò chuyện
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};