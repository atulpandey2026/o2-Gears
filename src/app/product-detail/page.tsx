import React, { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductDetailContent from './components/ProductDetailContent';

export default function ProductDetailPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={<div className="pt-32 text-center text-muted-foreground">Loading product...</div>}>
        <ProductDetailContent />
      </Suspense>
      <Footer />
    </main>
  );
}