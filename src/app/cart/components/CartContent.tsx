'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface CartItem {
  id: string;
  name: string;
  variant: string;
  price: number;
  salePrice: number;
  quantity: number;
  image: string;
  alt: string;
  inStock: boolean;
  productId: string;
}

export default function CartContent() {
  const { user, refreshCounts } = useAuth();
  const supabase = createClient();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  const loadCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', user.id);

      if (!error && data) {
        const mapped: CartItem[] = data.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          name: item.products?.name ?? 'Product',
          variant: item.variant_label ?? '',
          price: item.products?.price ?? 0,
          salePrice: item.products?.sale_price ?? item.products?.price ?? 0,
          quantity: item.quantity,
          image: item.products?.main_image_url ?? '',
          alt: item.products?.main_image_alt ?? item.products?.name ?? 'Product image',
          inStock: (item.products?.stock_quantity ?? 0) > 0,
        }));
        setCartItems(mapped);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const updateQuantity = async (id: string, delta: number) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(1, Math.min(10, item.quantity + delta));
    await supabase.from('cart_items').update({ quantity: newQty }).eq('id', id);
    setCartItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity: newQty } : i));
    refreshCounts();
  };

  const removeItem = async (id: string) => {
    await supabase.from('cart_items').delete().eq('id', id);
    setCartItems((prev) => prev.filter((i) => i.id !== id));
    refreshCounts();
  };

  const clearCart = async () => {
    if (!user) return;
    await supabase.from('cart_items').delete().eq('user_id', user.id);
    setCartItems([]);
    refreshCounts();
  };

  const handleCoupon = () => {
    if (couponCode.toUpperCase() === 'O2SAVE10') {
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code');
      setCouponApplied(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const shipping = subtotal > 499 ? 0 : 99;
  const tax = Math.round((subtotal - discount) * 0.18);
  const total = subtotal - discount + shipping + tax;

  const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;

  if (!user) {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-6">
            <Icon name="ShoppingCartIcon" size={36} className="text-muted-foreground" />
          </div>
          <h2 className="font-display font-bold text-2xl text-primary mb-3">Sign in to view your cart</h2>
          <p className="text-muted-foreground mb-6">Your cart is saved to your account. Sign in to access it.</p>
          <Link href="/login" className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm">
            <Icon name="ArrowRightOnRectangleIcon" size={17} className="text-white" />
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16">
      {/* Header */}
      <div className="hero-gradient py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Link href="/" className="hover:text-accent transition-colors">Home</Link>
            <Icon name="ChevronRightIcon" size={12} />
            <span className="text-primary font-medium">Cart</span>
          </nav>
          <h1 className="font-display font-bold text-hero-lg text-primary">
            Shopping Cart
          </h1>
          <p className="text-muted-foreground mt-1">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Icon name="ArrowPathIcon" size={32} className="text-accent animate-spin" />
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty cart */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center mb-6">
              <Icon name="ShoppingCartIcon" size={40} className="text-muted-foreground" />
            </div>
            <h2 className="font-display font-bold text-2xl text-primary mb-3">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8 max-w-sm">Looks like you haven&apos;t added anything yet. Explore our premium audio collection.</p>
            <Link href="/shop" className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm">
              <Icon name="ShoppingBagIcon" size={17} className="text-white" />
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-border overflow-hidden">
                {/* Header row */}
                <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 bg-muted border-b border-border">
                  <div className="col-span-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">Product</div>
                  <div className="col-span-2 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Price</div>
                  <div className="col-span-2 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Qty</div>
                  <div className="col-span-2 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Total</div>
                </div>

                {cartItems.map((item, i) => (
                  <div key={item.id} className={`p-5 ${i < cartItems.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="flex flex-col sm:grid sm:grid-cols-12 gap-4 items-start sm:items-center">
                      {/* Product info */}
                      <div className="sm:col-span-6 flex items-center gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                          <AppImage
                            src={item.image}
                            alt={item.alt}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/product-detail?slug=${item.productId}`}>
                            <h3 className="font-display font-bold text-sm text-primary hover:text-accent transition-colors line-clamp-2">{item.name}</h3>
                          </Link>
                          {item.variant && <p className="text-xs text-muted-foreground mt-0.5">{item.variant}</p>}
                          {item.inStock ? (
                            <span className="text-xs text-green-600 font-semibold">In Stock</span>
                          ) : (
                            <span className="text-xs text-red-500 font-semibold">Out of Stock</span>
                          )}
                          {/* Mobile price */}
                          <p className="sm:hidden font-bold text-sm text-primary mt-1">{formatPrice(item.salePrice)}</p>
                        </div>
                      </div>

                      {/* Unit price */}
                      <div className="hidden sm:flex sm:col-span-2 justify-center">
                        <div className="text-center">
                          <p className="font-bold text-sm text-primary">{formatPrice(item.salePrice)}</p>
                          {item.price !== item.salePrice && (
                            <p className="price-original text-xs">{formatPrice(item.price)}</p>
                          )}
                        </div>
                      </div>

                      {/* Quantity + remove */}
                      <div className="sm:col-span-2 flex items-center justify-between sm:justify-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => updateQuantity(item.id, -1)} className="qty-btn">−</button>
                          <span className="w-8 text-center font-bold text-sm text-primary">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="qty-btn">+</button>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="sm:hidden w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors"
                          aria-label="Remove item"
                        >
                          <Icon name="TrashIcon" size={14} />
                        </button>
                      </div>

                      {/* Row total */}
                      <div className="hidden sm:flex sm:col-span-2 items-center justify-end gap-2">
                        <span className="font-bold text-sm text-primary">{formatPrice(item.salePrice * item.quantity)}</span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors"
                          aria-label="Remove item"
                        >
                          <Icon name="TrashIcon" size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue shopping */}
              <div className="flex items-center justify-between mt-4">
                <Link href="/shop" className="flex items-center gap-2 text-sm font-semibold text-accent hover:gap-3 transition-all">
                  <Icon name="ArrowLeftIcon" size={14} className="text-accent" />
                  Continue Shopping
                </Link>
                <button
                  onClick={clearCart}
                  className="text-sm font-semibold text-red-400 hover:text-red-600 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-border p-6 sticky top-20">
                <h2 className="font-display font-bold text-lg text-primary mb-5">Order Summary</h2>

                {/* Coupon */}
                <div className="mb-5">
                  <label className="label-o2">Coupon Code</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                      placeholder="Enter code"
                      className="input-o2 flex-1 text-sm"
                    />
                    <button
                      onClick={handleCoupon}
                      className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors flex-shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                  {couponApplied && (
                    <p className="text-xs text-green-600 font-semibold mt-1.5 flex items-center gap-1">
                      <Icon name="CheckCircleIcon" size={12} className="text-green-600" />
                      Coupon applied! 10% off
                    </p>
                  )}
                  {couponError && <p className="text-xs text-red-500 font-semibold mt-1.5">{couponError}</p>}
                  {!couponApplied && !couponError && (
                    <p className="text-xs text-muted-foreground mt-1.5">Try: O2SAVE10</p>
                  )}
                </div>

                {/* Price breakdown */}
                <div className="flex flex-col gap-3 py-4 border-y border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 font-medium">Discount (10%)</span>
                      <span className="text-green-600 font-semibold">−{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={`font-semibold ${shipping === 0 ? 'text-green-600' : 'text-foreground'}`}>
                      {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span className="font-semibold text-foreground">{formatPrice(tax)}</span>
                  </div>
                </div>

                <div className="flex justify-between mt-4 mb-6">
                  <span className="font-display font-bold text-base text-primary">Total</span>
                  <span className="font-display font-bold text-xl text-primary">{formatPrice(total)}</span>
                </div>

                <Link
                  href="/checkout"
                  className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Icon name="LockClosedIcon" size={16} className="text-white" />
                  Proceed to Checkout
                </Link>

                {/* Security note */}
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                  <Icon name="ShieldCheckIcon" size={13} className="text-accent" />
                  <span>Secured by Stripe. 256-bit SSL encryption.</span>
                </div>

                {/* Payment methods */}
                <div className="flex items-center justify-center gap-2 mt-3">
                  {['VISA', 'MC', 'UPI', 'NB'].map((pm) => (
                    <div key={pm} className="px-2 py-1 rounded bg-muted border border-border text-[9px] font-bold text-muted-foreground">
                      {pm}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}