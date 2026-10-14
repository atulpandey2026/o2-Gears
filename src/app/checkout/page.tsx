import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CheckoutContent from '@/app/checkout/components/CheckoutContent';

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <CheckoutContent />
      <Footer />
    </main>
  );
}