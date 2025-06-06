
import React from 'react';
import { MobileLayout } from '../Layout/MobileLayout';
import { HeroSection } from './HeroSection';
import { FeaturedProducts } from './FeaturedProducts';
import { Categories } from './Categories';
import { SpecialOffers } from './SpecialOffers';

export const HomePage = () => {
  return (
    <MobileLayout>
      <div className="pb-20">
        <HeroSection />
        <Categories />
        <FeaturedProducts />
        <SpecialOffers />
      </div>
    </MobileLayout>
  );
};
