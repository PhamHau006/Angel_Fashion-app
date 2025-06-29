import React from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin,
  Camera,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(10, 'Số điện thoại phải có ít nhất 10 số'),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const EditProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: 'Nguyễn Minh Thu',
      email: 'thu.nguyen@email.com',
      phone: '0123456789',
      dateOfBirth: '1995-05-15',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      bio: 'Yêu thích thời trang và phong cách sống tích cực',
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    console.log('Profile data:', data);
    toast({
      title: "Cập nhật thành công!",
      description: "Thông tin cá nhân đã được cập nhật",
    });
    navigate('/profile');
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "Đã chọn ảnh",
        description: "Ảnh đại diện sẽ được cập nhật sau khi lưu",
      });
    }
  };

  return (
    <MobileLayout showBottomNav={false}>
      <div className="pb-6">
        {/* Header */}
        <div className="bg-white sticky top-0 z-40 border-b p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-lg font-semibold">Chỉnh sửa hồ sơ</h1>
            <div className="w-10" />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6">
            {/* Avatar Section */}
            <Card>
              <CardContent className="p-6 text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    NMT
                  </div>
                  <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera size={16} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-600">Nhấn để thay đổi ảnh đại diện</p>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User size={20} className="mr-2" />
                  Thông tin cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ và tên</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập họ và tên" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Mail size={16} className="mr-2" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập email" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Phone size={16} className="mr-2" />
                        Số điện thoại
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập số điện thoại" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Calendar size={16} className="mr-2" />
                        Ngày sinh
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MapPin size={20} className="mr-2" />
                  Địa chỉ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Địa chỉ</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Nhập địa chỉ của bạn"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Bio */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Giới thiệu bản thân</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Giới thiệu về bản thân..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button type="submit" className="w-full">
                Lưu thay đổi
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/profile')}
              >
                Hủy bỏ
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </MobileLayout>
  );
};