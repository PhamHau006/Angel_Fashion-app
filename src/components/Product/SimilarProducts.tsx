import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductCard } from './ProductCard';
import { Capacitor } from '@capacitor/core';
import { getApiUrl } from '../../config/api';
// API URL configuration cho mobile và web
const API_URL = getApiUrl();

export const SimilarProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('SimilarProducts API_URL:', API_URL);
  }, []);

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      try {
        setLoading(true);
        console.log('Fetching similar products from:', API_URL);

        const response = await fetch(`${API_URL}/api/Shop?selectedBigCategory=1`);
        console.log('Similar products response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Similar products data:', result);

        const mappedProducts = result.data.slice(0, 2).map((item: any) => ({
          id: item.maSp,
          name: item.tenSanPham,
          price: item.chitietsanphams?.[0]?.donGia || 0,
          originalPrice: item.chitietsanphams?.[0]?.donGia || undefined,
          image: item.chitietsanphams?.[0]?.hinhanhs?.[0]?.tenHinhAnh || '/placeholder.svg',
          rating: 4.7,
          reviews: 98,
        }));
        
        setProducts(mappedProducts);
      } catch (error) {
        console.error('Lỗi khi lấy sản phẩm tương tự:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSimilarProducts();
  }, []);

  if (loading) return <div>Đang tải...</div>;

  // return (
  //   <Card className="m-4">
  //     <CardHeader>
  //       <CardTitle className="text-lg">Sản phẩm tương tự</CardTitle>
     
  //     </CardHeader>
  //     <CardContent>
  //       <div className="grid grid-cols-2 gap-3">
  //         {products.map((product) => (
  //           <ProductCard key={product.id} product={product} />
  //         ))}
  //       </div>
  //     </CardContent>
  //   </Card>
  // );
};