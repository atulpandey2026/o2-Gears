'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const eardopFeatures = [
{ icon: 'SpeakerWaveIcon', label: 'Crystal Clear Sound' },
{ icon: 'BoltIcon', label: 'Long Battery Life' },
{ icon: 'SignalIcon', label: 'Seamless Pairing' },
{ icon: 'SparklesIcon', label: 'Lightweight & Comfortable' }];


export default function ProductShowcaseSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = entry.target.querySelectorAll('.scroll-reveal');
            items.forEach((item, i) => {
              setTimeout(() => item.classList.add('revealed'), i * 100);
            });
          }
        });
      },
      { threshold: 0.12 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-white overflow-hidden" id="products">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-16 scroll-reveal">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-accent">O2 Eardops</span>
          <h2 className="font-display font-bold text-section-title text-primary mt-2">
            Small in Size. Big on Sound.
          </h2>
          <div className="section-divider" />
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-base leading-relaxed">
            Precision-engineered true wireless earbuds that deliver an uncompromised listening experience — wherever life takes you.
          </p>
        </div>

        {/* Main showcase grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-16">
          {/* Left: Large product visual */}
          <div className="scroll-reveal stagger-1 relative rounded-3xl overflow-hidden min-h-[480px] flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #EBF5FF 0%, #C8E6F5 50%, #A8D8F0 100%)' }}>
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 60% 40%, rgba(255,255,255,0.7) 0%, transparent 65%)' }} />
            
            <div className="relative z-10 flex flex-col items-center p-8">
              <div className="animate-float w-64 h-64 sm:w-80 sm:h-80">
                <AppImage
                  src="/assets/images/O2Earpods_Blue-1790593772767.png"
                  alt="O2 Eardop Pro X1 true wireless earbuds, blue variant"
                  width={320}
                  height={320}
                  className="w-full h-full object-contain drop-shadow-2xl" />
                
              </div>
              <div className="pedestal w-52 h-14 -mt-8" style={{ borderRadius: '50%' }} />
              {/* Floating detail card */}
              <div className="absolute top-8 right-8 glass-card rounded-2xl px-4 py-3 shadow-lg animate-float-delayed">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Playtime</p>
                <p className="text-xl font-bold text-primary">30 Hrs</p>
              </div>
              <div className="absolute bottom-16 left-6 glass-card rounded-2xl px-4 py-3 shadow-lg animate-float">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">ANC</p>
                <p className="text-sm font-bold text-accent">Hybrid Active</p>
              </div>
            </div>
          </div>

          {/* Right: Features + CTA */}
          <div className="scroll-reveal stagger-2 flex flex-col gap-6 p-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-accent">True Wireless</span>
              <h3 className="font-display font-bold text-4xl text-primary mt-2 leading-tight">
                O2 Eardops
              </h3>
              <p className="text-lg text-muted-foreground font-medium mt-2">
                Engineered for clarity. Tuned for emotion.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {eardopFeatures.map((f) =>
              <div key={f.label} className="flex items-center gap-4 p-3 rounded-2xl bg-muted/50 border border-border">
                  <div className="feature-badge w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <Icon name={f.icon as any} size={18} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-primary">{f.label}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/shop"
                className="btn-primary inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm">
                
                Shop O2 Eardops
                <Icon name="ArrowRightIcon" size={15} className="text-white" />
              </Link>
              <Link
                href="/product-detail"
                className="btn-secondary-o2 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm">
                
                View Details
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom cards: Warranty + Promo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Warranty card */}
          <div className="scroll-reveal stagger-3 rounded-3xl overflow-hidden bg-muted p-8 flex flex-col justify-between min-h-[200px]">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                <Icon name="ShieldCheckIcon" size={24} className="text-accent" />
              </div>
              <h3 className="font-display font-bold text-xl text-primary mb-2">1-Year Warranty</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every O2 Eardop comes with comprehensive warranty coverage and dedicated after-sale support.
              </p>
            </div>
            <Link href="/shop" className="mt-4 text-sm font-semibold text-accent flex items-center gap-1 hover:gap-2 transition-all">
              Learn more <Icon name="ArrowRightIcon" size={14} className="text-accent" />
            </Link>
          </div>

          {/* Promo card */}
          <div className="scroll-reveal stagger-4 rounded-3xl overflow-hidden relative min-h-[200px]">
            <AppImage
              src="/assets/images/O2Earpods_Green-1790593782983.png"
              alt="Premium O2 Eardops, green variant"
              fill
              className="object-contain" />
            
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/50 to-transparent" />
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <span className="badge-sale self-start mb-3">Up to 30% OFF</span>
              <h3 className="font-display font-bold text-2xl text-white mb-2">Season Sale</h3>
              <p className="text-white/70 text-sm mb-4">Limited time offers on O2 Eardops</p>
              <Link href="/shop" className="btn-accent inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm self-start">
                Grab Deal <Icon name="ArrowRightIcon" size={14} className="text-white" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>);

}