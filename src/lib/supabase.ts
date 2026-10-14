import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: 'admin' | 'customer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
}

export interface ProductImage {
  url: string;
  alt: string;
  label?: string;
}

export interface ProductFeature {
  icon: string;
  title: string;
  description: string;
  stat?: string;
  statLabel?: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ColorVariant {
  label: string;
  color: string;
  border: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  category_id?: string;
  description?: string;
  price: number;
  sale_price?: number;
  stock_quantity: number;
  product_status: 'active' | 'draft' | 'archived';
  is_featured: boolean;
  show_on_homepage: boolean;
  badge?: string;
  rating: number;
  review_count: number;
  main_image_url?: string;
  main_image_alt?: string;
  technology_images: ProductImage[];
  closeup_images: ProductImage[];
  lifestyle_images: ProductImage[];
  gallery_images: ProductImage[];
  features: ProductFeature[];
  specifications: ProductSpec[];
  color_variants: ColorVariant[];
  tags: string[];
  created_at: string;
  updated_at: string;
  categories?: Category;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_label?: string;
  quantity: number;
  created_at: string;
  products?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  products?: Product;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  discount: number;
  shipping_cost: number;
  tax: number;
  total: number;
  coupon_code?: string;
  shipping_method?: string;
  payment_method?: string;
  payment_status: string;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  product_image?: string;
  variant_label?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Review {
  id: string;
  product_id: string;
  user_id?: string;
  reviewer_name: string;
  rating: number;
  title?: string;
  body?: string;
  is_verified: boolean;
  review_status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface HomepageContent {
  id: string;
  section_key: string;
  title?: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  image_alt?: string;
  cta_text?: string;
  cta_url?: string;
  is_active: boolean;
  sort_order: number;
  extra_data: Record<string, unknown>;
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, fullName: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  return supabase.auth.getSession();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ─── Product helpers ──────────────────────────────────────────────────────────

export async function getProducts(options?: {
  featured?: boolean;
  homepage?: boolean;
  categorySlug?: string;
  limit?: number;
}) {
  let query = supabase
    .from('products')
    .select('*, categories(*)')
    .eq('product_status', 'active');

  if (options?.featured) query = query.eq('is_featured', true);
  if (options?.homepage) query = query.eq('show_on_homepage', true);
  if (options?.limit) query = query.limit(options.limit);

  return query.order('created_at', { ascending: false });
}

export async function getProductBySlug(slug: string) {
  return supabase
    .from('products')
    .select('*, categories(*)')
    .eq('slug', slug)
    .eq('product_status', 'active')
    .single();
}

export async function getProductById(id: string) {
  return supabase
    .from('products')
    .select('*, categories(*)')
    .eq('id', id)
    .single();
}

// ─── Cart helpers ─────────────────────────────────────────────────────────────

export async function getCartItems(userId: string) {
  return supabase
    .from('cart_items')
    .select('*, products(*)')
    .eq('user_id', userId);
}

export async function addToCart(userId: string, productId: string, quantity: number, variantLabel?: string) {
  return supabase
    .from('cart_items')
    .upsert({
      user_id: userId,
      product_id: productId,
      variant_label: variantLabel ?? null,
      quantity,
    }, { onConflict: 'user_id,product_id,variant_label' });
}

export async function updateCartQuantity(cartItemId: string, quantity: number) {
  return supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId);
}

export async function removeFromCart(cartItemId: string) {
  return supabase.from('cart_items').delete().eq('id', cartItemId);
}

export async function clearCart(userId: string) {
  return supabase.from('cart_items').delete().eq('user_id', userId);
}

// ─── Wishlist helpers ─────────────────────────────────────────────────────────

export async function getWishlistItems(userId: string) {
  return supabase
    .from('wishlist_items')
    .select('*, products(*)')
    .eq('user_id', userId);
}

export async function addToWishlist(userId: string, productId: string) {
  return supabase
    .from('wishlist_items')
    .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' });
}

export async function removeFromWishlist(userId: string, productId: string) {
  return supabase
    .from('wishlist_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);
}

// ─── Reviews helpers ──────────────────────────────────────────────────────────

export async function getProductReviews(productId: string) {
  return supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
}

// ─── Homepage content helpers ─────────────────────────────────────────────────

export async function getHomepageContent() {
  return supabase
    .from('homepage_content')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
}

// ─── Admin helpers ────────────────────────────────────────────────────────────

export async function getAllProducts() {
  return supabase
    .from('products')
    .select('*, categories(*)')
    .order('created_at', { ascending: false });
}

export async function upsertProduct(product: Partial<Product>) {
  return supabase.from('products').upsert(product).select().single();
}

export async function deleteProduct(id: string) {
  return supabase.from('products').delete().eq('id', id);
}

export async function getAllOrders() {
  return supabase
    .from('orders')
    .select('*, order_items(*), user_profiles(full_name, email)')
    .order('created_at', { ascending: false });
}

export async function updateOrderStatus(orderId: string, status: Order['order_status']) {
  return supabase.from('orders').update({ order_status: status }).eq('id', orderId);
}

export async function getCategories() {
  return supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
}

export async function upsertHomepageContent(content: Partial<HomepageContent>) {
  return supabase.from('homepage_content').upsert(content, { onConflict: 'section_key' }).select().single();
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_BUCKET = 'product-images';

export function getStorageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

export async function uploadProductImage(
  file: File,
  folder: 'main' | 'gallery' | 'closeup' | 'technology' | 'lifestyle' | 'hero' | 'banner' | string
): Promise<{ url: string; path: string; error?: string }> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(`.${ext}`, '');
  const path = `${folder}/${safeName}_${timestamp}.${ext}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    return { url: '', path: '', error: error.message };
  }

  const url = getStorageUrl(data.path);
  return { url, path: data.path };
}

export async function deleteStorageImage(path: string): Promise<void> {
  await supabase.storage.from(STORAGE_BUCKET).remove([path]);
}
