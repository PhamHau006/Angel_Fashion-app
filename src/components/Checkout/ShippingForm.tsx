
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ShippingInfo {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  note: string;
}

interface ShippingFormProps {
  shippingInfo: ShippingInfo;
  setShippingInfo: (info: ShippingInfo) => void;
}

export const ShippingForm = ({ shippingInfo, setShippingInfo }: ShippingFormProps) => {
  const updateField = (field: keyof ShippingInfo, value: string) => {
    setShippingInfo({ ...shippingInfo, [field]: value });
  };

  const cities = [
    'Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Cần Thơ',
    'Hải Phòng',
    'Nha Trang',
    'Huế',
    'Vũng Tàu'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>📍</span>
          <span>Thông tin giao hàng</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Họ và tên *</Label>
            <Input
              id="fullName"
              value={shippingInfo.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="Nhập họ và tên"
            />
          </div>
          <div>
            <Label htmlFor="phone">Số điện thoại *</Label>
            <Input
              id="phone"
              value={shippingInfo.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="Nhập số điện thoại"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address">Địa chỉ *</Label>
          <Input
            id="address"
            value={shippingInfo.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Số nhà, tên đường"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Tỉnh/Thành phố</Label>
            <Select value={shippingInfo.city} onValueChange={(value) => updateField('city', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quận/Huyện</Label>
            <Select value={shippingInfo.district} onValueChange={(value) => updateField('district', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quan1">Quận 1</SelectItem>
                <SelectItem value="quan2">Quận 2</SelectItem>
                <SelectItem value="quan3">Quận 3</SelectItem>
                <SelectItem value="quan4">Quận 4</SelectItem>
                <SelectItem value="quan5">Quận 5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Phường/Xã</Label>
            <Select value={shippingInfo.ward} onValueChange={(value) => updateField('ward', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phuong1">Phường 1</SelectItem>
                <SelectItem value="phuong2">Phường 2</SelectItem>
                <SelectItem value="phuong3">Phường 3</SelectItem>
                <SelectItem value="phuong4">Phường 4</SelectItem>
                <SelectItem value="phuong5">Phường 5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="note">Ghi chú (tùy chọn)</Label>
          <Textarea
            id="note"
            value={shippingInfo.note}
            onChange={(e) => updateField('note', e.target.value)}
            placeholder="Ghi chú cho đơn hàng..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};
