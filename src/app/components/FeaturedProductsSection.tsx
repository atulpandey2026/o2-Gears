'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { supabase } from '@/lib/supabase';

// Fallback static products (shown when Supabase not connected)
const fallbackProducts = [
{
  id: '1',
  name: 'O2 Eardop Pro X1',
  category: 'True Wireless',
  price: 2999,
  sale_price: 1099,
  discount: 63,
  rating: 4.8,
  review_count: 342,
  badge: 'Best Seller',
  badgeType: 'sale',
  main_image_url: "/assets/images/O2Earpods_Orange-1790593783106.png",
  main_image_alt: 'O2 Eardop Pro X1 true wireless earbuds, orange variant',
  inStock: true,
  color_variants: [{ color: '#F5F5F5' }, { color: '#1A1A1A' }],
  slug: 'o2-eardop-pro-x1'
},
{
  id: '2',
  name: 'O2 Eardop Sport S3',
  category: 'Sports',
  price: 2999,
  sale_price: 1099,
  discount: 63,
  rating: 4.5,
  review_count: 156,
  badge: 'Hot',
  badgeType: 'sale',
  main_image_url: "/assets/images/O2Earpods_Green-1790593782983.png",
  main_image_alt: 'O2 Eardop Sport S3 wireless sports earbuds, green variant',
  inStock: true,
  color_variants: [{ color: '#1A1A1A' }, { color: '#1A2E6C' }],
  slug: 'o2-eardop-sport-s3'
},
{
  id: '3',
  name: 'O2 Eardop Elite ANC',
  category: 'True Wireless ANC',
  price: 2999,
  sale_price: 1099,
  discount: 63,
  rating: 4.9,
  review_count: 89,
  badge: 'Premium',
  badgeType: 'new',
  main_image_url: "/assets/images/O2Earpods_Blue-1790593772767.png",
  main_image_alt: 'O2 Eardop Elite ANC premium wireless earbuds, blue variant',
  inStock: true,
  color_variants: [{ color: '#1A1A1A' }],
  slug: 'o2-eardop-elite-anc'
},
{
  id: '4',
  name: 'O2 Eardop Lite L2',
  category: 'True Wireless',
  price: 2999,
  sale_price: 1099,
  discount: 63,
  rating: 4.3,
  review_count: 412,
  badge: '',
  badgeType: '',
  main_image_url: "/assets/images/O2Earpods_Orange-1790593783106.png",
  main_image_alt: 'O2 Eardop Lite L2 affordable wireless earbuds, orange variant',
  inStock: true,
  color_variants: [{ color: '#F5F5F5' }, { color: '#1A1A1A' }, { color: '#1A2E6C' }],
  slug: 'o2-eardop-lite-l2'
}];


interface DisplayProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  sale_price: number;
  discount: number;
  rating: number;
  review_count: number;
  badge: string;
  badgeType: string;
  main_image_url: string;
  main_image_alt: string;
  inStock: boolean;
  color_variants: {color: string;}[];
  slug: string;
}

function ProductCard({ product }: {product: DisplayProduct;}) {
  const [wishlisted, setWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;

  return (
    <div className="product-card-hover bg-white rounded-3xl overflow-hidden border border-border flex flex-col group">
      {/* Image area */}
      <div className="relative overflow-hidden bg-muted h-56">
        <Link href={`/product-detail?slug=${product.slug}`}>
          <AppImage
            src={product.main_image_url}
            alt={product.main_image_alt}
            fill
            className="object-cover transition-all duration-500 group-hover:scale-105" />
          
        </Link>
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.badge &&
          <span className={product.badgeType === 'sale' ? 'badge-sale' : 'badge-new'}>
              {product.badge}
            </span>
          }
          {product.discount > 0 &&
          <span className="badge-sale">{product.discount}% OFF</span>
          }
        </div>
        <button
          className={`wishlist-btn absolute top-3 right-3 ${wishlisted ? 'active' : ''}`}
          onClick={() => setWishlisted(!wishlisted)}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
          
          <Icon name="HeartIcon" size={14} variant={wishlisted ? 'solid' : 'outline'} />
        </button>
        {!product.inStock &&
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-white rounded-full px-4 py-1.5 text-xs font-bold text-muted-foreground border border-border">Out of Stock</span>
          </div>
        }
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-1">{product.category}</span>
        <Link href={`/product-detail?slug=${product.slug}`}>
          <h3 className="font-display font-bold text-sm text-primary hover:text-accent transition-colors mb-2 leading-snug">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) =>
            <Icon key={s} name="StarIcon" size={10} className={s <= Math.floor(product.rating) ? 'star-filled' : 'star-empty'} variant="solid" />
            )}
          </div>
          <span className="text-xs text-muted-foreground">({product.review_count})</span>
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          {product.color_variants?.map((c, idx) =>
          <div
            key={idx}
            className="w-4 h-4 rounded-full border-2 border-border cursor-pointer hover:scale-110 transition-transform"
            style={{ background: c.color }} />

          )}
        </div>
        <div className="flex items-center gap-2 mt-auto">
          <span className="font-display font-bold text-base text-primary">{formatPrice(product.sale_price)}</span>
          <span className="price-original text-xs">{formatPrice(product.price)}</span>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className={`mt-3 w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
          product.inStock ?
          addedToCart ?
          'bg-green-500 text-white' : 'btn-primary' : 'bg-muted text-muted-foreground cursor-not-allowed'}`
          }>
          
          <Icon name={addedToCart ? 'CheckIcon' : 'ShoppingCartIcon'} size={13} className={product.inStock ? 'text-white' : 'text-muted-foreground'} />
          {addedToCart ? 'Added!' : product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>);

}

export default function FeaturedProductsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<DisplayProduct[]>(fallbackProducts);

  useEffect(() => {
    async function loadProducts() {
      try {
        const { data, error } = await supabase.
        from('products').
        select('*, categories(name)').
        eq('product_status', 'active').
        eq('show_on_homepage', true).
        order('created_at', { ascending: false }).
        limit(4);

        if (!error && data && data.length > 0) {
          const mapped: DisplayProduct[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.categories?.name ?? 'O2 Eardops',
            price: p.price,
            sale_price: p.sale_price ?? p.price,
            discount: p.sale_price ? Math.round((p.price - p.sale_price) / p.price * 100) : 0,
            rating: p.rating ?? 0,
            review_count: p.review_count ?? 0,
            badge: p.badge ?? '',
            badgeType: p.badge === 'New' ? 'new' : 'sale',
            main_image_url: p.main_image_url ?? '',
            main_image_alt: p.main_image_alt ?? p.name,
            inStock: p.stock_quantity > 0,
            color_variants: Array.isArray(p.color_variants) ? p.color_variants : [],
            slug: p.slug
          }));
          setProducts(mapped);
        }
      } catch {

        // Use fallback products
      }}
    loadProducts();
  }, []);

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
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-white" id="featured">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10 scroll-reveal">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Featured</span>
            <h2 className="font-display font-bold text-section-title text-primary mt-1">Top O2 Eardops</h2>
            <div className="w-12 h-1 rounded-full bg-accent mt-2" />
          </div>
          <Link href="/shop" className="text-sm font-semibold text-accent flex items-center gap-1 hover:gap-2 transition-all">
            View all <Icon name="ArrowRightIcon" size={14} className="text-accent" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, i) =>
          <div key={product.id} className={`scroll-reveal stagger-${i + 1}`}>
              <ProductCard product={product} />
            </div>
          )}
        </div>
      </div>
    </section>);

}