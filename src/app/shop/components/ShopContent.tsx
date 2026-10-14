'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

// Static fallback products (O2 Eardops only, no Neckbands)
const fallbackProducts = [
  { id: '1', name: 'O2 Eardop Pro X1', category: 'O2 Eardops', price: 2999, salePrice: 1099, discount: 63, rating: 4.8, reviews: 342, badge: 'Best Seller', image: "/assets/images/O2Earpods_Orange-1790593783106.png", alt: 'O2 Eardop Pro X1 true wireless earbuds, orange variant', inStock: true, isNew: false, isSale: true, colors: ['#F5F5F5', '#1A1A1A'], slug: 'o2-eardop-pro-x1' },
  { id: '2', name: 'O2 Eardop Sport S3', category: 'Sports', price: 2999, salePrice: 1099, discount: 63, rating: 4.5, reviews: 156, badge: 'Hot', image: "/assets/images/O2Earpods_Green-1790593782983.png", alt: 'O2 Eardop Sport S3 wireless sports earbuds, green variant', inStock: true, isNew: false, isSale: true, colors: ['#1A1A1A', '#1A2E6C'], slug: 'o2-eardop-sport-s3' },
  { id: '3', name: 'O2 Eardop Elite ANC', category: 'O2 Eardops', price: 2999, salePrice: 1099, discount: 63, rating: 4.9, reviews: 89, badge: 'Premium', image: "/assets/images/O2Earpods_Blue-1790593772767.png", alt: 'O2 Eardop Elite ANC premium wireless earbuds, blue variant', inStock: true, isNew: true, isSale: true, colors: ['#1A1A1A'], slug: 'o2-eardop-elite-anc' },
  { id: '4', name: 'O2 Eardop Lite L2', category: 'O2 Eardops', price: 2999, salePrice: 1099, discount: 63, rating: 4.3, reviews: 412, badge: '', image: "/assets/images/O2Earpods_Orange-1790593783106.png", alt: 'O2 Eardop Lite L2 affordable wireless earbuds, orange variant', inStock: true, isNew: false, isSale: true, colors: ['#F5F5F5', '#1A1A1A', '#1A2E6C'], slug: 'o2-eardop-lite-l2' },
  { id: '5', name: 'O2 Eardop Gaming G3', category: 'Gaming', price: 2999, salePrice: 1099, discount: 63, rating: 4.6, reviews: 93, badge: '', image: "/assets/images/O2Earpods_Green-1790593782983.png", alt: 'O2 Eardop Gaming G3 gaming earphones, green variant', inStock: true, isNew: false, isSale: true, colors: ['#1A1A1A', '#1A2E6C'], slug: 'o2-eardop-gaming-g3' },
  { id: '6', name: 'O2 Eardop Kids K1', category: 'Kids', price: 2999, salePrice: 1099, discount: 63, rating: 4.4, reviews: 67, badge: 'New', image: "/assets/images/O2Earpods_Blue-1790593772767.png", alt: 'O2 Eardop Kids K1 colorful children earphones, blue variant', inStock: true, isNew: true, isSale: true, colors: ['#FF6B35', '#2196F3', '#22C55E'], slug: 'o2-eardop-kids-k1' }];


interface ShopProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  salePrice: number;
  discount: number;
  rating: number;
  reviews: number;
  badge: string;
  image: string;
  alt: string;
  inStock: boolean;
  isNew: boolean;
  isSale: boolean;
  colors: string[];
  slug: string;
}

const sortOptions = [
{ label: 'Newest', value: 'newest' },
{ label: 'Price: Low to High', value: 'price-asc' },
{ label: 'Price: High to Low', value: 'price-desc' },
{ label: 'Best Rated', value: 'rating' },
{ label: 'Most Popular', value: 'popular' }];


export default function ShopContent() {
  const [allProducts, setAllProducts] = useState<ShopProduct[]>(fallbackProducts);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState(8000);
  const [showInStock, setShowInStock] = useState(false);
  const [showSale, setShowSale] = useState(false);
  const [wishlisted, setWishlisted] = useState<string[]>([]);
  const [addedToCart, setAddedToCart] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, refreshCounts } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    async function loadProducts() {
      try {
        const { data, error } = await supabase.
        from('products').
        select('*, categories(name)').
        eq('product_status', 'active').
        order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: ShopProduct[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.categories?.name ?? 'O2 Eardops',
            price: p.price,
            salePrice: p.sale_price ?? p.price,
            discount: p.sale_price ? Math.round((p.price - p.sale_price) / p.price * 100) : 0,
            rating: p.rating ?? 0,
            reviews: p.review_count ?? 0,
            badge: p.badge ?? '',
            image: p.main_image_url ?? '',
            alt: p.main_image_alt ?? p.name,
            inStock: p.stock_quantity > 0,
            isNew: p.badge === 'New',
            isSale: !!p.sale_price,
            colors: Array.isArray(p.color_variants) ? p.color_variants.map((c: any) => c.color) : [],
            slug: p.slug
          }));
          setAllProducts(mapped);
          const cats = ['All', ...Array.from(new Set(mapped.map((p) => p.category)))];
          setCategories(cats);
        } else {
          const cats = ['All', ...Array.from(new Set(fallbackProducts.map((p) => p.category)))];
          setCategories(cats);
        }
      } catch {
        const cats = ['All', ...Array.from(new Set(fallbackProducts.map((p) => p.category)))];
        setCategories(cats);
      }
    }
    loadProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load wishlist state for logged-in user
  useEffect(() => {
    if (!user) return;
    async function loadWishlist() {
      const { data } = await supabase.from('wishlist_items').select('product_id').eq('user_id', user!.id);
      if (data) setWishlisted(data.map((w: any) => w.product_id));
    }
    loadWishlist();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = allProducts.
  filter((p) => selectedCategory === 'All' || p.category === selectedCategory).
  filter((p) => p.salePrice <= priceRange).
  filter((p) => !showInStock || p.inStock).
  filter((p) => !showSale || p.isSale).
  sort((a, b) => {
    if (sortBy === 'price-asc') return a.salePrice - b.salePrice;
    if (sortBy === 'price-desc') return b.salePrice - a.salePrice;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'popular') return b.reviews - a.reviews;
    return 0;
  });

  const toggleWishlist = async (id: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (wishlisted.includes(id)) {
      await supabase.from('wishlist_items').delete().eq('user_id', user.id).eq('product_id', id);
      setWishlisted((prev) => prev.filter((x) => x !== id));
    } else {
      await supabase.from('wishlist_items').upsert({ user_id: user.id, product_id: id }, { onConflict: 'user_id,product_id' });
      setWishlisted((prev) => [...prev, id]);
    }
    refreshCounts();
  };

  const handleAddToCart = async (id: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', id)
      .maybeSingle();

    if (existing) {
      await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
    } else {
      await supabase.from('cart_items').insert({ user_id: user.id, product_id: id, quantity: 1 });
    }
    refreshCounts();
    setAddedToCart((prev) => [...prev, id]);
    setTimeout(() => setAddedToCart((prev) => prev.filter((x) => x !== id)), 2000);
  };

  const formatPrice = (p: number) => `₹${p.toLocaleString('en-IN')}`;

  return (
    <div className="pt-16">
      {/* Page header */}
      <div className="hero-gradient py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Link href="/" className="hover:text-accent transition-colors">Home</Link>
            <Icon name="ChevronRightIcon" size={12} className="text-muted-foreground" />
            <span className="text-primary font-medium">Shop</span>
          </nav>
          <h1 className="font-display font-bold text-hero-lg text-primary">Shop O2 Eardops</h1>
          <p className="text-muted-foreground mt-2">{filtered.length} products found</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Mobile filter bar */}
        <div className="flex items-center justify-between gap-3 mb-6 lg:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-semibold text-foreground">
            <Icon name="FunnelIcon" size={16} />
            Filters
          </button>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-white text-sm font-medium text-foreground outline-none">
            {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
            <div className="bg-white rounded-2xl border border-border p-5 sticky top-20">
              <h3 className="font-display font-bold text-base text-primary mb-5">Filters</h3>
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Category</h4>
                <div className="flex flex-col gap-1.5">
                  {categories.map((cat) =>
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-primary text-white' : 'text-foreground hover:bg-muted'}`}>
                      {cat}
                    </button>
                  )}
                </div>
              </div>
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Price Range: {formatPrice(priceRange)}</h4>
                <input type="range" min={500} max={8000} step={100} value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} className="range-input" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>₹500</span><span>₹8,000</span></div>
              </div>
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Availability</h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showInStock} onChange={(e) => setShowInStock(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
                  <span className="text-sm font-medium text-foreground">In Stock Only</span>
                </label>
              </div>
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Offers</h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showSale} onChange={(e) => setShowSale(e.target.checked)} className="w-4 h-4 rounded accent-primary" />
                  <span className="text-sm font-medium text-foreground">On Sale</span>
                </label>
              </div>
              <button onClick={() => {setSelectedCategory('All');setPriceRange(8000);setShowInStock(false);setShowSale(false);}} className="w-full py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                Clear Filters
              </button>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) =>
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}>
                    {cat}
                  </button>
                )}
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-white text-sm font-medium text-foreground outline-none">
                {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {filtered.length === 0 ?
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Icon name="MagnifyingGlassIcon" size={28} className="text-muted-foreground" />
                </div>
                <h3 className="font-display font-bold text-lg text-primary mb-2">No products found</h3>
                <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
              </div> :

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((product) =>
              <div key={product.id} className="product-card-hover bg-white rounded-2xl overflow-hidden border border-border flex flex-col">
                    <div className="relative overflow-hidden bg-muted h-52 product-image-zoom">
                      <Link href={`/product-detail?slug=${product.slug}`}>
                        <AppImage src={product.image} alt={product.alt} fill className="object-cover" />
                      </Link>
                      {product.badge &&
                  <span className={`absolute top-3 left-3 ${product.isNew ? 'badge-new' : 'badge-sale'}`}>{product.badge}</span>
                  }
                      {product.discount > 0 &&
                  <span className="absolute top-3 right-10 badge-sale">{product.discount}% OFF</span>
                  }
                      <button className={`wishlist-btn absolute top-3 right-3 ${wishlisted.includes(product.id) ? 'active' : ''}`} onClick={() => toggleWishlist(product.id)} aria-label="Toggle wishlist">
                        <Icon name="HeartIcon" size={13} variant={wishlisted.includes(product.id) ? 'solid' : 'outline'} />
                      </button>
                      {!product.inStock &&
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                          <span className="bg-white rounded-full px-3 py-1 text-xs font-bold text-muted-foreground border border-border">Out of Stock</span>
                        </div>
                  }
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">{product.category}</span>
                      <Link href={`/product-detail?slug=${product.slug}`}>
                        <h3 className="font-display font-bold text-sm text-primary hover:text-accent transition-colors mb-2">{product.name}</h3>
                      </Link>
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) =>
                      <Icon key={s} name="StarIcon" size={10} className={s <= Math.floor(product.rating) ? 'star-filled' : 'star-empty'} variant="solid" />
                      )}
                        </div>
                        <span className="text-xs text-muted-foreground">({product.reviews})</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        {product.colors.map((c, i) =>
                    <div key={i} className="w-3.5 h-3.5 rounded-full border border-border" style={{ background: c }} />
                    )}
                      </div>
                      <div className="flex items-center gap-2 mt-auto">
                        <span className="font-display font-bold text-sm text-primary">{formatPrice(product.salePrice)}</span>
                        <span className="price-original text-xs">{formatPrice(product.price)}</span>
                      </div>
                      <button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={!product.inStock}
                    className={`mt-3 w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    !product.inStock ? 'bg-muted text-muted-foreground cursor-not-allowed' :
                    addedToCart.includes(product.id) ? 'bg-green-500 text-white' : 'btn-primary'}`
                    }>
                    
                        <Icon name={addedToCart.includes(product.id) ? 'CheckIcon' : 'ShoppingCartIcon'} size={12} className="text-inherit" />
                        {!product.inStock ? 'Out of Stock' : addedToCart.includes(product.id) ? 'Added!' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
              )}
              </div>
            }

            {filtered.length > 0 &&
            <div className="flex items-center justify-center gap-2 mt-10">
                <button className="w-9 h-9 rounded-lg border border-border bg-white flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                  <Icon name="ChevronLeftIcon" size={16} />
                </button>
                {[1, 2, 3].map((p) =>
              <button key={p} className={`w-9 h-9 rounded-lg border font-semibold text-sm transition-colors ${p === 1 ? 'bg-primary border-primary text-white' : 'border-border bg-white text-foreground hover:bg-muted'}`}>
                    {p}
                  </button>
              )}
                <button className="w-9 h-9 rounded-lg border border-border bg-white flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                  <Icon name="ChevronRightIcon" size={16} />
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </div>);

}