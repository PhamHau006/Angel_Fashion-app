
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Categories = () => {
  const navigate = useNavigate();
  
  const categories = [
    { id: 1, name: 'Áo', icon: '👗', color: 'bg-pink-100' },
    { id: 2, name: 'Quần', icon: '👖', color: 'bg-blue-100' },
    { id: 3, name: 'Váy', icon: '👗', color: 'bg-yellow-100' },
    { id: 4, name: 'Phụ kiện', icon: '👜', color: 'bg-purple-100' },
    { id: 5, name: 'Giày', icon: '👠', color: 'bg-green-100' },
    { id: 6, name: 'Combo', icon: '🎁', color: 'bg-red-100' },
  ];

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Danh mục</h3>
      <div className="grid grid-cols-3 gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => navigate(`/shop?category=${category.id}`)}
            className={`${category.color} p-4 rounded-lg text-center hover:scale-105 transition-transform`}
          >
            <div className="text-2xl mb-2">{category.icon}</div>
            <div className="text-sm font-medium">{category.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
