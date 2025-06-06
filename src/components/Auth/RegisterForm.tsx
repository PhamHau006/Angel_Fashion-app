
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate form
    if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    if (!formData.agreeTerms) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đồng ý với điều khoản sử dụng",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      // Simulate registration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Đăng ký thành công!",
        description: "Chào mừng bạn đến với Angel Fashion",
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: "Đăng ký thất bại",
        description: "Có lỗi xảy ra. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Quay lại
        </Button>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">Đăng ký</CardTitle>
            <p className="text-pink-100">Tạo tài khoản Angel Fashion</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Nhập họ và tên"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Nhập email"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Nhập số điện thoại"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Nhập mật khẩu"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeTerms}
                  onCheckedChange={(checked) => handleInputChange('agreeTerms', checked)}
                />
                <Label htmlFor="terms" className="text-sm">
                  Tôi đồng ý với <span className="text-primary">điều khoản sử dụng</span> và <span className="text-primary">chính sách bảo mật</span>
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-pink-500 to-blue-500"
                disabled={isLoading}
              >
                {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-primary font-medium hover:underline"
                >
                  Đăng nhập ngay
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
