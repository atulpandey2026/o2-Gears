import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';

const footerLinks = [
  { label: 'Shop', href: '/shop' },
  { label: 'About', href: '/shop' },
  { label: 'FAQ', href: '/shop' },
  { label: 'Shipping', href: '/shop' },
  { label: 'Returns', href: '/shop' },
  { label: 'Privacy', href: '/shop' },
  { label: 'Terms', href: '/shop' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      {/* Main footer bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-3 max-w-xs">
            <div className="flex items-center gap-2">
              <AppLogo size={36} />
              <span className="font-display font-bold text-lg text-white">O2 Gears</span>
            </div>
            <p className="text-sm text-white/60 text-center md:text-left leading-relaxed">
              Premium Audio Accessories<br />For Your Everyday Moments
            </p>
            <p className="text-xs text-white/40 uppercase tracking-[0.3em]">Smart Accessories • Better Living</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-white/60 hover:text-white transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Waveform + Social */}
          <div className="flex flex-col items-center md:items-end gap-4">
            {/* Animated waveform */}
            <div className="flex items-center gap-1">
              {[0, 60, 120, 180, 240, 300, 360, 420].map((delay, i) => (
                <span
                  key={i}
                  className="wave-bar"
                  style={{ animationDelay: `${delay}ms`, height: `${12 + (i % 3) * 6}px` }}
                />
              ))}
            </div>
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {(['InstagramIcon', 'TvIcon', 'GlobeAltIcon'] as const).map((iconName, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/60 transition-all"
                  aria-label="Social link"
                >
                  <Icon name={iconName} size={14} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/40">© 2026 O2 Gears. All rights reserved. House of BNG LLP</p>
          <Link href="/shop" className="text-xs text-white/40 hover:text-white/70 transition-colors">
            Privacy · Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}