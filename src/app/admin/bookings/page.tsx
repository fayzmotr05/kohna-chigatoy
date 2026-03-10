'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import StatusBadge from '@/components/StatusBadge';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchBookings = useCallback(async () => {
    const supabase = createBrowserClient();
    let query = supabase
      .from('bookings')
      .select('*')
      .order('date', { ascending: false })
      .order('time', { ascending: false })
      .limit(50);

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setBookings(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateStatus = async (bookingId: string, status: string) => {
    const supabase = createBrowserClient();
    await supabase.from('bookings').update({ status }).eq('id', bookingId);
    fetchBookings();
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
        <h1 className="font-display text-2xl font-bold text-brown-deep">Bandlar</h1>
        <button
          onClick={fetchBookings}
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
        {['all', 'pending', 'confirmed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-brown-deep text-cream'
                : 'bg-sand text-text-secondary hover:bg-sand-light'
            }`}
          >
            {s === 'all'
              ? 'Barchasi'
              : s === 'pending'
                ? 'Kutilmoqda'
                : s === 'confirmed'
                  ? 'Tasdiqlangan'
                  : 'Bekor qilingan'}
          </button>
        ))}
      </div>

      {/* Bookings table */}
      <div className="bg-white-warm border border-sand rounded-lg overflow-hidden">
        {bookings.length === 0 ? (
          <p className="px-4 py-8 text-center text-text-secondary">Bandlar yo&apos;q</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sand-light text-text-secondary text-left">
                  <th className="px-4 py-2.5 font-medium">Mijoz</th>
                  <th className="px-4 py-2.5 font-medium">Telefon</th>
                  <th className="px-4 py-2.5 font-medium">Sana</th>
                  <th className="px-4 py-2.5 font-medium">Vaqt</th>
                  <th className="px-4 py-2.5 font-medium">Kishilar</th>
                  <th className="px-4 py-2.5 font-medium">Holat</th>
                  <th className="px-4 py-2.5 font-medium">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-sand-light/50">
                    <td className="px-4 py-3 text-text-primary font-medium">{booking.customer_name}</td>
                    <td className="px-4 py-3 text-text-secondary">{booking.customer_phone}</td>
                    <td className="px-4 py-3 text-text-primary">{booking.date}</td>
                    <td className="px-4 py-3 text-text-primary">{booking.time?.slice(0, 5)}</td>
                    <td className="px-4 py-3 text-text-primary">{booking.party_size}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(booking.id, 'confirmed')}
                              className="px-2.5 py-1 bg-brown-deep text-cream rounded text-xs font-semibold hover:bg-brown transition-colors"
                            >
                              Tasdiqlash
                            </button>
                            <button
                              onClick={() => updateStatus(booking.id, 'cancelled')}
                              className="px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200 transition-colors"
                            >
                              Bekor
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => updateStatus(booking.id, 'cancelled')}
                            className="px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200 transition-colors"
                          >
                            Bekor qilish
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
