'use client';
import React, { useEffect, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';

const trustItems = [
  {
    icon: 'ShieldCheckIcon',
    title: 'Genuine Products',
    desc: '100% authentic, warranty-backed',
  },
  {
    icon: 'CreditCardIcon',
    title: 'Secure Payments',
    desc: 'Stripe-encrypted transactions',
  },
  {
    icon: 'TruckIcon',
    title: 'Fast Shipping',
    desc: 'Delivered in 2–5 business days',
  },
  {
    icon: 'ArrowPathIcon',
    title: 'Easy Returns',
    desc: '7-day hassle-free return policy',
  },
  {
    icon: 'ChatBubbleLeftEllipsisIcon',
    title: 'Customer Support',
    desc: '7 days a week, 9AM–9PM',
  },
];

export default function TrustSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll('.scroll-reveal');
            items.forEach((item, i) => {
              setTimeout(() => item.classList.add('revealed'), i * 80);
            });
          }
        });
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 bg-muted/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {trustItems.map((item, i) => (
            <div
              key={item.title}
              className={`scroll-reveal stagger-${i + 1} flex flex-col items-center text-center`}
            >
              <div className="trust-icon-wrap animate-pulse-glow">
                <Icon name={item.icon as any} size={22} className="text-primary" />
              </div>
              <h4 className="font-display font-bold text-sm text-primary mb-1">{item.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}