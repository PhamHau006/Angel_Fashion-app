
import React from 'react';
import { BottomNavigation } from './BottomNavigation';

interface MobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

export const MobileLayout = ({ children, showBottomNav = true }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-yellow-50 mobile-safe-area">
      <div className="max-w-md mx-auto bg-white min-h-screen relative">
        {children}
        {showBottomNav && <BottomNavigation />}
      </div>
    </div>
  );
};
