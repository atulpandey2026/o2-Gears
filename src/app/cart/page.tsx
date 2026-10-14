import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartContent from '@/app/cart/components/CartContent';

export default function CartPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <CartContent />
      <Footer />
    </main>
  );
}