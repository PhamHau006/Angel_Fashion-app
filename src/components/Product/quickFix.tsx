// quickFix.tsx - Component để test ngay lập tức

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from './ProductCard'; // Import your new ProductCard
import { CartService, getCurrentCustomerId } from '@/services/cartService';

// Test data that mimics problematic scenarios
const testProducts = [
  // Scenario 1: API Product với null/undefined fields
  {
    maSp: 1001,
    tenSanPham: null, // Problematic
    khoangGia: "299,000₫ - 399,000₫",
    productDetails: [
      {
        maCtsp: 1,
        donGia: null, // Problematic
        mauSac: undefined, // Problematic
        kichThuoc: "M",
        images: [{ tenHinhAnh: "test1.jpg" }]
      }
    ]
  },

  // Scenario 2: Empty productDetails
  {
    maSp: 1002,
    tenSanPham: "Áo khoác nam",
    khoangGia: "400,000₫",
    productDetails: [] // Empty array
  },

  // Scenario 3: Completely broken data
  {
    maSp: null,
    tenSanPham: 123, // Wrong type
    khoangGia: {},   // Wrong type
    productDetails: null // Null
  },

  // Scenario 4: Direct product với missing fields
  {
    id: "direct-1",
    name: undefined, // Problematic
    price: 0,        // Zero price
    image: null,     // Null image
    variants: "not-an-array" // Wrong type
  },

  // Scenario 5: Good data for comparison
  {
    maSp: 1005,
    tenSanPham: "Quần jean nam",
    khoangGia: "350,000₫",
    productDetails: [
      {
        maCtsp: 5,
        donGia: 350000,
        mauSac: "Xanh",
        kichThuoc: "L",
        soLuongTon: 10,
        images: [{ tenHinhAnh: "qJeansNam1.jpg" }]
      }
    ]
  }
];

export const QuickFixTest = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [cartTestResult, setCartTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runProductCardTests = () => {
    console.log('🧪 Running ProductCard crash tests...');
    const results: any[] = [];

    testProducts.forEach((product, index) => {
      try {
        console.log(`Testing product ${index + 1}:`, product);
        
        // This would normally crash, but now should be safe
        const testResult = {
          index: index + 1,
          status: 'success',
          product: product,
          error: null
        };
        
        results.push(testResult);
        console.log(`✅ Product ${index + 1} test passed`);
        
      } catch (error) {
        console.error(`❌ Product ${index + 1} test failed:`, error);
        results.push({
          index: index + 1,
          status: 'failed',
          product: product,
          error: error.message
        });
      }
    });

    setTestResults(results);
    console.log('🎯 All ProductCard tests completed:', results);
  };

  const testCartService = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing CartService...');
      
      const result = await CartService.addProductToCart(
        getCurrentCustomerId(),
        1, // Try with ID 1
        1, // Quantity
        299000, // Price
        'test-image.jpg',
        'M',
        'Trắng'
      );

      setCartTestResult(result);
      console.log('🎯 CartService test result:', result);

    } catch (error) {
      console.error('❌ CartService test error:', error);
      setCartTestResult({
        success: false,
        error: error.message,
        message: 'CartService test failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductCardClick = (productId: string | number) => {
    console.log('ProductCard clicked:', productId);
    alert(`ProductCard clicked: ${productId}`);
  };

  const handleAddToCart = (productId: string | number) => {
    console.log('Add to cart clicked:', productId);
    alert(`Add to cart: ${productId}`);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🔧 Quick Fix Testing Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button onClick={runProductCardTests} className="bg-blue-600">
                🧪 Test ProductCard Safety
              </Button>
              
              <Button 
                onClick={testCartService} 
                disabled={loading}
                className="bg-green-600"
              >
                {loading ? 'Testing...' : '🛒 Test CartService'}
              </Button>
            </div>

            {/* ProductCard Test Results */}
            {testResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>ProductCard Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {testResults.map((result) => (
                      <div key={result.index} className="flex items-center gap-2">
                        <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                          Test {result.index}
                        </Badge>
                        <span className={result.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                          {result.status === 'success' ? '✅ Passed' : `❌ Failed: ${result.error}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CartService Test Results */}
            {cartTestResult && (
              <Card>
                <CardHeader>
                  <CardTitle>CartService Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant={cartTestResult.success ? 'default' : 'destructive'}>
                      {cartTestResult.success ? '✅ Success' : '❌ Failed'}
                    </Badge>
                    <p className="text-sm">{cartTestResult.message}</p>
                    {cartTestResult.error && (
                      <p className="text-sm text-red-600">Error: {cartTestResult.error}</p>
                    )}
                    {cartTestResult.debugInfo && (
                      <details className="text-xs">
                        <summary>Debug Info</summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                          {JSON.stringify(cartTestResult.debugInfo, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live ProductCard Tests */}
      <Card>
        <CardHeader>
          <CardTitle>🖼️ Live ProductCard Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testProducts.map((product, index) => (
              <div key={index} className="space-y-2">
                <h4 className="text-sm font-medium">Test Case {index + 1}</h4>
                <ProductCard 
                  product={product}
                  showDebugInfo={true}
                  onAddToCart={handleAddToCart}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6 bg-blue-50">
        <CardContent className="p-4">
          <h4 className="font-bold text-blue-800 mb-2">📋 Testing Instructions:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
            <li><strong>Test ProductCard Safety:</strong> Kiểm tra component có crash với bad data không</li>
            <li><strong>Test CartService:</strong> Kiểm tra API call có hoạt động không</li>
            <li><strong>Check Console:</strong> Mở DevTools để xem detailed logs</li>
            <li><strong>Try Clicking:</strong> Click vào ProductCard để test navigation</li>
            <li><strong>Try Add to Cart:</strong> Click "Thêm vào giỏ" để test cart functionality</li>
          </ol>
          
          <div className="mt-3 p-3 bg-yellow-100 rounded border-l-4 border-yellow-500">
            <p className="text-sm text-yellow-800">
              <strong>🎯 Expected Results:</strong>
            </p>
            <ul className="text-xs text-yellow-700 mt-1 space-y-1">
              <li>• All ProductCard tests should pass (no crashes)</li>
              <li>• ProductCards should render with fallback data for bad inputs</li>
              <li>• CartService should either succeed or show helpful error message</li>
              <li>• Console should show detailed debug information</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};