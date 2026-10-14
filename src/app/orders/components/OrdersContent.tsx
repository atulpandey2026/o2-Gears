'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OrderItem {
  id: string;
  product_name: string;
  product_image?: string;
  variant_label?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'refunded';
  payment_status: string;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  tax: number;
  total: number;
  tracking_number?: string;
  tracking_url?: string;
  shipping_provider?: string;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  order_items?: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; step: number }> = {
  pending:    { label: 'Pending',    color: 'text-yellow-700', bg: 'bg-yellow-100', step: 1 },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-700',   bg: 'bg-blue-100',   step: 2 },
  processing: { label: 'Processing', color: 'text-indigo-700', bg: 'bg-indigo-100', step: 3 },
  shipped:    { label: 'Shipped',    color: 'text-purple-700', bg: 'bg-purple-100', step: 4 },
  delivered:  { label: 'Delivered',  color: 'text-green-700',  bg: 'bg-green-100',  step: 5 },
  cancelled:  { label: 'Cancelled',  color: 'text-red-700',    bg: 'bg-red-100',    step: 0 },
  returned:   { label: 'Returned',   color: 'text-orange-700', bg: 'bg-orange-100', step: 0 },
  refunded:   { label: 'Refunded',   color: 'text-gray-700',   bg: 'bg-gray-100',   step: 0 },
};

const PROGRESS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-xs font-medium text-green-700">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      Live Updates
    </span>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'text-gray-700', bg: 'bg-gray-100' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function OrderProgressBar({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg || cfg.step === 0) return null;
  const currentStep = cfg.step;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        {PROGRESS_STEPS.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          return (
            <div key={step} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {idx > 0 && (
                  <div className={`flex-1 h-0.5 ${isCompleted || isCurrent ? 'bg-accent' : 'bg-gray-200'}`} />
                )}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300 ${
                    isCompleted ? 'bg-accent text-white' : isCurrent ?'bg-accent text-white ring-4 ring-accent/20': 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : stepNum}
                </div>
                {idx < PROGRESS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 ${isCompleted ? 'bg-accent' : 'bg-gray-200'}`} />
                )}
              </div>
              <span className={`mt-1 text-[10px] font-medium text-center ${isCurrent ? 'text-accent' : isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UpdateToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border border-green-200 shadow-lg rounded-2xl px-4 py-3 animate-in slide-in-from-bottom-4 duration-300">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
      </span>
      <span className="text-sm font-medium text-gray-800">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function OrdersContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const supabase = createClient();

  const fetchOrders = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, order_number, order_status, payment_status,
        subtotal, discount, shipping_cost, tax, total,
        tracking_number, tracking_url, shipping_provider,
        created_at, shipped_at, delivered_at, cancelled_at,
        order_items (
          id, product_name, product_image, variant_label,
          quantity, unit_price, total_price
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    fetchOrders(user.id);
  }, [user, authLoading, router, fetchOrders]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`customer_orders_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((prev) =>
            prev.map((o) =>
              o.id === updated.id
                ? { ...o, ...updated }
                : o
            )
          );
          const statusCfg = STATUS_CONFIG[updated.order_status];
          setToast(
            `Order #${updated.order_number} updated to ${statusCfg?.label ?? updated.order_status}`
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders((prev) => [newOrder, ...prev]);
          setToast(`New order #${newOrder.order_number} placed!`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading your orders…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-foreground">My Orders</h1>
          </div>
          <LiveBadge />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">No orders yet</h2>
              <p className="text-muted-foreground text-sm mb-6">When you place an order, it will appear here with live status updates.</p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-accent/90 transition-colors"
              >
                Shop Now
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const statusCfg = STATUS_CONFIG[order.order_status] ?? { label: order.order_status, color: 'text-gray-700', bg: 'bg-gray-100' };
              const isActive = !['cancelled', 'returned', 'refunded'].includes(order.order_status);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden transition-all duration-200"
                >
                  {/* Order Header */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full text-left px-5 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground text-sm">#{order.order_number}</span>
                          <OrderStatusBadge status={order.order_status} />
                          {order.payment_status === 'paid' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                              Paid
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                          {order?.order_items && order.order_items.length > 0 && (
                            <> · {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-bold text-foreground">₹{Number(order.total).toLocaleString('en-IN')}</span>
                        <svg
                          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Progress Bar (always visible for active orders) */}
                    {isActive && <OrderProgressBar status={order.order_status} />}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border px-5 py-4 space-y-5">
                      {/* Order Items */}
                      {order.order_items && order.order_items.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Items</h4>
                          <div className="space-y-3">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                                  {item.product_image ? (
                                    <img
                                      src={item.product_image}
                                      alt={item.product_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                                  {item.variant_label && (
                                    <p className="text-xs text-muted-foreground">{item.variant_label}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                                <span className="text-sm font-semibold text-foreground flex-shrink-0">
                                  ₹{Number(item.total_price).toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price Breakdown */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Price Breakdown</h4>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
                          </div>
                          {Number(order.discount) > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Discount</span>
                              <span>-₹{Number(order.discount).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {Number(order.shipping_cost) > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                              <span>Shipping</span>
                              <span>₹{Number(order.shipping_cost).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {Number(order.tax) > 0 && (
                            <div className="flex justify-between text-muted-foreground">
                              <span>Tax</span>
                              <span>₹{Number(order.tax).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-foreground pt-1.5 border-t border-border">
                            <span>Total</span>
                            <span>₹{Number(order.total).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Tracking Info */}
                      {order.tracking_number && (
                        <div className="bg-blue-50 rounded-xl p-4">
                          <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Tracking</h4>
                          <div className="space-y-1">
                            {order.shipping_provider && (
                              <p className="text-sm text-blue-800 font-medium">{order.shipping_provider}</p>
                            )}
                            <p className="text-sm text-blue-700 font-mono">{order.tracking_number}</p>
                            {order.tracking_url && (
                              <a
                                href={order.tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                              >
                                Track Shipment
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Placed: {new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        {order.shipped_at && (
                          <p>Shipped: {new Date(order.shipped_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        )}
                        {order.delivered_at && (
                          <p>Delivered: {new Date(order.delivered_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        )}
                        {order.cancelled_at && (
                          <p>Cancelled: {new Date(order.cancelled_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live update toast */}
      {toast && <UpdateToast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
