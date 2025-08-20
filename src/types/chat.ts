// src/types/chat.ts
export interface UserInfo {
    id: number;
    hoTen: string;
    email: string;
    sdt: string;
    hinh?: string;
  }
  
  export interface StaffInfo {
    id: number;
    name: string;
    isOnline: boolean;
    lastSeen: number;
    avatar?: string;
  }
  
  export interface Message {
    id: string;
    nguoiGui: number;
    tenNguoiGui: string;
    loaiNguoiGui: 'customer' | 'staff';
    noiDung: string;
    anhUrls?: string[] | null;
    thoiGian: number;
    daDoc: boolean;
    trangThai: 'sent' | 'delivered' | 'read';
    loai: 'text' | 'image' | 'video';
  }
  
  export interface Chat {
    id: string;
    maKH: number;
    tenKH: string;
    anhDaiDienKH: string;
    maNV?: number;
    tenNV?: string;
    tinNhanCuoi: string;
    thoiGianTinNhanCuoi: number;
    soTinNhanChuaDoc: number;
    soTinNhanChuaDocStaff: number;
    ngayTao: number;
    ngayCapNhat: number;
    staffOnline?: boolean;
  }
  
  export interface UserStatus {
    isOnline: boolean;
    lastSeen: number;
    name: string;
    avatar: string;
    type: 'customer' | 'staff';
  }