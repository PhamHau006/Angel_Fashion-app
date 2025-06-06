import React, { useState } from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Sparkles, Image, Mic, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  suggestions?: string[];
}

export const AIChatPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: '👋 Xin chào! Tôi là Angel AI - trợ lý thời trang của bạn. Tôi có thể giúp bạn:',
      sender: 'ai',
      timestamp: new Date(),
      suggestions: [
        'Tư vấn outfit theo dáng người',
        'Gợi ý mix & match',
        'Tìm sản phẩm phù hợp',
        'Xu hướng thời trang mới',
        'AI thử đồ ảo'
      ]
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickSuggestions = [
    'Outfit đi làm',
    'Phong cách Hàn Quốc',
    'Váy dự tiệc',
    'Áo khoác mùa đông',
    'Phụ kiện trendy',
    'Mix đồ cao cấp'
  ];

  const sendMessage = (text?: string) => {
    const messageText = text || newMessage;
    if (!messageText.trim()) return;

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(messageText);
      const aiMessage: ChatMessage = {
        id: messages.length + 2,
        text: aiResponse.text,
        sender: 'ai',
        timestamp: new Date(),
        suggestions: aiResponse.suggestions,
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 2000);
  };

  const generateAIResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('thử đồ') || lowerMessage.includes('ai thử đồ')) {
      return {
        text: '🔥 AI Thử Đồ là tính năng siêu hot! Bạn có thể:\n\n• Tải ảnh toàn thân của mình\n• Chọn sản phẩm muốn thử\n• Xem kết quả thật như thật\n• Chia sẻ với bạn bè\n\nHãy thử ngay để cảm nhận sự khác biệt!',
        suggestions: ['Thử đồ ngay', 'Hướng dẫn chi tiết', 'Xem ví dụ']
      };
    }
    
    if (lowerMessage.includes('outfit') || lowerMessage.includes('phối đồ')) {
      return {
        text: '✨ Tôi sẽ giúp bạn tạo outfit hoàn hảo! Để tư vấn chính xác, bạn có thể cho tôi biết:\n\n• Dáng người của bạn\n• Màu da\n• Sở thích phong cách\n• Dịp sử dụng\n\nTôi sẽ gợi ý những items phù hợp nhất từ Angel Fashion!',
        suggestions: ['Dáng người nhỏ bé', 'Phong cách thanh lịch', 'Đi làm văn phòng', 'Dự tiệc cuối tuần']
      };
    }
    
    if (lowerMessage.includes('màu') || lowerMessage.includes('color')) {
      return {
        text: '🌈 Màu sắc rất quan trọng! Dựa vào tông da của bạn:\n\n• Da sáng: Pastel, màu lạnh\n• Da ngăm: Màu ấm, earth tone\n• Da vàng: Coral, cam, đỏ\n\nBạn thuộc tông da nào để tôi tư vấn chi tiết hơn?',
        suggestions: ['Da sáng', 'Da ngăm', 'Da vàng', 'Không biết tông da']
      };
    }
    
    if (lowerMessage.includes('size') || lowerMessage.includes('kích thước')) {
      return {
        text: '📏 Chọn size đúng rất quan trọng! Angel Fashion có bảng size chi tiết:\n\nS: 45-50kg, vai 36-38cm\nM: 50-55kg, vai 38-40cm\nL: 55-60kg, vai 40-42cm\n\nBạn có thể inbox số đo 3 vòng để tôi tư vấn size chính xác nhất!',
        suggestions: ['Gửi số đo', 'Xem bảng size', 'Tư vấn size áo', 'Tư vấn size quần']
      };
    }

    return {
      text: '🤖 Tôi hiểu bạn đang quan tâm về thời trang! Tôi có thể giúp bạn:\n\n• Tư vấn outfit theo body\n• Gợi ý màu sắc phù hợp\n• Chọn size chuẩn\n• Xu hướng mới nhất\n• Mix & match sản phẩm\n• AI thử đồ ảo\n\nBạn muốn tìm hiểu về điều gì?',
      suggestions: ['Tư vấn outfit', 'Chọn màu sắc', 'Hướng dẫn size', 'AI thử đồ']
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === 'AI thử đồ ảo' || suggestion === 'Thử đồ ngay') {
      navigate('/ai-tryon');
    } else {
      sendMessage(suggestion);
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col h-screen pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="font-bold">Angel AI</h1>
              <p className="text-sm text-white/80">Trợ lý thời trang thông minh</p>
            </div>
            <div className="ml-auto flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white border-white/30"
                onClick={() => navigate('/ai-tryon')}
              >
                <Camera size={16} className="mr-1" />
                AI Thử Đồ
              </Button>
              <Badge className="bg-white/20 text-white border-white/30">
                <Sparkles size={12} className="mr-1" />
                AI
              </Badge>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[85%] space-y-2">
                <div
                  className={`p-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-primary text-white ml-auto'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                </div>
                
                {message.suggestions && (
                  <div className="flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        <div className="px-4 pb-2">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {quickSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="whitespace-nowrap"
                onClick={() => sendMessage(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="bg-white border-t p-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Image size={20} />
            </Button>
            <div className="flex-1">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Hỏi Angel AI về thời trang..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
            </div>
            <Button variant="ghost" size="icon">
              <Mic size={20} />
            </Button>
            <Button size="icon" onClick={() => sendMessage()}>
              <Send size={20} />
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};
