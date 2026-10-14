'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';

const specBadges = [
{ label: 'Battery', value: '30 Hrs', delay: 0 },
{ label: 'Bluetooth', value: 'v5.3', delay: 200 },
{ label: 'Driver', value: '12mm', delay: 400 }];


export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const items = el.querySelectorAll('.hero-item');
    items.forEach((item, i) => {
      setTimeout(() => {
        (item as HTMLElement).style.opacity = '1';
        (item as HTMLElement).style.transform = 'translateY(0) scale(1)';
      }, 100 + i * 130);
    });
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen pt-16 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #EBF5FF 0%, #C8E6F5 25%, #A8D8F0 55%, #E8F4FD 100%)' }}
      aria-label="O2 Eardops hero section">
      
      {/* Atmospheric background shapes */}
      <div
        className="absolute top-0 right-0 w-[60%] h-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 85% 40%, rgba(255,255,255,0.75) 0%, transparent 65%)' }} />
      
      <div
        className="absolute bottom-0 left-0 w-[50%] h-[60%] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 15% 90%, rgba(33,150,243,0.12) 0%, transparent 60%)' }} />
      
      {/* Decorative ring */}
      <div
        className="absolute top-1/2 right-[8%] -translate-y-1/2 w-[520px] h-[520px] rounded-full pointer-events-none hidden lg:block"
        style={{ border: '1.5px solid rgba(33,150,243,0.15)' }} />
      
      <div
        className="absolute top-1/2 right-[8%] -translate-y-1/2 w-[420px] h-[420px] rounded-full pointer-events-none hidden lg:block"
        style={{ border: '1px solid rgba(33,150,243,0.1)' }} />
      

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 min-h-[calc(100vh-4rem)] flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-6 items-center py-12 lg:py-0">

          {/* LEFT: Copy */}
          <div className="flex flex-col gap-6 order-2 lg:order-1">
            {/* Brand badge */}
            <div
              className="hero-item inline-flex items-center gap-2 self-start px-4 py-2 rounded-full border"
              style={{
                opacity: 0,
                transform: 'translateY(20px)',
                transition: 'opacity 0.7s ease, transform 0.7s ease',
                background: 'rgba(255,255,255,0.8)',
                borderColor: 'rgba(33,150,243,0.3)'
              }}>
              
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-primary">True Wireless • Premium Audio</span>
            </div>

            {/* Headline */}
            <div>
              <h1
                className="hero-item font-display font-bold text-hero-xl text-primary leading-[1.04]"
                style={{ opacity: 0, transform: 'translateY(30px)', transition: 'opacity 0.75s ease, transform 0.75s ease' }}>
                
                True Wireless.
                <br />
                <span className="text-accent">True Freedom.</span>
              </h1>
            </div>

            <p
              className="hero-item text-lg text-muted-foreground font-light leading-relaxed max-w-lg"
              style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
              
              O2 Eardops — engineered for crystal-clear sound, all-day comfort, and seamless connectivity. Your world, your soundtrack.
            </p>

            {/* Feature pills */}
            <div
              className="hero-item flex flex-wrap gap-2"
              style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
              
              {[
              { icon: 'SpeakerWaveIcon', label: 'Crystal Clear Sound' },
              { icon: 'BoltIcon', label: '30-Hr Battery' },
              { icon: 'SignalIcon', label: 'BT 5.3' },
              { icon: 'ShieldCheckIcon', label: 'IPX5 Rated' }].
              map((f) =>
              <div
                key={f.label}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                style={{ background: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.9)' }}>
                
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Icon name={f.icon as any} size={12} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold text-primary">{f.label}</span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div
              className="hero-item flex flex-wrap gap-3"
              style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
              
              <Link
                href="/shop"
                className="btn-primary inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm shadow-lg">
                
                Explore O2 Eardops
                <Icon name="ArrowRightIcon" size={16} className="text-white" />
              </Link>
              <Link
                href="/product-detail"
                className="btn-secondary-o2 inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm">
                
                View Details
              </Link>
            </div>

            {/* Social proof */}
            <div
              className="hero-item flex items-center gap-4 pt-1"
              style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
              
              <div className="flex -space-x-2">
                {[
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face',
                'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=40&h=40&fit=crop&crop=face',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'].
                map((src, i) =>
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                    <AppImage src={src} alt="Happy O2 Eardops customer" width={32} height={32} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-primary flex items-center justify-center text-[9px] text-white font-bold">+2k</div>
              </div>
              <div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) =>
                  <Icon key={s} name="StarIcon" size={12} className="star-filled" variant="solid" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Trusted by 2,000+ customers</p>
              </div>
            </div>
          </div>

          {/* RIGHT: Product visual */}
          <div
            className="hero-item relative flex items-center justify-center order-1 lg:order-2"
            style={{ opacity: 0, transform: 'translateY(20px) scale(0.97)', transition: 'opacity 0.8s ease, transform 0.8s ease' }}>
            
            <div className="relative flex flex-col items-center">
              {/* Glow behind product */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 50% 55%, rgba(33,150,243,0.18) 0%, transparent 70%)',
                  transform: 'scale(1.3)'
                }} />
              

              {/* Main product image */}
              <div className="animate-float relative z-10 w-72 h-72 sm:w-96 sm:h-96">
                <AppImage
                  src="/assets/images/O2Earpods_Orange-1790593783106.png"
                  alt="O2 Eardop Pro X1 premium true wireless earbuds, orange variant"
                  width={384}
                  height={384}
                  priority
                  className="w-full h-full object-contain drop-shadow-2xl" />
                
              </div>

              {/* Pedestal */}
              <div
                className="pedestal w-56 h-16 sm:w-72 sm:h-20 -mt-10 relative z-0"
                style={{ borderRadius: '50%' }} />
              

              {/* Floating spec cards */}
              {specBadges.map((badge, i) =>
              <div
                key={badge.label}
                className={`absolute glass-card rounded-2xl px-3 py-2 shadow-lg ${
                i === 0 ? 'top-6 -left-4 sm:-left-14 animate-float-delayed' :
                i === 1 ? 'top-1/3 -right-4 sm:-right-12 animate-float' : 'bottom-24 -left-2 sm:-left-12 animate-float-delayed'}`
                }>
                
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{badge.label}</p>
                  <p className={`text-sm font-bold ${i === 1 ? 'text-accent' : 'text-primary'}`}>{badge.value}</p>
                </div>
              )}

              {/* ANC badge */}
              <div className="absolute top-0 right-2 sm:right-0 glass-card rounded-2xl px-3 py-2 shadow-lg animate-float">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Icon name="SparklesIcon" size={10} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">ANC</p>
                    <p className="text-xs font-bold text-primary">Active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Scroll</span>
          <div className="w-5 h-8 border-2 border-muted-foreground rounded-full flex items-start justify-center pt-1">
            <div className="w-1 h-2 bg-muted-foreground rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>);

}