'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'O2 Eardops', href: '/shop' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, cartCount, wishlistCount, signOut, isAdmin } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-border' : 'bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <AppLogo size={36} />
            <span className="font-display font-800 text-lg text-primary hidden sm:block tracking-tight">
              O2 Gears
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks?.map((link) => (
              <Link key={link?.label} href={link?.href} className="nav-link-o2 text-sm">
                {link?.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-foreground" aria-label="Search">
              <Icon name="MagnifyingGlassIcon" size={18} />
            </button>

            {/* Wishlist */}
            <Link
              href="/shop"
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-foreground"
              aria-label="Wishlist"
            >
              <Icon name="HeartIcon" size={18} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Account */}
            {user ? (
              <div className="relative group">
                <button
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-foreground"
                  aria-label="Account"
                >
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                    {(profile?.full_name ?? user?.email ?? 'U')?.[0]?.toUpperCase()}
                  </div>
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-border py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-4 py-2 border-b border-border mb-1">
                    <p className="text-xs font-bold text-primary truncate">{profile?.full_name ?? 'Account'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  {isAdmin && (
                    <Link href="/admin-dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                      <Icon name="Squares2X2Icon" size={14} className="text-accent" />
                      Admin Panel
                    </Link>
                  )}
                  <Link href="/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                    <Icon name="ClipboardDocumentListIcon" size={14} className="text-accent" />
                    My Orders
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Icon name="ArrowLeftOnRectangleIcon" size={14} className="text-red-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-foreground"
                aria-label="Sign In"
              >
                <Icon name="UserIcon" size={18} />
              </Link>
            )}

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all"
            >
              <Icon name="ShoppingCartIcon" size={16} />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-secondary text-primary text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-foreground"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Icon name="Bars3Icon" size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={`mobile-menu-drawer ${mobileOpen ? 'open' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <AppLogo size={32} />
            <span className="font-display font-bold text-base text-primary">O2 Gears</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        {user && (
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted mb-4">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              {(profile?.full_name ?? user?.email ?? 'U')?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">{profile?.full_name ?? 'Account'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-1">
          {navLinks?.map((link) => (
            <Link
              key={link?.label}
              href={link?.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {link?.label}
            </Link>
          ))}
          <Link href="/cart" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
            Cart {cartCount > 0 && `(${cartCount})`}
          </Link>
          {isAdmin && (
            <Link href="/admin-dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Admin Panel
            </Link>
          )}
        </nav>

        <div className="mt-6 pt-6 border-t border-border">
          {user ? (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <Icon name="ArrowLeftOnRectangleIcon" size={16} className="text-red-500" />
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="btn-primary w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold"
            >
              <Icon name="UserIcon" size={16} className="text-white" />
              Sign In / Register
            </Link>
          )}
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-4">Smart Accessories • Better Living</p>
        </div>
      </div>
    </>
  );
}