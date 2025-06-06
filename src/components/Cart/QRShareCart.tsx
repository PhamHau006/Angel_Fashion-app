import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Copy, Share, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRShareCartProps {
  cartItems: any[];
}

export const QRShareCart = ({ cartItems }: QRShareCartProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Generate cart URL with items - Fixed to handle Unicode characters
  const generateCartURL = () => {
    const cartData = {
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      })),
      timestamp: new Date().getTime(),
    };
    
    try {
      const jsonString = JSON.stringify(cartData);
      // Encode for Unicode support before btoa
      const encodedString = encodeURIComponent(jsonString);
      const base64Encoded = btoa(encodedString);
      return `${window.location.origin}/shared-cart?data=${base64Encoded}`;
    } catch (error) {
      console.error('Error generating cart URL:', error);
      return `${window.location.origin}/shared-cart`;
    }
  };

  // Generate QR code data URL (simplified representation)
  const generateQRCode = () => {
    const url = generateCartURL();
    // In a real app, you would use a QR code library like qrcode
    // For now, we'll show a placeholder
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateCartURL());
      toast({
        title: "Đã sao chép!",
        description: "Link giỏ hàng đã được sao chép vào clipboard",
      });
    } catch (err) {
      toast({
        title: "Lỗi sao chép",
        description: "Không thể sao chép link. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const shareCart = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Giỏ hàng Angel Fashion',
          text: 'Xem giỏ hàng của tôi tại Angel Fashion',
          url: generateCartURL(),
        });
      } catch (err) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = generateQRCode();
    link.download = 'angel-fashion-cart-qr.png';
    link.click();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode size={16} className="mr-2" />
          Chia sẻ QR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Chia sẻ giỏ hàng</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* QR Code */}
          <Card>
            <CardContent className="p-6 text-center">
              <img
                src={generateQRCode()}
                alt="QR Code"
                className="w-48 h-48 mx-auto border rounded-lg"
              />
              <p className="text-sm text-gray-600 mt-4">
                Quét mã QR để xem giỏ hàng
              </p>
            </CardContent>
          </Card>

          {/* Cart Summary */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Tóm tắt giỏ hàng</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Số sản phẩm:</span>
                  <span>{cartItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tổng số lượng:</span>
                  <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Tổng tiền:</span>
                  <span className="text-primary">{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button className="w-full" onClick={shareCart}>
              <Share size={16} className="mr-2" />
              Chia sẻ giỏ hàng
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1" onClick={copyToClipboard}>
                <Copy size={16} className="mr-2" />
                Sao chép link
              </Button>
              <Button variant="outline" className="flex-1" onClick={downloadQR}>
                <Download size={16} className="mr-2" />
                Tải QR
              </Button>
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center">
            QR code này sẽ hết hạn sau 24 giờ
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
