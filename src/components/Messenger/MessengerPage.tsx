
import React, { useState, useRef } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Image, Mic, Smile, Paperclip } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'staff';
  timestamp: Date;
  type: 'text' | 'image' | 'audio';
  content?: string;
}

export const MessengerPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Xin chào! Tôi có thể giúp gì cho bạn?',
      sender: 'staff',
      timestamp: new Date(),
      type: 'text',
    },
    {
      id: 2,
      text: 'Chào bạn, tôi muốn hỏi về size của áo thun Angel Basic',
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
    },
    {
      id: 3,
      text: 'Dạ, bạn có thể cho tôi biết chiều cao và cân nặng để tư vấn size phù hợp nhất ạ',
      sender: 'staff',
      timestamp: new Date(),
      type: 'text',
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: messages.length + 1,
        text: newMessage,
        sender: 'user',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages([...messages, message]);
      setNewMessage('');

      // Auto reply from staff
      setTimeout(() => {
        const autoReply: Message = {
          id: messages.length + 2,
          text: 'Cảm ơn bạn! Tôi sẽ kiểm tra và phản hồi trong giây lát.',
          sender: 'staff',
          timestamp: new Date(),
          type: 'text',
        };
        setMessages(prev => [...prev, autoReply]);
      }, 1000);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const message: Message = {
        id: messages.length + 1,
        text: 'Đã gửi hình ảnh',
        sender: 'user',
        timestamp: new Date(),
        type: 'image',
        content: URL.createObjectURL(file),
      };
      setMessages([...messages, message]);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Start recording
      setTimeout(() => {
        setIsRecording(false);
        const message: Message = {
          id: messages.length + 1,
          text: 'Tin nhắn thoại',
          sender: 'user',
          timestamp: new Date(),
          type: 'audio',
        };
        setMessages([...messages, message]);
      }, 3000);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <MobileLayout>
      <div className="flex flex-col h-screen pb-20">
        {/* Header */}
        <div className="bg-white border-b p-4 flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white font-bold">CS</span>
          </div>
          <div>
            <h1 className="font-semibold">Tư vấn viên Angel</h1>
            <p className="text-sm text-green-500">Đang hoạt động</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.type === 'image' && message.content && (
                  <img
                    src={message.content}
                    alt="Uploaded"
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                {message.type === 'audio' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Mic size={16} />
                    </div>
                    <div className="flex-1 h-1 bg-white/30 rounded">
                      <div className="w-1/3 h-full bg-white rounded"></div>
                    </div>
                    <span className="text-xs">0:03</span>
                  </div>
                )}
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="bg-white border-t p-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={20} />
            </Button>
            <Button variant="ghost" size="icon">
              <Image size={20} />
            </Button>
            <div className="flex-1 flex items-center space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1"
              />
              <Button variant="ghost" size="icon">
                <Smile size={20} />
              </Button>
            </div>
            <Button
              variant={isRecording ? 'destructive' : 'ghost'}
              size="icon"
              onClick={toggleRecording}
            >
              <Mic size={20} className={isRecording ? 'animate-pulse' : ''} />
            </Button>
            <Button size="icon" onClick={sendMessage}>
              <Send size={20} />
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      </div>
    </MobileLayout>
  );
};
