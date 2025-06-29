import React, { useEffect, useState } from 'react';
import { ProductCard } from '../Product/ProductCard';
import { getApiUrl } from '../../config/api';

// Updated Product interface to match ProductCard requirements
interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  isNew?: boolean;
  isHot?: boolean;
  isCombo?: boolean;
  stock: number;        // Added missing property
  description: string;  // Added missing property
  variants: Array<{     // Added missing property
    id: number;
    size: string;
    color: string;
    price: number;
    stock: number;
    images: string[];
  }>;
}

// Interface để match với API response từ /api/Shop
interface ApiProductResponse {
  maSp: number;
  tenSanPham: string;
  moTa: string;
  hasVariants: boolean;
  khoangGia: string; // "300000 VNĐ" format như website
  ngayTao: string;
  luotXem: number;
  soLuong: number;
  categoryDetails: Array<{
    maDanhMucCha: number;
    maDanhMucCon: number;
    tenDanhMucCon: string | null;
  }>;
  productDetails: Array<{
    maCtsp: number;
    kichThuoc: string;
    mauSac: string;
    soLuongTon: number;
    donGia: number;
    isActive: boolean | null;
    images: Array<{
      maCtsp: number;
      tenHinhAnh: string;
    }>;
  }>;
}

const API_URL = getApiUrl();

export const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('FeaturedProducts API_URL:', API_URL);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching featured products from:', API_URL);

        // ✅ Sử dụng endpoint /api/Shop giống như website Vue
        const response = await fetch(`${API_URL}/api/Shop?page=1`);
        console.log('📡 Featured products response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiResponse = await response.json();
        console.log('📦 API Response:', apiResponse);
        
        // Kiểm tra response structure giống như website Vue
        if (!apiResponse.success) {
          throw new Error('API returned success: false');
        }

        const rawData: ApiProductResponse[] = apiResponse.data;
        console.log('📊 Raw product data:', rawData);
        console.log('📈 Number of products received:', rawData.length);

        // ✅ ENHANCED MAPPING LOGIC FOR NEW PRODUCTCARD
        const mappedProducts: Product[] = rawData.map((item: ApiProductResponse, index: number) => {
          console.log(`\n=== MAPPING PRODUCT ${index + 1} ===`);
          console.log('Raw item:', item);
          
          // ✅ Lấy hình ảnh giống như Vue website:
          // product.productDetails[0].images[0].tenHinhAnh
          let firstImage = '';
          if (item.productDetails.length > 0 && 
              item.productDetails[0].images && 
              item.productDetails[0].images.length > 0) {
            firstImage = item.productDetails[0].images[0].tenHinhAnh;
            console.log(`✅ Found first image: ${firstImage} from detail ${item.productDetails[0].maCtsp}`);
          } else {
            console.log('❌ No images found for this product');
            firstImage = 'placeholder.svg';
          }

          // ✅ Calculate pricing from all variants
          const prices = item.productDetails.map(detail => detail.donGia);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          
          // Parse khoangGia để tạo originalPrice (nếu có discount)
          let originalPrice: number | undefined;
          if (item.khoangGia) {
            // Ví dụ: "300000 VNĐ" -> 300000
            const priceMatch = item.khoangGia.match(/(\d+)/);
            if (priceMatch) {
              const khoangGiaPrice = parseInt(priceMatch[1]);
              // Nếu khoangGia khác minPrice thì có discount
              if (khoangGiaPrice !== minPrice && khoangGiaPrice > minPrice) {
                originalPrice = khoangGiaPrice;
              }
            }
          }
          
          // If no discount from khoangGia, check if variants have different prices
          if (!originalPrice && maxPrice !== minPrice) {
            originalPrice = maxPrice;
          }
          
          console.log('💰 Price extracted:', minPrice);
          console.log('💸 Original price:', originalPrice);
          console.log('🖼️ Image extracted:', firstImage);

          // ✅ Transform variants for ProductCard
          const variants = item.productDetails.map(detail => ({
            id: detail.maCtsp,
            size: detail.kichThuoc,
            color: detail.mauSac,
            price: detail.donGia,
            stock: detail.soLuongTon,
            images: detail.images.map(img => img.tenHinhAnh)
          }));

          // ✅ Smart product flags
          // Kiểm tra sản phẩm mới (tạo trong 30 ngày)
          const createdDate = new Date(item.ngayTao);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const isNew = createdDate > thirtyDaysAgo;

          // Kiểm tra sản phẩm hot (dựa trên lượt xem/ngày)
          const daysSinceCreation = Math.max(1, Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
          const viewsPerDay = item.luotXem / daysSinceCreation;
          const isHot = viewsPerDay > 5; // Configurable threshold

          // Kiểm tra combo (có variants với giá khác nhau)
          const isCombo = item.hasVariants && new Set(prices).size > 1;

          const mappedProduct: Product = {
            id: item.maSp,
            name: item.tenSanPham,
            price: minPrice, // Show lowest price
            originalPrice: originalPrice,
            image: firstImage, // Chỉ tên file, sẽ được process bởi getImageUrl trong ProductCard
            rating: 4.0 + Math.random() * 1.0, // Mock rating 4.0-5.0
            reviews: Math.floor(item.luotXem * 0.1) || Math.floor(Math.random() * 50) + 10, // Based on views or random
            isNew: isNew,
            isHot: isHot,
            isCombo: isCombo,
            stock: item.soLuong, // ✅ Added missing property
            description: item.moTa, // ✅ Added missing property  
            variants: variants // ✅ Added missing property
          };
          
          console.log('🎯 Final mapped product:', mappedProduct);
          console.log('📊 Variants count:', variants.length);
          console.log('🏷️ Flags:', { isNew, isHot, isCombo });
          
          return mappedProduct;
        });
        
        console.log('\n🎉 ALL MAPPED PRODUCTS:');
        mappedProducts.forEach((product, index) => {
          console.log(`${index + 1}. ${product.name} - ${product.price.toLocaleString()} VND - ${product.image} - ${product.variants.length} variants`);
        });
        
        setProducts(mappedProducts);
      } catch (error) {
        console.error('❌ Error fetching featured products:', error);
        
        // ✅ Enhanced fallback with mock data including new properties
        const mockProducts: Product[] = [
          {
            id: 1001,
            name: "Quần jeans nam",
            price: 300000,
            originalPrice: undefined,
            image: "qJeansNam1.jpg",
            rating: 4.8,
            reviews: 124,
            isNew: true,
            isHot: false,
            isCombo: true,
            stock: 180,
            description: "Sản phẩm chất lượng cao cho nam",
            variants: [
              { id: 1, size: "S", color: "Đen", price: 300000, stock: 50, images: ["qJeansNam1.jpg", "qJeansNam2.jpg"] },
              { id: 2, size: "M", color: "Trắng", price: 300000, stock: 60, images: ["qJeansNam4.jpg"] },
              { id: 3, size: "L", color: "Xanh", price: 300000, stock: 70, images: [] }
            ]
          },
          {
            id: 1002,
            name: "Quần jeans nữ", 
            price: 300000,
            originalPrice: undefined,
            image: "qJeansNu1.jpg",
            rating: 4.7,
            reviews: 98,
            isNew: true,
            isHot: true,
            isCombo: true,
            stock: 195,
            description: "Sản phẩm chất lượng cao cho nữ",
            variants: [
              { id: 4, size: "S", color: "Đen", price: 300000, stock: 55, images: ["qJeansNu1.jpg", "qJeansNu2.jpg"] },
              { id: 5, size: "M", color: "Trắng", price: 300000, stock: 65, images: ["qJeansNu3.jpg"] },
              { id: 6, size: "L", color: "Xanh", price: 300000, stock: 75, images: [] }
            ]
          },
          {
            id: 1003,
            name: "Quần jeans trẻ em",
            price: 250000,
            originalPrice: 300000, // Example discount
            image: "qJeansTreEm1.jpg", 
            rating: 4.6,
            reviews: 87,
            isNew: true,
            isHot: false,
            isCombo: true,
            stock: 180,
            description: "Sản phẩm chất lượng cao cho trẻ em",
            variants: [
              { id: 7, size: "S", color: "Đen", price: 250000, stock: 50, images: ["qJeansTreEm1.jpg"] },
              { id: 8, size: "M", color: "Trắng", price: 250000, stock: 60, images: ["qJeansTreEm3.jpg"] }
            ]
          },
          {
            id: 1004,
            name: "Quần dài nam",
            price: 350000,
            originalPrice: undefined,
            image: "qDaiNam1.jpg",
            rating: 4.9,
            reviews: 156,
            isNew: true,
            isHot: true,
            isCombo: true,
            stock: 180,
            description: "Sản phẩm chất lượng cao cho nam",
            variants: [
              { id: 10, size: "S", color: "Đen", price: 350000, stock: 50, images: ["qDaiNam1.jpg"] },
              { id: 11, size: "M", color: "Trắng", price: 350000, stock: 60, images: ["qDaiNam3.jpg"] },
              { id: 12, size: "L", color: "Xanh", price: 380000, stock: 70, images: ["qDaiNam5.jpg"] } // Different price for combo effect
            ]
          }
        ];
        
        console.log('🔄 Using enhanced fallback mock data:', mockProducts);
        setProducts(mockProducts);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-center items-center min-h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Đang tải sản phẩm nổi bật...</p>
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
        <h3 className="text-lg font-semibold">Sản phẩm nổi bật</h3>
        <div className="text-xs text-gray-400">
          {products.length} sản phẩm
        </div>
      </div>
      
    
      
      <div className="grid grid-cols-2 gap-4">
        {products.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
           
          />
        ))}
      </div>
      
      {products.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Không có sản phẩm nổi bật nào</p>
          <p className="text-xs text-gray-400 mt-2">
            Kiểm tra kết nối API: {API_URL}
          </p>
        </div>
      )}
    </div>
  );
};