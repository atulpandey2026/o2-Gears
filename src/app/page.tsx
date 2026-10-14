import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/app/components/HeroSection';
import ProductShowcaseSection from '@/app/components/ProductShowcaseSection';
import FeaturesSection from '@/app/components/FeaturesSection';
import FeaturedProductsSection from '@/app/components/FeaturedProductsSection';
import TrustSection from '@/app/components/TrustSection';
import AboutSection from '@/app/components/AboutSection';
import NewsletterSection from '@/app/components/NewsletterSection';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      {/* Hero → Product Intro → Close-up Details → Technology → Key Features → Featured Eardops → CTA */}
      <HeroSection />
      <ProductShowcaseSection />
      <FeaturesSection />
      <FeaturedProductsSection />
      <TrustSection />
      <AboutSection />
      <NewsletterSection />
      <Footer />
    </main>
  );
}