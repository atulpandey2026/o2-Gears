'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

// Fallback product data
const fallbackProduct = {
  id: 'fallback',
  name: 'O2 Eardop Pro X1',
  category: 'True Wireless',
  badge: 'Best Seller',
  price: 2999,
  sale_price: 1099,
  discount: 63,
  rating: 4.8,
  review_count: 342,
  description: 'The O2 Eardop Pro X1 redefines true wireless audio. Hybrid ANC powered by 6 microphones, 12mm dynamic drivers, 30-hour battery, IPX5 water resistance, and Bluetooth 5.3 for seamless connectivity.',
  gallery_images: [
    { url: "/assets/images/O2Earpods_Orange-1790593783106.png", alt: 'O2 Eardop Pro X1 orange variant' },
    { url: "/assets/images/O2Earpods_Green-1790593782983.png", alt: 'O2 Eardop Pro X1 green variant' },
    { url: "/assets/images/O2Earpods_Blue-1790593772767.png", alt: 'O2 Eardop Pro X1 blue variant' },
    { url: "/assets/images/O2Earpods_Orange-1790593783106.png", alt: 'O2 Eardop Pro X1 orange variant close-up' }
  ],
  color_variants: [
    { label: 'Pearl White', color: '#F5F5F5', border: '#E0E0E0' },
    { label: 'Midnight Black', color: '#1A1A1A', border: '#333' },
    { label: 'Ocean Blue', color: '#1A2E6C', border: '#0D1B4B' }
  ],
  specifications: [
    { label: 'Model', value: 'O2-X1-TW' },
    { label: 'Bluetooth', value: '5.3' },
    { label: 'Driver Size', value: '12mm Dynamic' },
    { label: 'Battery (Buds)', value: '6 hours' },
    { label: 'Battery (Case)', value: '24 hours' },
    { label: 'Total Playtime', value: '30 hours' },
    { label: 'Charging', value: 'USB-C, 15min = 2hr' },
    { label: 'ANC', value: 'Yes, Hybrid ANC' },
    { label: 'IP Rating', value: 'IPX5' },
    { label: 'Microphones', value: '6 mics (3 per bud)' },
    { label: 'Weight', value: '4.5g per bud' },
    { label: 'Warranty', value: '1 Year' }
  ],
  stock_quantity: 48
};

const fallbackReviews = [
  { id: '1', reviewer_name: 'Priya Sharma', rating: 5, created_at: 'Sep 12, 2026', title: 'Absolutely love these!', body: 'Best earbuds I have ever used. Sound quality is incredible and the ANC is top-notch. Battery lasts all day.', is_verified: true },
  { id: '2', reviewer_name: 'Arjun Mehta', rating: 4, created_at: 'Aug 28, 2026', title: 'Great value for money', body: 'Really impressed with the build quality. Fit is comfortable for long sessions.', is_verified: false },
  { id: '3', reviewer_name: 'Kavya Reddy', rating: 5, created_at: 'Aug 15, 2026', title: 'Perfect for workouts', body: 'IPX5 rating is real — went through a heavy rain run and they survived. Sound is punchy and motivating.', is_verified: true }
];

export default function ProductDetailContent() {
  const searchParams = useSearchParams();
  const slug = searchParams?.get('slug');
  const { user, refreshCounts } = useAuth();
  const supabase = createClient();

  const [product, setProduct] = useState<any>(fallbackProduct);
  const [reviews, setReviews] = useState<any[]>(fallbackReviews);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [wishlisted, setWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (!slug) return;
    async function loadProduct() {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('slug', slug)
        .eq('product_status', 'active')
        .single();
      if (!error && data) {
        setProduct(data);
        const { data: revData } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', data.id)
          .order('created_at', { ascending: false });
        if (revData && revData.length > 0) setReviews(revData);
      }
    }
    loadProduct();
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check wishlist status
  useEffect(() => {
    if (!user || !product?.id || product.id === 'fallback') return;
    async function checkWishlist() {
      const { data } = await supabase
        .from('wishlist_items')
        .select('id')
        .eq('user_id', user!.id)
        .eq('product_id', product.id)
        .maybeSingle();
      setWishlisted(!!data);
    }
    checkWishlist();
  }, [user, product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const galleryImages = Array.isArray(product.gallery_images) && product.gallery_images.length > 0
    ? product.gallery_images
    : fallbackProduct.gallery_images;

  const colorVariants = Array.isArray(product.color_variants) && product.color_variants.length > 0
    ? product.color_variants
    : fallbackProduct.color_variants;

  const specifications = Array.isArray(product.specifications) && product.specifications.length > 0
    ? product.specifications
    : fallbackProduct.specifications;

  const tabs = ['description', 'specifications', 'reviews'];

  const handleAddToCart = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (product.id === 'fallback') return;
    setCartLoading(true);
    const variantLabel = colorVariants[selectedVariant]?.label ?? null;
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .eq('variant_label', variantLabel ?? '')
      .maybeSingle();

    if (existing) {
      await supabase.from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id);
    } else {
      await supabase.from('cart_items').insert({
        user_id: user.id,
        product_id: product.id,
        variant_label: variantLabel,
        quantity,
      });
    }
    setCartLoading(false);
    setAddedToCart(true);
    refreshCounts();
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleWishlist = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (product.id === 'fallback') return;
    setWishlistLoading(true);
    if (wishlisted) {
      await supabase.from('wishlist_items').delete().eq('user_id', user.id).eq('product_id', product.id);
      setWishlisted(false);
    } else {
      await supabase.from('wishlist_items').upsert({ user_id: user.id, product_id: product.id }, { onConflict: 'user_id,product_id' });
      setWishlisted(true);
    }
    setWishlistLoading(false);
    refreshCounts();
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || product.id === 'fallback') return;
    setSubmittingReview(true);
    const { data: profile } = await supabase.from('user_profiles').select('full_name').eq('id', user.id).single();
    await supabase.from('reviews').insert({
      product_id: product.id,
      user_id: user.id,
      reviewer_name: profile?.full_name ?? user.email?.split('@')[0] ?? 'Customer',
      rating: reviewForm.rating,
      title: reviewForm.title,
      body: reviewForm.body,
      is_verified: true,
    });
    // Reload reviews
    const { data: revData } = await supabase.from('reviews').select('*').eq('product_id', product.id).order('created_at', { ascending: false });
    if (revData) setReviews(revData);
    setReviewForm({ rating: 5, title: '', body: '' });
    setReviewSuccess(true);
    setSubmittingReview(false);
    setTimeout(() => setReviewSuccess(false), 3000);
  };

  const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;

  const salePrice = product.sale_price ?? product.price;
  const discount = product.sale_price ? Math.round((product.price - product.sale_price) / product.price * 100) : 0;

  return (
    <div className="pt-16">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <Icon name="ChevronRightIcon" size={12} />
          <Link href="/shop" className="hover:text-accent transition-colors">Shop</Link>
          <Icon name="ChevronRightIcon" size={12} />
          <span className="text-primary font-medium">{product.name}</span>
        </nav>
      </div>

      {/* Product section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div className="flex flex-col gap-4">
            <div className="relative rounded-3xl overflow-hidden bg-muted aspect-square product-image-zoom">
              <AppImage
                src={galleryImages[selectedImage]?.url ?? galleryImages[0]?.url}
                alt={galleryImages[selectedImage]?.alt ?? product.name}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute bottom-4 right-4 glass-card rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                <Icon name="MagnifyingGlassPlusIcon" size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Hover to zoom</span>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {galleryImages.map((img: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`gallery-thumb flex-shrink-0 ${selectedImage === i ? 'active' : ''}`}
                >
                  <AppImage src={img.url} alt={`Thumbnail ${i + 1}`} width={72} height={72} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product info */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                {product.categories?.name ?? 'O2 Eardops'}
              </span>
              {product.badge && <span className="badge-sale">{product.badge}</span>}
            </div>

            <h1 className="font-display font-bold text-hero-lg text-primary leading-tight">{product.name}</h1>

            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Icon key={s} name="StarIcon" size={16} className={s <= Math.floor(product.rating ?? 0) ? 'star-filled' : 'star-empty'} variant="solid" />
                ))}
              </div>
              <span className="text-sm font-semibold text-primary">{product.rating ?? 0}</span>
              <span className="text-sm text-muted-foreground">({product.review_count ?? 0} reviews)</span>
              <span className={`text-sm font-semibold flex items-center gap-1 ${(product.stock_quantity ?? 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                <Icon name="CheckCircleIcon" size={14} className={(product.stock_quantity ?? 0) > 0 ? 'text-green-600' : 'text-red-500'} />
                {(product.stock_quantity ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-3xl text-primary">{formatPrice(salePrice)}</span>
              {product.sale_price && <span className="price-original text-lg">{formatPrice(product.price)}</span>}
              {discount > 0 && <span className="badge-sale text-sm px-3 py-1">{discount}% OFF</span>}
            </div>
            <p className="text-xs text-muted-foreground -mt-3">Inclusive of all taxes. Free shipping on orders above ₹499.</p>

            {/* Color variants */}
            <div>
              <span className="label-o2">Color: {colorVariants[selectedVariant]?.label}</span>
              <div className="flex gap-3 mt-2">
                {colorVariants.map((v: any, i: number) => (
                  <button
                    key={v.label}
                    onClick={() => setSelectedVariant(i)}
                    title={v.label}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${selectedVariant === i ? 'scale-110 ring-2 ring-accent ring-offset-2' : 'hover:scale-110'}`}
                    style={{ background: v.color, borderColor: v.border }}
                  />
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <span className="label-o2">Quantity</span>
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="qty-btn">−</button>
                <span className="w-10 text-center font-bold text-primary">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="qty-btn">+</button>
                <span className="text-xs text-muted-foreground ml-2">Max 10 per order</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={cartLoading}
                className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${addedToCart ? 'bg-green-500 text-white' : 'btn-primary'}`}
              >
                {cartLoading ? (
                  <Icon name="ArrowPathIcon" size={17} className="text-white animate-spin" />
                ) : (
                  <Icon name={addedToCart ? 'CheckIcon' : 'ShoppingCartIcon'} size={17} className="text-white" />
                )}
                {addedToCart ? 'Added to Cart!' : 'Add to Cart'}
              </button>
              <Link href="/checkout" className="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 btn-accent">
                <Icon name="BoltIcon" size={17} className="text-white" />
                Buy Now
              </Link>
              <button
                onClick={handleWishlist}
                disabled={wishlistLoading}
                className={`wishlist-btn w-12 h-12 ${wishlisted ? 'active' : ''}`}
                aria-label="Wishlist"
              >
                {wishlistLoading ? (
                  <Icon name="ArrowPathIcon" size={18} className="animate-spin" />
                ) : (
                  <Icon name="HeartIcon" size={18} variant={wishlisted ? 'solid' : 'outline'} />
                )}
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {[
                { icon: 'ShieldCheckIcon', label: '1 Year Warranty' },
                { icon: 'TruckIcon', label: 'Free Shipping' },
                { icon: 'ArrowPathIcon', label: '7-Day Returns' },
                { icon: 'CreditCardIcon', label: 'Secure Payment' }
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-xl px-3 py-2">
                  <Icon name={t.icon as any} size={14} className="text-accent" />
                  <span className="font-medium">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-14">
          <div className="flex gap-2 border-b border-border pb-0 mb-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab-btn capitalize flex-shrink-0 border-b-2 rounded-none pb-3 ${activeTab === tab ? 'active border-accent text-accent bg-transparent' : 'border-transparent'}`}
              >
                {tab}
                {tab === 'reviews' && <span className="ml-1.5 text-xs opacity-70">({reviews.length})</span>}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div className="prose max-w-none text-muted-foreground">
              <p className="text-base leading-relaxed mb-4">{product.description}</p>
              {Array.isArray(product.features) && product.features.length > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {product.features.map((f: any) => (
                    <div key={f.title} className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                      <Icon name="CheckCircleIcon" size={14} className="text-accent flex-shrink-0" />
                      <span className="text-sm font-semibold text-primary">{f.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="max-w-2xl">
              <div className="bg-white rounded-2xl border border-border overflow-hidden">
                {specifications.map((spec: any, i: number) => (
                  <div key={spec.label} className={`flex items-center px-5 py-3 ${i < specifications.length - 1 ? 'border-b border-border' : ''} ${i % 2 === 0 ? 'bg-muted/30' : ''}`}>
                    <span className="text-sm font-semibold text-muted-foreground w-40 flex-shrink-0">{spec.label}</span>
                    <span className="text-sm font-medium text-primary">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="flex flex-col gap-5 max-w-2xl">
              {reviews.map((review: any) => (
                <div key={review.id} className="bg-white rounded-2xl border border-border p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-primary">{review.reviewer_name}</span>
                        {review.is_verified && (
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Verified</span>
                        )}
                      </div>
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Icon key={s} name="StarIcon" size={12} className={s <= review.rating ? 'star-filled' : 'star-empty'} variant="solid" />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {typeof review.created_at === 'string' && review.created_at.includes('T')
                        ? new Date(review.created_at).toLocaleDateString('en-IN')
                        : review.created_at}
                    </span>
                  </div>
                  {review.title && <h4 className="font-semibold text-sm text-primary mb-1">{review.title}</h4>}
                  <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>
                </div>
              ))}

              {/* Write a review */}
              {user && product.id !== 'fallback' && (
                <div className="bg-white rounded-2xl border border-border p-5 mt-2">
                  <h3 className="font-display font-bold text-base text-primary mb-4">Write a Review</h3>
                  {reviewSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-600 mb-4 flex items-center gap-2">
                      <Icon name="CheckCircleIcon" size={16} className="text-green-500" />
                      Review submitted successfully!
                    </div>
                  )}
                  <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
                    <div>
                      <label className="label-o2">Rating</label>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}
                          >
                            <Icon name="StarIcon" size={24} className={s <= reviewForm.rating ? 'star-filled' : 'star-empty'} variant="solid" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="label-o2">Title</label>
                      <input
                        type="text"
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Summary of your review"
                        className="input-o2"
                      />
                    </div>
                    <div>
                      <label className="label-o2">Review</label>
                      <textarea
                        value={reviewForm.body}
                        onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
                        placeholder="Share your experience..."
                        className="input-o2 min-h-[80px] resize-y"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="btn-primary py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                    >
                      {submittingReview ? (
                        <Icon name="ArrowPathIcon" size={16} className="text-white animate-spin" />
                      ) : (
                        <Icon name="PaperAirplaneIcon" size={16} className="text-white" />
                      )}
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
