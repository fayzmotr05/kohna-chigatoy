'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Stats {
  todayOrders: number;
  todayRevenue: number;
  todayBookings: number;
}

interface DayData {
  day: string;
  count: number;
  revenue: number;
}

interface TopItem {
  name: string;
  qty: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ todayOrders: 0, todayRevenue: 0, todayBookings: 0 });
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();
    const today = new Date().toISOString().split('T')[0];

    async function fetchData() {
      // Today's stats
      const [ordersRes, bookingsRes] = await Promise.all([
        supabase.from('orders').select('status, total').gte('created_at', `${today}T00:00:00`),
        supabase.from('bookings').select('id').eq('date', today),
      ]);

      const orders = ordersRes.data || [];
      setStats({
        todayOrders: orders.length,
        todayRevenue: orders
          .filter((o) => o.status !== 'cancelled')
          .reduce((sum, o) => sum + Number(o.total), 0),
        todayBookings: bookingsRes.data?.length || 0,
      });

      // Last 7 days orders
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: weekOrders } = await supabase
        .from('orders')
        .select('created_at, total')
        .gte('created_at', sevenDaysAgo.toISOString());

      const dayMap = new Map<string, { count: number; revenue: number }>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dayMap.set(key, { count: 0, revenue: 0 });
      }
      (weekOrders || []).forEach((o) => {
        const day = o.created_at.split('T')[0];
        const existing = dayMap.get(day);
        if (existing) {
          existing.count++;
          existing.revenue += Number(o.total);
        }
      });
      setWeekData(
        Array.from(dayMap.entries()).map(([day, data]) => ({
          day: day.slice(5), // MM-DD
          ...data,
        })),
      );

      // Top items (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: monthOrders } = await supabase
        .from('orders')
        .select('items')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .neq('status', 'cancelled');

      const itemCounts = new Map<string, number>();
      (monthOrders || []).forEach((o) => {
        const items = o.items as any[];
        items.forEach((item) => {
          const current = itemCounts.get(item.name) || 0;
          itemCounts.set(item.name, current + (item.qty || 1));
        });
      });
      const sorted = Array.from(itemCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, qty]) => ({ name, qty }));
      setTopItems(sorted);

      // Recent orders
      const { data: recent } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      setRecentOrders(recent || []);

      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-sand animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-sand animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-brown-deep">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white-warm border border-sand rounded-lg p-5">
          <p className="text-text-secondary text-sm mb-1">Bugungi buyurtmalar</p>
          <p className="font-display text-3xl font-bold text-brown-deep">{stats.todayOrders}</p>
        </div>
        <div className="bg-white-warm border border-sand rounded-lg p-5">
          <p className="text-text-secondary text-sm mb-1">Bugungi daromad</p>
          <p className="font-display text-3xl font-bold text-brown-deep">
            {formatPrice(stats.todayRevenue)}
          </p>
        </div>
        <div className="bg-white-warm border border-sand rounded-lg p-5">
          <p className="text-text-secondary text-sm mb-1">Bugungi bandlar</p>
          <p className="font-display text-3xl font-bold text-brown-deep">{stats.todayBookings}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders per day */}
        <div className="bg-white-warm border border-sand rounded-lg p-5">
          <h3 className="font-semibold text-brown-deep mb-4">Buyurtmalar (7 kun)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8D5C0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#7A6355' }} />
              <YAxis tick={{ fontSize: 12, fill: '#7A6355' }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8B4A2B"
                strokeWidth={2}
                dot={{ fill: '#D4B896', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top items */}
        <div className="bg-white-warm border border-sand rounded-lg p-5">
          <h3 className="font-semibold text-brown-deep mb-4">Top taomlar (30 kun)</h3>
          {topItems.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D5C0" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#7A6355' }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 11, fill: '#7A6355' }}
                />
                <Tooltip />
                <Bar dataKey="qty" fill="#C49A7E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-secondary text-sm">Ma&apos;lumot yo&apos;q</p>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white-warm border border-sand rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-sand">
          <h3 className="font-semibold text-brown-deep">So&apos;nggi buyurtmalar</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sand-light text-text-secondary text-left">
                <th className="px-4 py-2.5 font-medium">Mijoz</th>
                <th className="px-4 py-2.5 font-medium">Telefon</th>
                <th className="px-4 py-2.5 font-medium">Jami</th>
                <th className="px-4 py-2.5 font-medium">Holat</th>
                <th className="px-4 py-2.5 font-medium">Vaqt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-sand-light/50">
                  <td className="px-4 py-3 text-text-primary">{order.customer_name}</td>
                  <td className="px-4 py-3 text-text-secondary">{order.customer_phone}</td>
                  <td className="px-4 py-3 font-display font-semibold text-brown-deep">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(order.created_at).toLocaleTimeString('uz-UZ', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                    Buyurtmalar yo&apos;q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
