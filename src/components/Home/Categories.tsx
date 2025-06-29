import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { getApiUrl } from '../../config/api';
// API URL configuration cho mobile và web
const API_URL = getApiUrl();

export const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Categories API_URL:', API_URL);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        console.log('Fetching categories from:', API_URL);

        // Thay đổi endpoint để sử dụng API không cần xác thực
        const response = await fetch(`${API_URL}/api/Home/categories`);
        console.log('Categories response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Categories data:', result);

        // Kiểm tra cấu trúc dữ liệu response
        const categoriesData = result.data || result;

        const mappedCategories = categoriesData.map((item: any, index: number) => ({
          id: item.maDanhMucCha,
          name: item.tenDanhMucCha,
          icon: ['👖','👗',  '👕', '👠','👜',  '🎁'][index % 6], // Giả lập icon
          color: ['bg-pink-100', 'bg-blue-100', 'bg-yellow-100', 'bg-purple-100', 'bg-green-100', 'bg-red-100'][index % 6],
        }));
        
        setCategories(mappedCategories);
      } catch (error) {
        console.error('Lỗi khi lấy danh mục:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    console.log('Navigating to category:', categoryId);
    navigate(`/shop?category=${categoryId}`);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-center items-center min-h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Đang tải danh mục...</p>
            <div className="text-xs text-gray-400 mt-1">
              API: {API_URL}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Danh mục</h3>
        {/* Debug info */}
        <div className="text-xs text-gray-400">
          {categories.length} danh mục
        </div>
      </div>

      
      <div className="grid grid-cols-3 gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`${category.color} p-4 rounded-lg text-center hover:scale-105 transition-transform`}
          >
            <div className="text-2xl mb-2">{category.icon}</div>
            <div className="text-sm font-medium">{category.name}</div>
          </button>
        ))}
      </div>
      
      {categories.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Không có danh mục nào</p>
        </div>
      )}
    </div>
  );
};