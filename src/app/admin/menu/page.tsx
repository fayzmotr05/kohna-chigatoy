'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import type { Category, MenuItem } from '@/lib/types';

const MODEL_STATUS: Record<string, { label: string; color: string }> = {
  none: { label: 'Yo\'q', color: 'text-text-secondary' },
  processing: { label: 'Qayta ishlanmoqda', color: 'text-yellow-600' },
  ready: { label: 'Tayyor', color: 'text-green-600' },
  failed: { label: 'Xatolik', color: 'text-red-600' },
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [uploading, setUploading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createBrowserClient();
    const [itemsRes, catsRes] = await Promise.all([
      supabase
        .from('menu_items')
        .select('*, categories(name)')
        .order('name'),
      supabase.from('categories').select('*').order('display_order'),
    ]);
    setItems((itemsRes.data as MenuItem[]) || []);
    setCategories((catsRes.data as Category[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleAvailability = async (itemId: string, current: boolean) => {
    const supabase = createBrowserClient();
    await supabase
      .from('menu_items')
      .update({ is_available: !current })
      .eq('id', itemId);

    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, is_available: !current } : i)),
    );
  };

  const handleUploadModel = async (itemId: string, file: File) => {
    setUploading(itemId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('itemId', itemId);

      const res = await fetch('/api/process-model', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Model yuklashda xatolik yuz berdi');
    } finally {
      setUploading(null);
    }
  };

  // Filter items
  const filtered = items.filter((item) => {
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || item.category_id === catFilter;
    return matchSearch && matchCat;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-sand animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-brown-deep">Menyu</h1>
        <p className="text-text-secondary text-sm">{items.length} ta taom</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-sand rounded bg-white-warm text-sm focus:border-tan focus:outline-none"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="px-3 py-2 border border-sand rounded bg-white-warm text-sm focus:border-tan focus:outline-none"
        >
          <option value="all">Barcha kategoriyalar</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Items table */}
      <div className="bg-white-warm border border-sand rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sand-light text-text-secondary text-left">
                <th className="px-4 py-2.5 font-medium">Taom</th>
                <th className="px-4 py-2.5 font-medium">Kategoriya</th>
                <th className="px-4 py-2.5 font-medium">Narx</th>
                <th className="px-4 py-2.5 font-medium">3D Model</th>
                <th className="px-4 py-2.5 font-medium">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {filtered.map((item) => {
                const status = MODEL_STATUS[item.model_status] || MODEL_STATUS.none;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-sand-light/50 ${!item.is_available ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt=""
                            className="w-10 h-10 rounded object-cover bg-sand"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-sand flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-brown-light)" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-5-5L5 21" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-text-primary">{item.name}</p>
                          {item.is_featured && (
                            <span className="text-xs text-tan font-semibold">Tavsiya</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {item.categories?.name || '—'}
                    </td>
                    <td className="px-4 py-3 font-display font-semibold text-brown-deep">
                      {formatPrice(item.price)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        {item.model_status === 'none' && (
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".usdz"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadModel(item.id, file);
                              }}
                            />
                            <span className="text-xs text-brown underline hover:text-brown-deep">
                              Yuklash
                            </span>
                          </label>
                        )}
                        {uploading === item.id && (
                          <div className="w-4 h-4 border-2 border-tan border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAvailability(item.id, item.is_available)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          item.is_available ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            item.is_available ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                    Taom topilmadi
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
