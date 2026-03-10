'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';

const STATUS_FLOW: Record<string, string[]> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['done', 'cancelled'],
  done: [],
  cancelled: [],
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Tasdiqlash',
  preparing: 'Tayyorlash',
  done: 'Tayyor',
  cancelled: 'Bekor qilish',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const supabase = createBrowserClient();
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setOrders(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    const supabase = createBrowserClient();
    await supabase.from('orders').update({ status }).eq('id', orderId);
    fetchOrders();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-sand animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-brown-deep">Buyurtmalar</h1>
        <button
          onClick={fetchOrders}
          className="text-brown hover:text-brown-deep transition-colors"
          aria-label="Yangilash"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
          </svg>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'new', 'confirmed', 'preparing', 'done', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-brown-deep text-cream'
                : 'bg-sand text-text-secondary hover:bg-sand-light'
            }`}
          >
            {s === 'all' ? 'Barchasi' : STATUS_LABELS[s] || s}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="bg-white-warm border border-sand rounded-lg overflow-hidden">
        {orders.length === 0 ? (
          <p className="px-4 py-8 text-center text-text-secondary">Buyurtmalar yo&apos;q</p>
        ) : (
          <div className="divide-y divide-sand">
            {orders.map((order) => {
              const items = order.items as any[];
              const isExpanded = expandedId === order.id;

              return (
                <div key={order.id}>
                  <div
                    className="px-4 py-3 flex items-center gap-4 cursor-pointer hover:bg-sand-light/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-brown-deep">{order.customer_name}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-text-secondary text-sm">
                        {order.customer_phone} · {items.length} taom
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display font-bold text-brown-deep">
                        {formatPrice(order.total)}
                      </p>
                      <p className="text-text-secondary text-xs">
                        {new Date(order.created_at).toLocaleDateString('uz-UZ')}
                      </p>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`shrink-0 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-sand-light/30">
                      <div className="mb-3">
                        {items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between py-1 text-sm">
                            <span className="text-text-primary">
                              {item.name} x{item.qty}
                            </span>
                            <span className="text-text-secondary">
                              {formatPrice(item.price * item.qty)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {/* Status actions */}
                      {STATUS_FLOW[order.status]?.length > 0 && (
                        <div className="flex gap-2 pt-2 border-t border-sand">
                          {STATUS_FLOW[order.status].map((nextStatus) => (
                            <button
                              key={nextStatus}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(order.id, nextStatus);
                              }}
                              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                                nextStatus === 'cancelled'
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-brown-deep text-cream hover:bg-brown'
                              }`}
                            >
                              {STATUS_LABELS[nextStatus] || nextStatus}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
