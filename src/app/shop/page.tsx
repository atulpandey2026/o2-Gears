import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ShopContent from '@/app/shop/components/ShopContent';

export default function ShopPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <ShopContent />
      <Footer />
    </main>
  );
}