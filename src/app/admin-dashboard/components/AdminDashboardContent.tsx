'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,  } from 'recharts';
import { supabase, uploadProductImage, Product, Category, ProductImage } from '@/lib/supabase';

// ─── Sidebar Items ────────────────────────────────────────────────────────────
const sidebarItems = [
  { icon: 'Squares2X2Icon', label: 'Dashboard' },
  { icon: 'ShoppingBagIcon', label: 'Products' },
  { icon: 'TagIcon', label: 'Categories' },
  { icon: 'ClipboardDocumentListIcon', label: 'Orders' },
  { icon: 'UsersIcon', label: 'Customers' },
  { icon: 'ArchiveBoxIcon', label: 'Inventory' },
  { icon: 'BuildingStorefrontIcon', label: 'Warehouses' },
  { icon: 'QrCodeIcon', label: 'Barcodes' },
  { icon: 'TicketIcon', label: 'Coupons' },
  { icon: 'StarIcon', label: 'Reviews' },
  { icon: 'PhotoIcon', label: 'CMS & Banners' },
  { icon: 'ChartBarIcon', label: 'Reports' },
  { icon: 'ShieldCheckIcon', label: 'Roles & Permissions' },
  { icon: 'ClipboardIcon', label: 'Audit Logs' },
  { icon: 'Cog6ToothIcon', label: 'Settings' },
];

// ─── Shared Styles ────────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 rounded-xl border border-border bg-white text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all';
const labelCls = 'block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1';
const thCls = 'text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground';
const tdCls = 'px-4 py-3 text-sm text-foreground';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatPrice = (p: number) => `₹${Number(p).toLocaleString('en-IN')}`;
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const isPositiveMovement = (type: string) => type === 'stock_in' || type === 'returned' || type === 'released';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-blue-50 text-blue-700',
  processing: 'bg-purple-50 text-purple-700',
  shipped: 'bg-indigo-50 text-indigo-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
  returned: 'bg-orange-50 text-orange-700',
  refunded: 'bg-gray-100 text-gray-600',
  active: 'bg-green-50 text-green-700',
  draft: 'bg-yellow-50 text-yellow-700',
  archived: 'bg-gray-100 text-gray-600',
  out_of_stock: 'bg-red-50 text-red-600',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-600',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${statusColors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function EmptyState({ icon, title, desc, action }: { icon: string; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="admin-card p-12 text-center">
      <Icon name={icon as any} size={40} className="text-muted-foreground mx-auto mb-4" />
      <h3 className="font-display font-bold text-lg text-primary mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm mb-5">{desc}</p>
      {action}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Icon name="ArrowPathIcon" size={28} className="text-accent animate-spin" />
    </div>
  );
}

function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="font-display font-bold text-xl text-primary">{title}</h2>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Image Upload Components ──────────────────────────────────────────────────
type UploadFolder = 'main' | 'gallery' | 'closeup' | 'technology' | 'lifestyle' | 'hero' | 'banner';

function SingleImageUpload({ label, value, alt, folder, onUploaded }: {
  label: string; value: string; alt: string; folder: UploadFolder; onUploaded: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setErr('');
    const result = await uploadProductImage(file, folder);
    if (result.error) setErr(result.error); else onUploaded(result.url);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex gap-2 items-start">
        <input className={`${inputCls} flex-1`} value={value} onChange={(e) => onUploaded(e.target.value)} placeholder="https://... or upload" />
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-accent text-accent text-xs font-bold hover:bg-accent/10 transition-colors disabled:opacity-50">
          {uploading ? <Icon name="ArrowPathIcon" size={13} className="animate-spin" /> : <Icon name="ArrowUpTrayIcon" size={13} />}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
      {value && <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden border border-border bg-muted">
        <AppImage src={value} alt={alt || label} width={64} height={64} className="w-full h-full object-cover" />
      </div>}
    </div>
  );
}

function MultiImageUpload({ label, folder, images, onChange }: {
  label: string; folder: UploadFolder; images: ProductImage[]; onChange: (imgs: ProductImage[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []); if (!files.length) return;
    setUploading(true);
    const results = await Promise.all(files.map((f) => uploadProductImage(f, folder)));
    const newImgs: ProductImage[] = results.filter((r) => !r.error && r.url).map((r) => ({ url: r.url, alt: '', label: '' }));
    onChange([...images, ...newImgs]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className={labelCls}>{label}</label>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-accent text-accent text-xs font-bold hover:bg-accent/10 transition-colors disabled:opacity-50">
          {uploading ? <Icon name="ArrowPathIcon" size={12} className="animate-spin" /> : <Icon name="ArrowUpTrayIcon" size={12} />}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      </div>
      {images.length === 0 ? <p className="text-xs text-muted-foreground italic">No images yet.</p> : (
        <div className="flex flex-col gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded-xl border border-border bg-white">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {img.url ? <AppImage src={img.url} alt={img.alt || label} width={40} height={40} className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center"><Icon name="PhotoIcon" size={14} className="text-muted-foreground" /></div>}
              </div>
              <input className={`${inputCls} flex-1 text-xs`} value={img.url} onChange={(e) => onChange(images.map((im, i) => i === idx ? { ...im, url: e.target.value } : im))} placeholder="Image URL" />
              <button type="button" onClick={() => onChange(images.filter((_, i) => i !== idx))}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition-colors flex-shrink-0">
                <Icon name="TrashIcon" size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={() => onChange([...images, { url: '', alt: '', label: '' }])}
        className="mt-2 text-xs text-accent font-semibold flex items-center gap-1 hover:underline">
        <Icon name="PlusIcon" size={12} /> Add URL
      </button>
    </div>
  );
}

// ─── PRODUCTS MODULE ──────────────────────────────────────────────────────────
interface ProductFormData {
  id?: string; name: string; slug: string; sku: string; category_id: string;
  description: string; price: string; sale_price: string; stock_quantity: string;
  product_status: 'active' | 'draft' | 'out_of_stock' | 'archived';
  is_featured: boolean; show_on_homepage: boolean; badge: string;
  main_image_url: string; main_image_alt: string;
  gallery_images: ProductImage[]; closeup_images: ProductImage[];
  technology_images: ProductImage[]; lifestyle_images: ProductImage[];
  features_raw: string; specifications_raw: string; color_variants_raw: string;
}

const emptyProductForm: ProductFormData = {
  name: '', slug: '', sku: '', category_id: '', description: '',
  price: '', sale_price: '', stock_quantity: '', product_status: 'active',
  is_featured: false, show_on_homepage: false, badge: '',
  main_image_url: '', main_image_alt: '',
  gallery_images: [], closeup_images: [], technology_images: [], lifestyle_images: [],
  features_raw: '[]', specifications_raw: '[]', color_variants_raw: '[]',
};

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function ProductFormModal({ product, categories, onClose, onSaved }: {
  product: Partial<ProductFormData> | null; categories: Category[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<ProductFormData>(product ? {
    ...emptyProductForm, ...product,
    price: String((product as any).price ?? ''),
    sale_price: String((product as any).sale_price ?? ''),
    stock_quantity: String((product as any).stock_quantity ?? ''),
    gallery_images: Array.isArray((product as any).gallery_images) ? (product as any).gallery_images : [],
    closeup_images: Array.isArray((product as any).closeup_images) ? (product as any).closeup_images : [],
    technology_images: Array.isArray((product as any).technology_images) ? (product as any).technology_images : [],
    lifestyle_images: Array.isArray((product as any).lifestyle_images) ? (product as any).lifestyle_images : [],
    features_raw: JSON.stringify((product as any).features ?? []),
    specifications_raw: JSON.stringify((product as any).specifications ?? []),
    color_variants_raw: JSON.stringify((product as any).color_variants ?? []),
  } : emptyProductForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: keyof ProductFormData, value: string | boolean) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && !prev.id) updated.slug = toSlug(String(value));
      return updated;
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { setError('Name and price are required.'); return; }
    setSaving(true); setError('');
    try {
      const safeJson = (raw: string, fb: unknown[] = []) => { try { return JSON.parse(raw); } catch { return fb; } };
      const payload = {
        name: form.name, slug: form.slug || toSlug(form.name),
        sku: form.sku || null, category_id: form.category_id || null,
        description: form.description, price: parseFloat(form.price),
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        product_status: form.product_status, is_featured: form.is_featured,
        show_on_homepage: form.show_on_homepage, badge: form.badge || null,
        main_image_url: form.main_image_url || null, main_image_alt: form.main_image_alt || null,
        gallery_images: form.gallery_images, closeup_images: form.closeup_images,
        technology_images: form.technology_images, lifestyle_images: form.lifestyle_images,
        features: safeJson(form.features_raw), specifications: safeJson(form.specifications_raw),
        color_variants: safeJson(form.color_variants_raw),
      };
      if ((form as any).id) {
        const { error: e } = await supabase.from('products').update(payload).eq('id', (form as any).id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from('products').insert(payload);
        if (e) throw e;
      }
      onSaved();
    } catch (e: any) { setError(e.message ?? 'Save failed'); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-primary/40 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-display font-bold text-lg text-primary">{(form as any).id ? 'Edit Product' : 'Add O2 Eardops Product'}</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"><Icon name="XMarkIcon" size={20} /></button>
        </div>
        <div className="p-6 flex flex-col gap-5">
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>Product Name *</label><input className={inputCls} value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="O2 Eardops Pro X1" /></div>
            <div><label className={labelCls}>Slug</label><input className={inputCls} value={form.slug} onChange={(e) => handleChange('slug', e.target.value)} /></div>
            <div><label className={labelCls}>SKU</label><input className={inputCls} value={form.sku} onChange={(e) => handleChange('sku', e.target.value)} placeholder="O2-ED-PRO-X1" /></div>
            <div><label className={labelCls}>Category</label>
              <select className={inputCls} value={form.category_id} onChange={(e) => handleChange('category_id', e.target.value)}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div><label className={labelCls}>Description</label><textarea className={`${inputCls} min-h-[80px] resize-y`} value={form.description} onChange={(e) => handleChange('description', e.target.value)} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelCls}>Price (₹) *</label><input type="number" className={inputCls} value={form.price} onChange={(e) => handleChange('price', e.target.value)} /></div>
            <div><label className={labelCls}>Sale Price (₹)</label><input type="number" className={inputCls} value={form.sale_price} onChange={(e) => handleChange('sale_price', e.target.value)} /></div>
            <div><label className={labelCls}>Stock Qty</label><input type="number" className={inputCls} value={form.stock_quantity} onChange={(e) => handleChange('stock_quantity', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelCls}>Status</label>
              <select className={inputCls} value={form.product_status} onChange={(e) => handleChange('product_status', e.target.value as any)}>
                <option value="active">Active</option><option value="draft">Draft</option>
                <option value="out_of_stock">Out of Stock</option><option value="archived">Archived</option>
              </select>
            </div>
            <div><label className={labelCls}>Badge</label><input className={inputCls} value={form.badge} onChange={(e) => handleChange('badge', e.target.value)} placeholder="Best Seller, New…" /></div>
            <div className="flex flex-col gap-2 pt-5">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_featured} onChange={(e) => handleChange('is_featured', e.target.checked)} className="w-4 h-4 rounded accent-primary" /><span className="text-sm font-medium">Featured</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.show_on_homepage} onChange={(e) => handleChange('show_on_homepage', e.target.checked)} className="w-4 h-4 rounded accent-primary" /><span className="text-sm font-medium">Homepage</span></label>
            </div>
          </div>
          <div className="bg-muted/40 rounded-2xl p-4 flex flex-col gap-4">
            <h3 className="font-display font-bold text-sm text-primary flex items-center gap-2"><Icon name="PhotoIcon" size={16} className="text-accent" />Product Images</h3>
            <SingleImageUpload label="Main Image" value={form.main_image_url} alt={form.main_image_alt} folder="main" onUploaded={(url) => handleChange('main_image_url', url)} />
            <div><label className={labelCls}>Main Image Alt Text</label><input className={inputCls} value={form.main_image_alt} onChange={(e) => handleChange('main_image_alt', e.target.value)} /></div>
            <MultiImageUpload label="Gallery Images" folder="gallery" images={form.gallery_images} onChange={(imgs) => setForm((p) => ({ ...p, gallery_images: imgs }))} />
            <MultiImageUpload label="Close-up Images" folder="closeup" images={form.closeup_images} onChange={(imgs) => setForm((p) => ({ ...p, closeup_images: imgs }))} />
            <MultiImageUpload label="Technology Images" folder="technology" images={form.technology_images} onChange={(imgs) => setForm((p) => ({ ...p, technology_images: imgs }))} />
            <MultiImageUpload label="Lifestyle Images" folder="lifestyle" images={form.lifestyle_images} onChange={(imgs) => setForm((p) => ({ ...p, lifestyle_images: imgs }))} />
          </div>
          <div className="bg-muted/40 rounded-2xl p-4 flex flex-col gap-4">
            <h3 className="font-display font-bold text-sm text-primary flex items-center gap-2"><Icon name="ListBulletIcon" size={16} className="text-accent" />Features, Specs & Variants (JSON)</h3>
            {[{ field: 'features_raw', label: 'Features', ph: '[{"icon":"SpeakerWaveIcon","title":"...","description":"..."}]' },
              { field: 'specifications_raw', label: 'Specifications', ph: '[{"label":"Bluetooth","value":"5.3"}]' },
              { field: 'color_variants_raw', label: 'Color Variants', ph: '[{"label":"Pearl White","color":"#F5F5F5","border":"#E0E0E0"}]' }
            ].map(({ field, label, ph }) => (
              <div key={field}><label className={labelCls}>{label}</label>
                <textarea className={`${inputCls} min-h-[60px] resize-y font-mono text-xs`} value={form[field as keyof ProductFormData] as string} onChange={(e) => handleChange(field as keyof ProductFormData, e.target.value)} placeholder={ph} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
            {saving ? <Icon name="ArrowPathIcon" size={15} className="text-white animate-spin" /> : <Icon name="CheckIcon" size={15} className="text-white" />}
            {saving ? 'Saving…' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ORDERS MODULE ────────────────────────────────────────────────────────────
const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded'];

function OrderDetailModal({ order, onClose, onUpdated }: { order: any; onClose: () => void; onUpdated: () => void }) {
  const [status, setStatus] = useState(order.order_status);
  const [tracking, setTracking] = useState(order.tracking_number ?? '');
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url ?? '');
  const [provider, setProvider] = useState(order.shipping_provider ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('orders').update({ order_status: status, tracking_number: tracking || null, tracking_url: trackingUrl || null, shipping_provider: provider || null, updated_at: new Date().toISOString() }).eq('id', order.id);
    setSaving(false);
    onUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-primary/40 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-lg text-primary">Order #{order.order_number}</h2>
            <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"><Icon name="XMarkIcon" size={20} /></button>
        </div>
        <div className="p-6 flex flex-col gap-5">
          {/* Customer */}
          <div className="bg-muted/40 rounded-2xl p-4">
            <h3 className="font-bold text-sm text-primary mb-3">Customer Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{order.customer_name ?? order.user_profiles?.full_name ?? 'Guest'}</span></div>
              <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{order.customer_email ?? order.user_profiles?.email ?? '—'}</span></div>
              <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{order.customer_phone ?? '—'}</span></div>
              <div><span className="text-muted-foreground">Payment:</span> <StatusBadge status={order.payment_status ?? 'pending'} /></div>
            </div>
          </div>
          {/* Items */}
          {order.order_items?.length > 0 && (
            <div>
              <h3 className="font-bold text-sm text-primary mb-3">Order Items</h3>
              <div className="flex flex-col gap-2">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-white">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.product_image ? <AppImage src={item.product_image} alt={item.product_name} width={40} height={40} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Icon name="ShoppingBagIcon" size={14} className="text-muted-foreground" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-primary line-clamp-1">{item.product_name}</p>
                      {item.variant_label && <p className="text-xs text-muted-foreground">{item.variant_label}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm text-primary">{formatPrice(item.total_price)}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.unit_price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Totals */}
          <div className="bg-muted/40 rounded-2xl p-4">
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : 'Free'}</span></div>
              {order.tax > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tax (GST)</span><span>{formatPrice(order.tax)}</span></div>}
              <div className="flex justify-between font-bold text-base text-primary border-t border-border pt-2 mt-1"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </div>
          {/* Status Update */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>Order Status</label>
              <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Shipping Provider</label><input className={inputCls} value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Delhivery, BlueDart…" /></div>
            <div><label className={labelCls}>Tracking Number</label><input className={inputCls} value={tracking} onChange={(e) => setTracking(e.target.value)} /></div>
            <div><label className={labelCls}>Tracking URL</label><input className={inputCls} value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} /></div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
            {saving ? <Icon name="ArrowPathIcon" size={15} className="text-white animate-spin" /> : <Icon name="CheckIcon" size={15} className="text-white" />}
            {saving ? 'Saving…' : 'Update Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── INVENTORY MODULE ─────────────────────────────────────────────────────────
function StockAdjustModal({ products, warehouses, onClose, onSaved }: {
  products: any[]; warehouses: any[]; onClose: () => void; onSaved: () => void;
}) {
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [movementType, setMovementType] = useState('stock_in');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!productId || !warehouseId || !quantity) { setError('Product, warehouse and quantity are required.'); return; }
    setSaving(true); setError('');
    const { error: e } = await supabase.rpc('update_inventory_stock', {
      p_product_id: productId, p_warehouse_id: warehouseId,
      p_movement_type: movementType, p_quantity: parseInt(quantity),
      p_notes: notes || null,
    });
    if (e) setError(e.message);
    else { onSaved(); onClose(); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-display font-bold text-lg text-primary">Stock Adjustment</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"><Icon name="XMarkIcon" size={20} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
          <div><label className={labelCls}>Product *</label>
            <select className={inputCls} value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Select product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku ?? 'No SKU'})</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Warehouse *</label>
            <select className={inputCls} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
              <option value="">Select warehouse</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Movement Type</label>
            <select className={inputCls} value={movementType} onChange={(e) => setMovementType(e.target.value)}>
              <option value="stock_in">Stock In</option>
              <option value="stock_out">Stock Out</option>
              <option value="adjustment">Adjustment (Set Absolute)</option>
              <option value="returned">Returned</option>
            </select>
          </div>
          <div><label className={labelCls}>Quantity *</label><input type="number" className={inputCls} value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0" /></div>
          <div><label className={labelCls}>Notes</label><textarea className={`${inputCls} min-h-[60px] resize-y`} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
            {saving ? <Icon name="ArrowPathIcon" size={15} className="text-white animate-spin" /> : <Icon name="CheckIcon" size={15} className="text-white" />}
            {saving ? 'Saving…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BARCODE MODULE ───────────────────────────────────────────────────────────
function BarcodeCard({ barcode, onEdit, onDeactivate }: { barcode: any; onEdit: () => void; onDeactivate: () => void }) {
  return (
    <div className="admin-card p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0">
        {barcode.products?.main_image_url ? <AppImage src={barcode.products.main_image_url} alt={barcode.products.name} width={48} height={48} className="w-full h-full object-cover" /> :
          <div className="w-full h-full flex items-center justify-center"><Icon name="QrCodeIcon" size={20} className="text-muted-foreground" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-primary line-clamp-1">{barcode.products?.name ?? '—'}</p>
        <p className="text-xs text-muted-foreground">{barcode.products?.sku ?? '—'}</p>
        <div className="flex items-center gap-2 mt-1">
          <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">{barcode.barcode_value}</code>
          <span className="text-xs text-muted-foreground">{barcode.barcode_format}</span>
          <StatusBadge status={barcode.barcode_status} />
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={onEdit} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-50 text-blue-500 transition-colors" title="Edit"><Icon name="PencilIcon" size={14} /></button>
        <button onClick={onDeactivate} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-400 transition-colors" title="Deactivate"><Icon name="XCircleIcon" size={14} /></button>
      </div>
    </div>
  );
}

// ─── COUPON FORM ──────────────────────────────────────────────────────────────
function CouponFormModal({ coupon, onClose, onSaved }: { coupon: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    code: coupon?.code ?? '', description: coupon?.description ?? '',
    coupon_type: coupon?.coupon_type ?? 'percentage',
    discount_value: String(coupon?.discount_value ?? ''),
    min_order_value: String(coupon?.min_order_value ?? ''),
    max_discount: String(coupon?.max_discount ?? ''),
    start_date: coupon?.start_date ? coupon.start_date.slice(0, 10) : '',
    end_date: coupon?.end_date ? coupon.end_date.slice(0, 10) : '',
    usage_limit: String(coupon?.usage_limit ?? ''),
    per_customer_limit: String(coupon?.per_customer_limit ?? '1'),
    is_active: coupon?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.code || !form.discount_value) { setError('Code and discount value are required.'); return; }
    setSaving(true); setError('');
    const payload = {
      code: form.code.toUpperCase(), description: form.description || null,
      coupon_type: form.coupon_type, discount_value: parseFloat(form.discount_value),
      min_order_value: form.min_order_value ? parseFloat(form.min_order_value) : 0,
      max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
      start_date: form.start_date || null, end_date: form.end_date || null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      per_customer_limit: parseInt(form.per_customer_limit) || 1,
      is_active: form.is_active,
    };
    if (coupon?.id) {
      const { error: e } = await supabase.from('coupons').update(payload).eq('id', coupon.id);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { error: e } = await supabase.from('coupons').insert(payload);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    setSaving(false); onSaved(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-primary/40 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-display font-bold text-lg text-primary">{coupon?.id ? 'Edit Coupon' : 'Create Coupon'}</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"><Icon name="XMarkIcon" size={20} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Coupon Code *</label><input className={`${inputCls} uppercase`} value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="WELCOME10" /></div>
            <div><label className={labelCls}>Type</label>
              <select className={inputCls} value={form.coupon_type} onChange={(e) => setForm((p) => ({ ...p, coupon_type: e.target.value }))}>
                <option value="percentage">Percentage (%)</option><option value="fixed">Fixed (₹)</option>
              </select>
            </div>
            <div><label className={labelCls}>Discount Value *</label><input type="number" className={inputCls} value={form.discount_value} onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))} /></div>
            <div><label className={labelCls}>Min Order (₹)</label><input type="number" className={inputCls} value={form.min_order_value} onChange={(e) => setForm((p) => ({ ...p, min_order_value: e.target.value }))} /></div>
            <div><label className={labelCls}>Max Discount (₹)</label><input type="number" className={inputCls} value={form.max_discount} onChange={(e) => setForm((p) => ({ ...p, max_discount: e.target.value }))} /></div>
            <div><label className={labelCls}>Usage Limit</label><input type="number" className={inputCls} value={form.usage_limit} onChange={(e) => setForm((p) => ({ ...p, usage_limit: e.target.value }))} /></div>
            <div><label className={labelCls}>Start Date</label><input type="date" className={inputCls} value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} /></div>
            <div><label className={labelCls}>End Date</label><input type="date" className={inputCls} value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} /></div>
          </div>
          <div><label className={labelCls}>Description</label><input className={inputCls} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded accent-primary" /><span className="text-sm font-medium">Active</span></label>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
            {saving ? <Icon name="ArrowPathIcon" size={15} className="text-white animate-spin" /> : <Icon name="CheckIcon" size={15} className="text-white" />}
            {saving ? 'Saving…' : 'Save Coupon'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BANNER FORM ──────────────────────────────────────────────────────────────
function BannerFormModal({ banner, onClose, onSaved }: { banner: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: banner?.title ?? '', subtitle: banner?.subtitle ?? '',
    description: banner?.description ?? '', banner_type: banner?.banner_type ?? 'hero',
    image_url: banner?.image_url ?? '', image_alt: banner?.image_alt ?? '',
    cta_text: banner?.cta_text ?? '', cta_url: banner?.cta_url ?? '',
    is_active: banner?.is_active ?? true, sort_order: String(banner?.sort_order ?? '0'),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.title) { setError('Title is required.'); return; }
    setSaving(true); setError('');
    const payload = { ...form, sort_order: parseInt(form.sort_order) || 0 };
    if (banner?.id) {
      const { error: e } = await supabase.from('banners').update(payload).eq('id', banner.id);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { error: e } = await supabase.from('banners').insert(payload);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    setSaving(false); onSaved(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-primary/40 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-display font-bold text-lg text-primary">{banner?.id ? 'Edit Banner' : 'Create Banner'}</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"><Icon name="XMarkIcon" size={20} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className={labelCls}>Title *</label><input className={inputCls} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
            <div><label className={labelCls}>Subtitle</label><input className={inputCls} value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} /></div>
            <div><label className={labelCls}>Type</label>
              <select className={inputCls} value={form.banner_type} onChange={(e) => setForm((p) => ({ ...p, banner_type: e.target.value }))}>
                <option value="hero">Hero</option><option value="product">Product</option>
                <option value="promotional">Promotional</option><option value="featured">Featured</option>
              </select>
            </div>
            <div><label className={labelCls}>CTA Text</label><input className={inputCls} value={form.cta_text} onChange={(e) => setForm((p) => ({ ...p, cta_text: e.target.value }))} placeholder="Shop Now" /></div>
            <div><label className={labelCls}>CTA URL</label><input className={inputCls} value={form.cta_url} onChange={(e) => setForm((p) => ({ ...p, cta_url: e.target.value }))} placeholder="/shop" /></div>
            <div><label className={labelCls}>Sort Order</label><input type="number" className={inputCls} value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} /></div>
            <div className="flex items-center gap-2 pt-5"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded accent-primary" /><span className="text-sm font-medium">Active</span></label></div>
          </div>
          <div><label className={labelCls}>Description</label><textarea className={`${inputCls} min-h-[60px] resize-y`} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
          <SingleImageUpload label="Banner Image" value={form.image_url} alt={form.image_alt} folder="banner" onUploaded={(url) => setForm((p) => ({ ...p, image_url: url }))} />
          <div><label className={labelCls}>Image Alt Text</label><input className={inputCls} value={form.image_alt} onChange={(e) => setForm((p) => ({ ...p, image_alt: e.target.value }))} /></div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
            {saving ? <Icon name="ArrowPathIcon" size={15} className="text-white animate-spin" /> : <Icon name="CheckIcon" size={15} className="text-white" />}
            {saving ? 'Saving…' : 'Save Banner'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WAREHOUSE FORM ───────────────────────────────────────────────────────────
function WarehouseFormModal({ warehouse, onClose, onSaved }: { warehouse: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: warehouse?.name ?? '', code: warehouse?.code ?? '',
    address_line1: warehouse?.address_line1 ?? '', city: warehouse?.city ?? '',
    state: warehouse?.state ?? '', pincode: warehouse?.pincode ?? '',
    contact_name: warehouse?.contact_name ?? '', contact_phone: warehouse?.contact_phone ?? '',
    contact_email: warehouse?.contact_email ?? '', is_active: warehouse?.is_active ?? true,
    is_default: warehouse?.is_default ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.name || !form.code) { setError('Name and code are required.'); return; }
    setSaving(true); setError('');
    if (warehouse?.id) {
      const { error: e } = await supabase.from('warehouses').update(form).eq('id', warehouse.id);
      if (e) { setError(e.message); setSaving(false); return; }
    } else {
      const { error: e } = await supabase.from('warehouses').insert(form);
      if (e) { setError(e.message); setSaving(false); return; }
    }
    setSaving(false); onSaved(); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-display font-bold text-lg text-primary">{warehouse?.id ? 'Edit Warehouse' : 'Add Warehouse'}</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"><Icon name="XMarkIcon" size={20} /></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Name *</label><input className={inputCls} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div><label className={labelCls}>Code *</label><input className={`${inputCls} uppercase`} value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="WH-MAIN" /></div>
            <div className="col-span-2"><label className={labelCls}>Address</label><input className={inputCls} value={form.address_line1} onChange={(e) => setForm((p) => ({ ...p, address_line1: e.target.value }))} /></div>
            <div><label className={labelCls}>City</label><input className={inputCls} value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></div>
            <div><label className={labelCls}>State</label><input className={inputCls} value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} /></div>
            <div><label className={labelCls}>Pincode</label><input className={inputCls} value={form.pincode} onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))} /></div>
            <div><label className={labelCls}>Contact Name</label><input className={inputCls} value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))} /></div>
            <div><label className={labelCls}>Contact Phone</label><input className={inputCls} value={form.contact_phone} onChange={(e) => setForm((p) => ({ ...p, contact_phone: e.target.value }))} /></div>
            <div><label className={labelCls}>Contact Email</label><input className={inputCls} value={form.contact_email} onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))} /></div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded accent-primary" /><span className="text-sm font-medium">Active</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_default} onChange={(e) => setForm((p) => ({ ...p, is_default: e.target.checked }))} className="w-4 h-4 rounded accent-primary" /><span className="text-sm font-medium">Default</span></label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
            {saving ? <Icon name="ArrowPathIcon" size={15} className="text-white animate-spin" /> : <Icon name="CheckIcon" size={15} className="text-white" />}
            {saving ? 'Saving…' : 'Save Warehouse'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminDashboardContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [barcodes, setBarcodes] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState({ revenue: 0, orders: 0, customers: 0, lowStock: 0 });
  const [revenueData, setRevenueData] = useState<any[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; table: string } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any | null>(null);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [editingBarcode, setEditingBarcode] = useState<any | null>(null);
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [reviewFilter, setReviewFilter] = useState('');
  const [reportRange, setReportRange] = useState('30');
  const [reportData, setReportData] = useState<any>(null);
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);

  // ── Data Loaders ──────────────────────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    const [ordersRes, customersRes, productsRes] = await Promise.all([
      supabase.from('orders').select('total, created_at').order('created_at', { ascending: false }),
      supabase.from('user_profiles').select('id').eq('role', 'customer'),
      supabase.from('products').select('id, stock_quantity').lt('stock_quantity', 10),
    ]);
    const totalRevenue = (ordersRes.data ?? []).reduce((s: number, o: any) => s + Number(o.total), 0);
    setDashboardStats({
      revenue: totalRevenue,
      orders: ordersRes.data?.length ?? 0,
      customers: customersRes.data?.length ?? 0,
      lowStock: productsRes.data?.length ?? 0,
    });
    // Build monthly revenue data
    const monthMap: Record<string, number> = {};
    (ordersRes.data ?? []).forEach((o: any) => {
      const month = new Date(o.created_at).toLocaleString('en-IN', { month: 'short' });
      monthMap[month] = (monthMap[month] ?? 0) + Number(o.total);
    });
    setRevenueData(Object.entries(monthMap).slice(-6).map(([month, revenue]) => ({ month, revenue })));
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*, categories(*)').order('created_at', { ascending: false });
    if (data) setProducts(data as Product[]);
    setLoading(false);
  }, []);

  const loadCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    if (data) setCategories(data as Category[]);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('orders').select('*, order_items(*), user_profiles(full_name, email)').order('created_at', { ascending: false }).limit(100);
    if (orderStatusFilter) query = query.eq('order_status', orderStatusFilter);
    if (orderSearch) query = query.ilike('order_number', `%${orderSearch}%`);
    const { data } = await query;
    if (data) setOrders(data);
    setLoading(false);
  }, [orderStatusFilter, orderSearch]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('user_profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false });
    if (data) setCustomers(data);
    setLoading(false);
  }, []);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    const [invRes, movRes] = await Promise.all([
      supabase.from('inventory').select('*, products(name, sku, main_image_url), warehouses(name)').order('updated_at', { ascending: false }),
      supabase.from('inventory_movements').select('*, products(name, sku), warehouses(name)').order('created_at', { ascending: false }).limit(50),
    ]);
    if (invRes.data) setInventory(invRes.data);
    if (movRes.data) setInventoryMovements(movRes.data);
    setLoading(false);
  }, []);

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('warehouses').select('*').order('created_at');
    if (data) setWarehouses(data);
    setLoading(false);
  }, []);

  const loadBarcodes = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('barcodes').select('*, products(name, sku, main_image_url)').order('created_at', { ascending: false });
    if (barcodeSearch) query = query.or(`barcode_value.ilike.%${barcodeSearch}%,products.name.ilike.%${barcodeSearch}%`);
    const { data } = await query;
    if (data) setBarcodes(data);
    setLoading(false);
  }, [barcodeSearch]);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (data) setCoupons(data);
    setLoading(false);
  }, []);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('reviews').select('*, products(name)').order('created_at', { ascending: false });
    if (reviewFilter) query = query.eq('review_status', reviewFilter);
    const { data } = await query;
    if (data) setReviews(data);
    setLoading(false);
  }, [reviewFilter]);

  const loadBanners = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('banners').select('*').order('sort_order');
    if (data) setBanners(data);
    setLoading(false);
  }, []);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    const [rolesRes, permsRes, rpRes] = await Promise.all([
      supabase.from('roles').select('*').order('name'),
      supabase.from('permissions').select('*').order('module, action'),
      supabase.from('role_permissions').select('*'),
    ]);
    if (rolesRes.data) setRoles(rolesRes.data);
    if (permsRes.data) setPermissions(permsRes.data);
    if (rpRes.data) setRolePermissions(rpRes.data);
    setLoading(false);
  }, []);

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (data) setAuditLogs(data);
    setLoading(false);
  }, []);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('settings').select('*').order('setting_group, setting_key');
    if (data) {
      setSettings(data);
      const form: Record<string, string> = {};
      data.forEach((s: any) => { form[s.setting_key] = typeof s.setting_value === 'string' ? s.setting_value.replace(/^"|"$/g, '') : String(s.setting_value ?? ''); });
      setSettingsForm(form);
    }
    setLoading(false);
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    const days = parseInt(reportRange);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const [ordersRes, itemsRes, productsRes] = await Promise.all([
      supabase.from('orders').select('total, discount, order_status, created_at').gte('created_at', since),
      supabase.from('order_items').select('product_name, quantity, total_price, created_at').gte('created_at', since),
      supabase.from('products').select('name, stock_quantity').lt('stock_quantity', 10),
    ]);
    const orders = ordersRes.data ?? [];
    const items = itemsRes.data ?? [];
    const totalRevenue = orders.reduce((s: number, o: any) => s + Number(o.total), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const delivered = orders.filter((o: any) => o.order_status === 'delivered').length;
    const cancelled = orders.filter((o: any) => o.order_status === 'cancelled').length;
    const returned = orders.filter((o: any) => ['returned', 'refunded'].includes(o.order_status)).length;
    // Best sellers
    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    items.forEach((item: any) => {
      if (!productSales[item.product_name]) productSales[item.product_name] = { name: item.product_name, qty: 0, revenue: 0 };
      productSales[item.product_name].qty += item.quantity;
      productSales[item.product_name].revenue += Number(item.total_price);
    });
    const bestSellers = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5);
    setReportData({ totalRevenue, totalOrders, avgOrderValue, delivered, cancelled, returned, bestSellers, lowStock: productsRes.data ?? [] });
    setLoading(false);
  }, [reportRange]);

  useEffect(() => {
    loadCategories();
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeNav === 'Products') loadProducts();
    else if (activeNav === 'Orders') loadOrders();
    else if (activeNav === 'Customers') loadCustomers();
    else if (activeNav === 'Inventory') loadInventory();
    else if (activeNav === 'Warehouses') loadWarehouses();
    else if (activeNav === 'Barcodes') loadBarcodes();
    else if (activeNav === 'Coupons') loadCoupons();
    else if (activeNav === 'Reviews') loadReviews();
    else if (activeNav === 'CMS & Banners') loadBanners();
    else if (activeNav === 'Roles & Permissions') loadRoles();
    else if (activeNav === 'Audit Logs') loadAuditLogs();
    else if (activeNav === 'Settings') loadSettings();
    else if (activeNav === 'Reports') loadReports();
  }, [activeNav]);

  useEffect(() => { if (activeNav === 'Orders') loadOrders(); }, [orderStatusFilter, orderSearch]);
  useEffect(() => { if (activeNav === 'Reviews') loadReviews(); }, [reviewFilter]);
  useEffect(() => { if (activeNav === 'Barcodes') loadBarcodes(); }, [barcodeSearch]);
  useEffect(() => { if (activeNav === 'Reports') loadReports(); }, [reportRange]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await supabase.from(deleteConfirm.table).delete().eq('id', deleteConfirm.id);
    setDeleteConfirm(null);
    if (deleteConfirm.table === 'products') loadProducts();
    else if (deleteConfirm.table === 'categories') loadCategories();
    else if (deleteConfirm.table === 'coupons') loadCoupons();
    else if (deleteConfirm.table === 'banners') loadBanners();
    else if (deleteConfirm.table === 'warehouses') loadWarehouses();
    else if (deleteConfirm.table === 'barcodes') loadBarcodes();
  };

  const handleReviewAction = async (id: string, action: 'approved' | 'rejected' | 'delete') => {
    if (action === 'delete') {
      await supabase.from('reviews').delete().eq('id', id);
    } else {
      await supabase.from('reviews').update({ review_status: action }).eq('id', id);
    }
    loadReviews();
  };

  const handleGenerateBarcode = async (productId: string) => {
    const { data, error } = await supabase.rpc('generate_barcode_value', { p_format: 'EAN13' });
    if (!error && data) {
      await supabase.from('barcodes').insert({ product_id: productId, barcode_value: data, barcode_format: 'EAN13', barcode_status: 'active' });
      loadBarcodes();
    }
  };

  const handleDeactivateBarcode = async (id: string) => {
    await supabase.from('barcodes').update({ barcode_status: 'inactive' }).eq('id', id);
    loadBarcodes();
  };

  const handleToggleRolePermission = async (roleId: string, permId: string, hasIt: boolean) => {
    if (hasIt) {
      await supabase.from('role_permissions').delete().eq('role_id', roleId).eq('permission_id', permId);
    } else {
      await supabase.from('role_permissions').insert({ role_id: roleId, permission_id: permId });
    }
    loadRoles();
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    await Promise.all(Object.entries(settingsForm).map(([key, value]) =>
      supabase.from('settings').update({ setting_value: JSON.stringify(value), updated_at: new Date().toISOString() }).eq('setting_key', key)
    ));
    setSettingsSaving(false);
  };

  const handleToggleCustomerStatus = async (id: string, current: boolean) => {
    await supabase.from('user_profiles').update({ is_active: !current }).eq('id', id);
    loadCustomers();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && <div className="fixed inset-0 bg-primary/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 overflow-y-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <AppLogo size={36} />
          <div>
            <span className="font-display font-bold text-base text-white">O2 Gears</span>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Admin Panel</p>
          </div>
          <button className="ml-auto lg:hidden text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}><Icon name="XMarkIcon" size={18} /></button>
        </div>
        <nav className="px-3 py-4 flex flex-col gap-0.5">
          {sidebarItems.map((item) => (
            <button key={item.label} onClick={() => { setActiveNav(item.label); setSidebarOpen(false); }}
              className={`sidebar-link ${activeNav === item.label ? 'active' : ''}`}>
              <Icon name={item.icon as any} size={17} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 mt-auto border-t border-white/10">
          <Link href="/" className="sidebar-link"><Icon name="ArrowLeftOnRectangleIcon" size={17} /><span>Back to Store</span></Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-border px-4 sm:px-6 h-16 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors" onClick={() => setSidebarOpen(true)}>
              <Icon name="Bars3Icon" size={20} className="text-foreground" />
            </button>
            <div>
              <h1 className="font-display font-bold text-base text-primary">{activeNav}</h1>
              <p className="text-xs text-muted-foreground">O2 Gears Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">A</div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-primary">Admin</p>
                <p className="text-[10px] text-muted-foreground">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">

          {/* ── DASHBOARD ── */}
          {activeNav === 'Dashboard' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Revenue', value: formatPrice(dashboardStats.revenue), icon: 'BanknotesIcon', color: 'bg-blue-50', iconColor: 'text-blue-600' },
                  { label: 'Total Orders', value: String(dashboardStats.orders), icon: 'ShoppingCartIcon', color: 'bg-green-50', iconColor: 'text-green-600' },
                  { label: 'Customers', value: String(dashboardStats.customers), icon: 'UsersIcon', color: 'bg-purple-50', iconColor: 'text-purple-600' },
                  { label: 'Low Stock Items', value: String(dashboardStats.lowStock), icon: 'ExclamationTriangleIcon', color: 'bg-red-50', iconColor: 'text-red-500' },
                ].map((card) => (
                  <div key={card.label} className="admin-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl ${card.color} flex items-center justify-center`}>
                        <Icon name={card.icon as any} size={22} className={card.iconColor} />
                      </div>
                    </div>
                    <p className="font-display font-bold text-2xl text-primary">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">{card.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
                <div className="xl:col-span-2 admin-card p-5">
                  <h3 className="font-display font-bold text-base text-primary mb-4">Revenue Overview</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0D1B4B" stopOpacity={0.15} /><stop offset="95%" stopColor="#0D1B4B" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8F4FD" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#5A7A9A' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#5A7A9A' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E8F4FD', fontSize: 12 }} formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#0D1B4B" strokeWidth={2.5} fill="url(#rg)" dot={{ fill: '#0D1B4B', r: 4 }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="admin-card p-5">
                  <h3 className="font-display font-bold text-base text-primary mb-4">Quick Actions</h3>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setActiveNav('Products'); setTimeout(() => { setEditingProduct(null); setShowProductForm(true); }, 100); }} className="btn-primary px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 w-full justify-center"><Icon name="PlusIcon" size={15} className="text-white" />Add Product</button>
                    <button onClick={() => setActiveNav('Orders')} className="btn-secondary-o2 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 w-full justify-center"><Icon name="ClipboardDocumentListIcon" size={15} />View Orders</button>
                    <button onClick={() => { setActiveNav('Inventory'); setTimeout(() => setShowStockModal(true), 100); }} className="btn-secondary-o2 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 w-full justify-center"><Icon name="ArchiveBoxIcon" size={15} />Adjust Stock</button>
                    <button onClick={() => setActiveNav('CMS & Banners')} className="btn-secondary-o2 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 w-full justify-center"><Icon name="PhotoIcon" size={15} />Manage Banners</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── PRODUCTS ── */}
          {activeNav === 'Products' && (
            <div>
              <PageHeader title="O2 Eardops Products" desc={`${products.length} products`}
                action={<button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"><Icon name="PlusIcon" size={15} className="text-white" />Add Product</button>} />
              {loading ? <LoadingSpinner /> : products.length === 0 ? (
                <EmptyState icon="ShoppingBagIcon" title="No products yet" desc="Add your first O2 Eardops product."
                  action={<button onClick={() => { setEditingProduct(null); setShowProductForm(true); }} className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2"><Icon name="PlusIcon" size={15} className="text-white" />Add First Product</button>} />
              ) : (
                <div className="admin-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-border bg-muted/50">
                        <th className={thCls}>Product</th><th className={`${thCls} hidden sm:table-cell`}>Category</th>
                        <th className={thCls}>Price</th><th className={`${thCls} hidden md:table-cell`}>Stock</th>
                        <th className={thCls}>Status</th><th className={`${thCls} hidden lg:table-cell`}>Homepage</th><th className={thCls} />
                      </tr></thead>
                      <tbody>
                        {products.map((p, i) => (
                          <tr key={p.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${i === products.length - 1 ? 'border-0' : ''}`}>
                            <td className={tdCls}>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                                  {p.main_image_url ? <AppImage src={p.main_image_url} alt={p.main_image_alt ?? p.name} width={40} height={40} className="w-full h-full object-cover" /> :
                                    <div className="w-full h-full flex items-center justify-center"><Icon name="PhotoIcon" size={16} className="text-muted-foreground" /></div>}
                                </div>
                                <div><p className="font-semibold text-sm text-primary line-clamp-1">{p.name}</p><p className="text-xs text-muted-foreground">{p.sku}</p></div>
                              </div>
                            </td>
                            <td className={`${tdCls} hidden sm:table-cell`}><span className="text-xs text-muted-foreground">{(p as any).categories?.name ?? '—'}</span></td>
                            <td className={tdCls}><p className="font-bold text-sm text-primary">{formatPrice(p.sale_price ?? p.price)}</p>{p.sale_price && <p className="price-original text-xs">{formatPrice(p.price)}</p>}</td>
                            <td className={`${tdCls} hidden md:table-cell`}><span className={`text-xs font-bold ${p.stock_quantity <= 10 ? 'text-red-500' : 'text-green-600'}`}>{p.stock_quantity}</span></td>
                            <td className={tdCls}><StatusBadge status={p.product_status} /></td>
                            <td className={`${tdCls} hidden lg:table-cell`}><span className={`text-xs font-bold ${p.show_on_homepage ? 'text-accent' : 'text-muted-foreground'}`}>{p.show_on_homepage ? '✓ Yes' : '—'}</span></td>
                            <td className={tdCls}>
                              <div className="flex items-center gap-1">
                                <button onClick={() => { setEditingProduct(p); setShowProductForm(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-50 text-blue-500 transition-colors"><Icon name="PencilIcon" size={14} /></button>
                                <button onClick={() => setDeleteConfirm({ id: p.id, table: 'products' })} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-400 transition-colors"><Icon name="TrashIcon" size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CATEGORIES ── */}
          {activeNav === 'Categories' && (
            <div>
              <PageHeader title="Categories" desc={`${categories.length} categories`}
                action={<button onClick={async () => {
                  const name = prompt('Category name:');
                  if (!name) return;
                  const slug = toSlug(name);
                  await supabase.from('categories').insert({ name, slug, is_active: true, sort_order: categories.length });
                  loadCategories();
                }} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"><Icon name="PlusIcon" size={15} className="text-white" />Add Category</button>} />
              {categories.length === 0 ? <EmptyState icon="TagIcon" title="No categories" desc="Add product categories to organise your O2 Eardops range." /> : (
                <div className="admin-card overflow-hidden">
                  <table className="w-full">
                    <thead><tr className="border-b border-border bg-muted/50">
                      <th className={thCls}>Name</th><th className={thCls}>Slug</th>
                      <th className={thCls}>Status</th><th className={thCls}>Sort</th><th className={thCls} />
                    </tr></thead>
                    <tbody>
                      {categories.map((c, i) => (
                        <tr key={c.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${i === categories.length - 1 ? 'border-0' : ''}`}>
                          <td className={tdCls}><span className="font-semibold text-primary">{c.name}</span></td>
                          <td className={tdCls}><code className="text-xs bg-muted px-2 py-0.5 rounded">{c.slug}</code></td>
                          <td className={tdCls}><StatusBadge status={c.is_active ? 'active' : 'archived'} /></td>
                          <td className={tdCls}><span className="text-xs text-muted-foreground">{c.sort_order}</span></td>
                          <td className={tdCls}>
                            <div className="flex items-center gap-1">
                              <button onClick={async () => {
                                const name = prompt('New name:', c.name);
                                if (!name) return;
                                await supabase.from('categories').update({ name, slug: toSlug(name) }).eq('id', c.id);
                                loadCategories();
                              }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-50 text-blue-500 transition-colors"><Icon name="PencilIcon" size={14} /></button>
                              <button onClick={() => setDeleteConfirm({ id: c.id, table: 'categories' })} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-400 transition-colors"><Icon name="TrashIcon" size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── ORDERS ── */}
          {activeNav === 'Orders' && (
            <div>
              <PageHeader title="Orders" desc={`${orders.length} orders`} />
              <div className="flex flex-wrap gap-3 mb-4">
                <input className={`${inputCls} max-w-xs`} placeholder="Search order #…" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} />
                <select className={`${inputCls} max-w-[180px]`} value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              {loading ? <LoadingSpinner /> : orders.length === 0 ? <EmptyState icon="ClipboardDocumentListIcon" title="No orders" desc="Orders will appear here once customers start purchasing." /> : (
                <div className="admin-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-border bg-muted/50">
                        <th className={thCls}>Order #</th><th className={`${thCls} hidden sm:table-cell`}>Customer</th>
                        <th className={thCls}>Total</th><th className={thCls}>Status</th>
                        <th className={`${thCls} hidden md:table-cell`}>Payment</th>
                        <th className={`${thCls} hidden lg:table-cell`}>Date</th><th className={thCls} />
                      </tr></thead>
                      <tbody>
                        {orders.map((order, i) => (
                          <tr key={order.id} className={`border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${i === orders.length - 1 ? 'border-0' : ''}`} onClick={() => setSelectedOrder(order)}>
                            <td className={tdCls}><span className="font-mono text-xs font-semibold text-primary">{order.order_number}</span></td>
                            <td className={`${tdCls} hidden sm:table-cell`}>{order.customer_name ?? order.user_profiles?.full_name ?? 'Guest'}</td>
                            <td className={tdCls}><span className="font-bold text-primary">{formatPrice(order.total)}</span></td>
                            <td className={tdCls}><StatusBadge status={order.order_status} /></td>
                            <td className={`${tdCls} hidden md:table-cell`}><StatusBadge status={order.payment_status ?? 'pending'} /></td>
                            <td className={`${tdCls} hidden lg:table-cell text-xs text-muted-foreground`}>{formatDate(order.created_at)}</td>
                            <td className={tdCls}><Icon name="ChevronRightIcon" size={16} className="text-muted-foreground" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CUSTOMERS ── */}
          {activeNav === 'Customers' && (
            <div>
              <PageHeader title="Customers" desc={`${customers.length} registered customers`} />
              {loading ? <LoadingSpinner /> : customers.length === 0 ? <EmptyState icon="UsersIcon" title="No customers yet" desc="Customer accounts will appear here after registration." /> : (
                <div className="admin-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-border bg-muted/50">
                        <th className={thCls}>Customer</th><th className={`${thCls} hidden sm:table-cell`}>Phone</th>
                        <th className={`${thCls} hidden md:table-cell`}>Orders</th><th className={`${thCls} hidden lg:table-cell`}>Spent</th>
                        <th className={thCls}>Status</th><th className={thCls} />
                      </tr></thead>
                      <tbody>
                        {customers.map((c, i) => (
                          <tr key={c.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${i === customers.length - 1 ? 'border-0' : ''}`}>
                            <td className={tdCls}>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold text-primary">{c.full_name?.[0]?.toUpperCase() ?? 'U'}</span></div>
                                <div><p className="font-semibold text-sm text-primary">{c.full_name}</p><p className="text-xs text-muted-foreground">{c.email}</p></div>
                              </div>
                            </td>
                            <td className={`${tdCls} hidden sm:table-cell text-xs text-muted-foreground`}>{c.phone ?? '—'}</td>
                            <td className={`${tdCls} hidden md:table-cell`}><span className="font-semibold text-sm">{c.total_orders ?? 0}</span></td>
                            <td className={`${tdCls} hidden lg:table-cell`}><span className="font-semibold text-sm text-primary">{formatPrice(c.total_spent ?? 0)}</span></td>
                            <td className={tdCls}><StatusBadge status={c.is_active ? 'active' : 'archived'} /></td>
                            <td className={tdCls}>
                              <button onClick={() => handleToggleCustomerStatus(c.id, c.is_active)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${c.is_active ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                                {c.is_active ? 'Disable' : 'Enable'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── INVENTORY ── */}
          {activeNav === 'Inventory' && (
            <div>
              <PageHeader title="Inventory" desc="Stock levels across all warehouses"
                action={<button onClick={() => setShowStockModal(true)} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"><Icon name="PlusIcon" size={15} className="text-white" />Adjust Stock</button>} />
              {loading ? <LoadingSpinner /> : (
                <>
                  <div className="admin-card overflow-hidden mb-5">
                    <div className="px-4 py-3 border-b border-border bg-muted/50"><h3 className="font-bold text-sm text-primary">Current Stock Levels</h3></div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead><tr className="border-b border-border bg-muted/30">
                          <th className={thCls}>Product</th><th className={thCls}>Warehouse</th>
                          <th className={thCls}>Current</th><th className={thCls}>Reserved</th>
                          <th className={thCls}>Available</th><th className={thCls}>Threshold</th><th className={thCls}>Status</th>
                        </tr></thead>
                        <tbody>
                          {inventory.map((inv, i) => (
                            <tr key={inv.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${i === inventory.length - 1 ? 'border-0' : ''}`}>
                              <td className={tdCls}>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                    {inv.products?.main_image_url ? <AppImage src={inv.products.main_image_url} alt={inv.products.name} width={32} height={32} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Icon name="ShoppingBagIcon" size={12} className="text-muted-foreground" /></div>}
                                  </div>
                                  <div><p className="font-semibold text-xs text-primary">{inv.products?.name}</p><p className="text-[10px] text-muted-foreground">{inv.products?.sku}</p></div>
                                </div>
                              </td>
                              <td className={tdCls}><span className="text-xs">{inv.warehouses?.name ?? '—'}</span></td>
                              <td className={tdCls}><span className="font-bold text-sm">{inv.current_stock}</span></td>
                              <td className={tdCls}><span className="text-sm text-orange-600">{inv.reserved_stock}</span></td>
                              <td className={tdCls}><span className={`font-bold text-sm ${inv.available_stock <= inv.low_stock_threshold ? 'text-red-500' : 'text-green-600'}`}>{inv.available_stock}</span></td>
                              <td className={tdCls}><span className="text-xs text-muted-foreground">{inv.low_stock_threshold}</span></td>
                              <td className={tdCls}><StatusBadge status={inv.available_stock === 0 ? 'out_of_stock' : inv.available_stock <= inv.low_stock_threshold ? 'draft' : 'active'} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="admin-card overflow-hidden">
                    <div className="px-4 py-3 border-b border-border bg-muted/50"><h3 className="font-bold text-sm text-primary">Recent Movements</h3></div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead><tr className="border-b border-border bg-muted/30">
                          <th className={thCls}>Product</th><th className={thCls}>Type</th>
                          <th className={thCls}>Qty</th><th className={`${thCls} hidden md:table-cell`}>Before → After</th>
                          <th className={`${thCls} hidden lg:table-cell`}>Notes</th><th className={thCls}>Date</th>
                        </tr></thead>
                        <tbody>
                          {inventoryMovements.map((m, i) => (
                            <tr key={m.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${i === inventoryMovements.length - 1 ? 'border-0' : ''}`}>
                              <td className={tdCls}><span className="font-semibold text-xs text-primary">{m.products?.name}</span></td>
                              <td className={tdCls}><StatusBadge status={m.movement_type} /></td>
                              <td className={tdCls}><span className={`font-bold text-sm ${isPositiveMovement(m.movement_type) ? 'text-green-600' : 'text-red-500'}`}>{isPositiveMovement(m.movement_type) ? '+' : '-'}{m.quantity}</span></td>
                              <td className={`${tdCls} hidden md:table-cell text-xs text-muted-foreground`}>{m.quantity_before} → {m.quantity_after}</td>
                              <td className={`${tdCls} hidden lg:table-cell text-xs text-muted-foreground`}>{m.notes ?? '—'}</td>
                              <td className={`${tdCls} text-xs text-muted-foreground`}>{formatDate(m.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── WAREHOUSES ── */}
          {activeNav === 'Warehouses' && (
            <div>
              <PageHeader title="Warehouses" desc={`${warehouses.length} warehouses`}
                action={<button onClick={() => { setEditingWarehouse(null); setShowWarehouseForm(true); }} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"><Icon name="PlusIcon" size={15} className="text-white" />Add Warehouse</button>} />
              {loading ? <LoadingSpinner /> : warehouses.length === 0 ? <EmptyState icon="BuildingStorefrontIcon" title="No warehouses" desc="Add your first warehouse to start tracking inventory." /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {warehouses.map((w) => (
                    <div key={w.id} className="admin-card p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display font-bold text-base text-primary">{w.name}</h3>
                            {w.is_default && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent">Default</span>}
                          </div>
                          <code className="text-xs bg-muted px-2 py-0.5 rounded">{w.code}</code>
                        </div>
                        <StatusBadge status={w.is_active ? 'active' : 'archived'} />
                      </div>
                      {(w.city || w.state) && <p className="text-xs text-muted-foreground mb-2">{[w.address_line1, w.city, w.state, w.pincode].filter(Boolean).join(', ')}</p>}
                      {w.contact_name && <p className="text-xs text-muted-foreground">{w.contact_name} · {w.contact_phone}</p>}
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => { setEditingWarehouse(w); setShowWarehouseForm(true); }} className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors">Edit</button>
                        <button onClick={() => setDeleteConfirm({ id: w.id, table: 'warehouses' })} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-50 text-red-400 transition-colors"><Icon name="TrashIcon" size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── BARCODES ── */}
          {activeNav === 'Barcodes' && (
            <div>
              <PageHeader title="Barcodes" desc="EAN-13, UPC-A and Code 128 barcode management"
                action={<button onClick={async () => {
                  if (products.length === 0) await loadProducts();
                  const pid = prompt('Enter Product ID to generate barcode:');
                  if (pid) handleGenerateBarcode(pid);
                }} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"><Icon name="PlusIcon" size={15} className="text-white" />Generate Barcode</button>} />
              <div className="mb-4">
                <input className={`${inputCls} max-w-sm`} placeholder="Search by barcode, product name or SKU…" value={barcodeSearch} onChange={(e) => setBarcodeSearch(e.target.value)} />
              </div>
              {loading ? <LoadingSpinner /> : barcodes.length === 0 ? <EmptyState icon="QrCodeIcon" title="No barcodes" desc="Generate barcodes for your O2 Eardops products." /> : (
                <div className="flex flex-col gap-3">
                  {barcodes.map((b) => (
                    <BarcodeCard key={b.id} barcode={b}
                      onEdit={() => setEditingBarcode(b)}
                      onDeactivate={() => handleDeactivateBarcode(b.id)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── COUPONS ── */}
          {activeNav === 'Coupons' && (
            <div>
              <PageHeader title="Coupons & Discounts" desc={`${coupons.length} coupons`}
                action={<button onClick={() => { setEditingCoupon(null); setShowCouponForm(true); }} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"><Icon name="PlusIcon" size={15} className="text-white" />Create Coupon</button>} />
              {loading ? <LoadingSpinner /> : coupons.length === 0 ? <EmptyState icon="TicketIcon" title="No coupons" desc="Create discount coupons for your customers." /> : (
                <div className="admin-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-border bg-muted/50">
                        <th className={thCls}>Code</th><th className={thCls}>Type</th><th className={thCls}>Value</th>
                        <th className={`${thCls} hidden sm:table-cell`}>Min Order</th><th className={`${thCls} hidden md:table-cell`}>Usage</th>
                        <th className={`${thCls} hidden lg:table-cell`}>Expires</th><th className={thCls}>Status</th><th className={thCls} />
                      </tr></thead>
                      <tbody>
                        {coupons.map((c, i) => (
                          <tr key={c.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${i === coupons.length - 1 ? 'border-0' : ''}`}>
                            <td className={tdCls}><code className="font-mono font-bold text-sm text-primary bg-muted px-2 py-0.5 rounded">{c.code}</code></td>
                            <td className={tdCls}><span className="text-xs capitalize">{c.coupon_type}</span></td>
                            <td className={tdCls}><span className="font-bold text-sm text-primary">{c.coupon_type === 'percentage' ? `${c.discount_value}%` : formatPrice(c.discount_value)}</span></td>
                            <td className={`${tdCls} hidden sm:table-cell text-xs text-muted-foreground`}>{c.min_order_value > 0 ? formatPrice(c.min_order_value) : '—'}</td>
                            <td className={`${tdCls} hidden md:table-cell text-xs`}>{c.usage_count ?? 0}{c.usage_limit ? ` / ${c.usage_limit}` : ''}</td>
                            <td className={`${tdCls} hidden lg:table-cell text-xs text-muted-foreground`}>{c.end_date ? formatDate(c.end_date) : '—'}</td>
                            <td className={tdCls}><StatusBadge status={c.is_active ? 'active' : 'archived'} /></td>
                            <td className={tdCls}>
                              <div className="flex items-center gap-1">
                                <button onClick={() => { setEditingCoupon(c); setShowCouponForm(true); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-50 text-blue-500 transition-colors"><Icon name="PencilIcon" size={14} /></button>
                                <button onClick={() => setDeleteConfirm({ id: c.id, table: 'coupons' })} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-400 transition-colors"><Icon name="TrashIcon" size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── REVIEWS ── */}
          {activeNav === 'Reviews' && (
            <div>
              <PageHeader title="Reviews" desc={`${reviews.length} reviews`} />
              <div className="flex gap-3 mb-4">
                <select className={`${inputCls} max-w-[180px]`} value={reviewFilter} onChange={(e) => setReviewFilter(e.target.value)}>
                  <option value="">All Reviews</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {loading ? <LoadingSpinner /> : reviews.length === 0 ? <EmptyState icon="StarIcon" title="No reviews" desc="Customer reviews will appear here." /> : (
                <div className="flex flex-col gap-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="admin-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-sm text-primary">{r.reviewer_name}</span>
                            <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Icon key={i} name="StarIcon" size={12} className={i < r.rating ? 'text-yellow-400' : 'text-muted-foreground'} />)}</div>
                            <span className="text-xs text-muted-foreground">{r.products?.name ?? '—'}</span>
                            <StatusBadge status={r.review_status ?? 'pending'} />
                          </div>
                          {r.title && <p className="font-semibold text-sm text-foreground mb-1">{r.title}</p>}
                          {r.body && <p className="text-sm text-muted-foreground line-clamp-2">{r.body}</p>}
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(r.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {r.review_status !== 'approved' && <button onClick={() => handleReviewAction(r.id, 'approved')} className="px-3 py-1.5 rounded-xl bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-colors">Approve</button>}
                          {r.review_status !== 'rejected' && <button onClick={() => handleReviewAction(r.id, 'rejected')} className="px-3 py-1.5 rounded-xl bg-yellow-50 text-yellow-700 text-xs font-bold hover:bg-yellow-100 transition-colors">Reject</button>}
                          <button onClick={() => handleReviewAction(r.id, 'delete')} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-red-400 transition-colors"><Icon name="TrashIcon" size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CMS & BANNERS ── */}
          {activeNav === 'CMS & Banners' && (
            <div>
              <PageHeader title="CMS & Banners" desc="Manage homepage banners, promotional sections and featured content"
                action={<button onClick={() => { setEditingBanner(null); setShowBannerForm(true); }} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"><Icon name="PlusIcon" size={15} className="text-white" />Add Banner</button>} />
              {loading ? <LoadingSpinner /> : banners.length === 0 ? <EmptyState icon="PhotoIcon" title="No banners" desc="Create hero banners and promotional sections for your storefront." /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {banners.map((b) => (
                    <div key={b.id} className="admin-card overflow-hidden">
                      {b.image_url && <div className="h-32 overflow-hidden bg-muted"><AppImage src={b.image_url} alt={b.image_alt ?? b.title} width={400} height={128} className="w-full h-full object-cover" /></div>}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-display font-bold text-sm text-primary line-clamp-1">{b.title}</h3>
                            {b.subtitle && <p className="text-xs text-muted-foreground">{b.subtitle}</p>}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 capitalize">{b.banner_type}</span>
                            <StatusBadge status={b.is_active ? 'active' : 'archived'} />
                          </div>
                        </div>
                        {b.cta_text && <p className="text-xs text-muted-foreground mb-3">CTA: {b.cta_text} → {b.cta_url}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingBanner(b); setShowBannerForm(true); }} className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors">Edit</button>
                          <button onClick={() => setDeleteConfirm({ id: b.id, table: 'banners' })} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-50 text-red-400 transition-colors"><Icon name="TrashIcon" size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── REPORTS ── */}
          {activeNav === 'Reports' && (
            <div>
              <PageHeader title="Reports & Analytics" />
              <div className="flex gap-2 mb-5 flex-wrap">
                {[{ label: 'Today', value: '1' }, { label: '7 Days', value: '7' }, { label: '30 Days', value: '30' }, { label: 'This Month', value: '30' }, { label: '90 Days', value: '90' }, { label: 'This Year', value: '365' }].map((r) => (
                  <button key={r.value + r.label} onClick={() => setReportRange(r.value)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${reportRange === r.value ? 'bg-primary text-white' : 'bg-white border border-border text-muted-foreground hover:bg-muted'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
              {loading ? <LoadingSpinner /> : reportData && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Total Revenue', value: formatPrice(reportData.totalRevenue), icon: 'BanknotesIcon', color: 'bg-blue-50', iconColor: 'text-blue-600' },
                      { label: 'Total Orders', value: String(reportData.totalOrders), icon: 'ShoppingCartIcon', color: 'bg-green-50', iconColor: 'text-green-600' },
                      { label: 'Avg Order Value', value: formatPrice(reportData.avgOrderValue), icon: 'ChartBarIcon', color: 'bg-purple-50', iconColor: 'text-purple-600' },
                      { label: 'Returns/Refunds', value: String(reportData.returned), icon: 'ArrowPathIcon', color: 'bg-orange-50', iconColor: 'text-orange-600' },
                    ].map((card) => (
                      <div key={card.label} className="admin-card p-5">
                        <div className={`w-11 h-11 rounded-xl ${card.color} flex items-center justify-center mb-3`}><Icon name={card.icon as any} size={22} className={card.iconColor} /></div>
                        <p className="font-display font-bold text-2xl text-primary">{card.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">{card.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    <div className="admin-card p-5">
                      <h3 className="font-display font-bold text-base text-primary mb-4">Best-Selling Products</h3>
                      {reportData.bestSellers.length === 0 ? <p className="text-sm text-muted-foreground">No sales data for this period.</p> : (
                        <div className="flex flex-col gap-3">
                          {reportData.bestSellers.map((p: any, i: number) => (
                            <div key={p.name} className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{i + 1}</span>
                              <div className="flex-1 min-w-0"><p className="font-semibold text-sm text-primary line-clamp-1">{p.name}</p><p className="text-xs text-muted-foreground">{p.qty} units · {formatPrice(p.revenue)}</p></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="admin-card p-5">
                      <h3 className="font-display font-bold text-base text-primary mb-4">Low Stock Products</h3>
                      {reportData.lowStock.length === 0 ? <p className="text-sm text-muted-foreground text-green-600">✓ All products are well-stocked.</p> : (
                        <div className="flex flex-col gap-2">
                          {reportData.lowStock.map((p: any) => (
                            <div key={p.name} className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                              <span className="font-semibold text-sm text-primary">{p.name}</span>
                              <span className="font-bold text-sm text-red-500">{p.stock_quantity} left</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="admin-card p-5">
                      <h3 className="font-display font-bold text-base text-primary mb-4">Order Summary</h3>
                      <div className="flex flex-col gap-2">
                        {[
                          { label: 'Delivered', value: reportData.delivered, color: 'text-green-600' },
                          { label: 'Cancelled', value: reportData.cancelled, color: 'text-red-500' },
                          { label: 'Returns/Refunds', value: reportData.returned, color: 'text-orange-600' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                            <span className="text-sm text-muted-foreground">{item.label}</span>
                            <span className={`font-bold text-sm ${item.color}`}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── ROLES & PERMISSIONS ── */}
          {activeNav === 'Roles & Permissions' && (
            <div>
              <PageHeader title="Roles & Permissions" desc="Configure role-based access control" />
              {loading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                  <div className="admin-card p-4">
                    <h3 className="font-bold text-sm text-primary mb-3">Roles</h3>
                    <div className="flex flex-col gap-1">
                      {roles.map((r) => (
                        <button key={r.id} onClick={() => setSelectedRole(r)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${selectedRole?.id === r.id ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}>
                          <span>{r.name}</span>
                          {r.is_system && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${selectedRole?.id === r.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>System</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="xl:col-span-2 admin-card p-4">
                    {!selectedRole ? <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Select a role to manage permissions</div> : (
                      <>
                        <h3 className="font-bold text-sm text-primary mb-4">Permissions for: {selectedRole.name}</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead><tr className="border-b border-border">
                              <th className="text-left py-2 pr-4 font-bold text-muted-foreground uppercase">Module</th>
                              {['view', 'create', 'edit', 'delete', 'export'].map((a) => <th key={a} className="py-2 px-2 font-bold text-muted-foreground uppercase text-center">{a}</th>)}
                            </tr></thead>
                            <tbody>
                              {Array.from(new Set(permissions.map((p) => p.module))).map((module) => (
                                <tr key={module} className="border-b border-border hover:bg-muted/30">
                                  <td className="py-2 pr-4 font-semibold text-primary capitalize">{module}</td>
                                  {['view', 'create', 'edit', 'delete', 'export'].map((action) => {
                                    const perm = permissions.find((p) => p.module === module && p.action === action);
                                    const hasIt = perm ? rolePermissions.some((rp) => rp.role_id === selectedRole.id && rp.permission_id === perm.id) : false;
                                    return (
                                      <td key={action} className="py-2 px-2 text-center">
                                        {perm ? <button onClick={() => handleToggleRolePermission(selectedRole.id, perm.id, hasIt)}
                                          className={`w-5 h-5 rounded flex items-center justify-center mx-auto transition-colors ${hasIt ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground hover:bg-green-100'}`}>
                                          {hasIt ? <Icon name="CheckIcon" size={11} /> : <Icon name="MinusIcon" size={11} />}
                                        </button> : <span className="text-muted-foreground">—</span>}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── AUDIT LOGS ── */}
          {activeNav === 'Audit Logs' && (
            <div>
              <PageHeader title="Audit Logs" desc="Track all administrative actions" />
              {loading ? <LoadingSpinner /> : auditLogs.length === 0 ? <EmptyState icon="ClipboardIcon" title="No audit logs" desc="Admin actions will be recorded here." /> : (
                <div className="admin-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-border bg-muted/50">
                        <th className={thCls}>Action</th><th className={thCls}>Module</th>
                        <th className={`${thCls} hidden sm:table-cell`}>User</th>
                        <th className={`${thCls} hidden md:table-cell`}>Record</th>
                        <th className={thCls}>Date & Time</th>
                      </tr></thead>
                      <tbody>
                        {auditLogs.map((log, i) => (
                          <tr key={log.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${i === auditLogs.length - 1 ? 'border-0' : ''}`}>
                            <td className={tdCls}><span className="font-semibold text-sm text-primary">{log.action}</span></td>
                            <td className={tdCls}><span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 capitalize">{log.module}</span></td>
                            <td className={`${tdCls} hidden sm:table-cell`}><div><p className="text-xs font-medium">{log.user_name ?? '—'}</p><p className="text-[10px] text-muted-foreground">{log.user_email ?? ''}</p></div></td>
                            <td className={`${tdCls} hidden md:table-cell text-xs text-muted-foreground font-mono`}>{log.record_type ? `${log.record_type}` : '—'}</td>
                            <td className={`${tdCls} text-xs text-muted-foreground`}>{formatDate(log.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeNav === 'Settings' && (
            <div>
              <PageHeader title="Settings" desc="Configure store, currency, tax, shipping and notification settings"
                action={<button onClick={handleSaveSettings} disabled={settingsSaving} className="btn-primary px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
                  {settingsSaving ? <Icon name="ArrowPathIcon" size={15} className="text-white animate-spin" /> : <Icon name="CheckIcon" size={15} className="text-white" />}
                  {settingsSaving ? 'Saving…' : 'Save Settings'}
                </button>} />
              {loading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {Array.from(new Set(settings.map((s) => s.setting_group))).map((group) => (
                    <div key={group} className="admin-card p-5">
                      <h3 className="font-display font-bold text-base text-primary mb-4 capitalize">{group} Settings</h3>
                      <div className="flex flex-col gap-4">
                        {settings.filter((s) => s.setting_group === group).map((s) => (
                          <div key={s.setting_key}>
                            <label className={labelCls}>{s.label ?? s.setting_key}</label>
                            {s.description && <p className="text-xs text-muted-foreground mb-1">{s.description}</p>}
                            {typeof settingsForm[s.setting_key] === 'string' && (settingsForm[s.setting_key] === 'true' || settingsForm[s.setting_key] === 'false') ? (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={settingsForm[s.setting_key] === 'true'} onChange={(e) => setSettingsForm((p) => ({ ...p, [s.setting_key]: String(e.target.checked) }))} className="w-4 h-4 rounded accent-primary" />
                                <span className="text-sm font-medium">{settingsForm[s.setting_key] === 'true' ? 'Enabled' : 'Disabled'}</span>
                              </label>
                            ) : (
                              <input className={inputCls} value={settingsForm[s.setting_key] ?? ''} onChange={(e) => setSettingsForm((p) => ({ ...p, [s.setting_key]: e.target.value }))} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ── MODALS ── */}
      {showProductForm && (
        <ProductFormModal product={editingProduct} categories={categories} onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
          onSaved={() => { setShowProductForm(false); setEditingProduct(null); loadProducts(); }} />
      )}

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdated={loadOrders} />
      )}

      {showStockModal && (
        <StockAdjustModal products={products.length > 0 ? products : []} warehouses={warehouses} onClose={() => setShowStockModal(false)} onSaved={loadInventory} />
      )}

      {showWarehouseForm && (
        <WarehouseFormModal warehouse={editingWarehouse} onClose={() => { setShowWarehouseForm(false); setEditingWarehouse(null); }} onSaved={loadWarehouses} />
      )}

      {showCouponForm && (
        <CouponFormModal coupon={editingCoupon} onClose={() => { setShowCouponForm(false); setEditingCoupon(null); }} onSaved={loadCoupons} />
      )}

      {showBannerForm && (
        <BannerFormModal banner={editingBanner} onClose={() => { setShowBannerForm(false); setEditingBanner(null); }} onSaved={loadBanners} />
      )}

      {editingBarcode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg text-primary">Edit Barcode</h2>
              <button onClick={() => setEditingBarcode(null)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"><Icon name="XMarkIcon" size={20} /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div><label className={labelCls}>Barcode Value</label>
                <input className={inputCls} value={editingBarcode.barcode_value} onChange={(e) => setEditingBarcode((p: any) => ({ ...p, barcode_value: e.target.value }))} />
              </div>
              <div><label className={labelCls}>Format</label>
                <select className={inputCls} value={editingBarcode.barcode_format} onChange={(e) => setEditingBarcode((p: any) => ({ ...p, barcode_format: e.target.value }))}>
                  <option value="EAN13">EAN-13</option><option value="UPCA">UPC-A</option><option value="CODE128">Code 128</option>
                </select>
              </div>
              <div><label className={labelCls}>Status</label>
                <select className={inputCls} value={editingBarcode.barcode_status} onChange={(e) => setEditingBarcode((p: any) => ({ ...p, barcode_status: e.target.value }))}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditingBarcode(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={async () => {
                await supabase.from('barcodes').update({ barcode_value: editingBarcode.barcode_value, barcode_format: editingBarcode.barcode_format, barcode_status: editingBarcode.barcode_status }).eq('id', editingBarcode.id);
                setEditingBarcode(null); loadBarcodes();
              }} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-display font-bold text-lg text-primary mb-2">Confirm Delete</h3>
            <p className="text-sm text-muted-foreground mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
