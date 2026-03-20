'use client';

import { useState } from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from './CartProvider';
import { useTelegram } from './TelegramProvider';
import { useTranslation } from '@/i18n/LanguageContext';
import { formatPrice } from '@/lib/utils';

interface CheckoutSheetProps {
  onClose: () => void;
  onNeedRegistration: () => void;
}

export default function CheckoutSheet({ onClose, onNeedRegistration }: CheckoutSheetProps) {
  const { items, total, updateQuantity, removeItem, clear } = useCart();
  const { rawInitData, isRegistered, webApp } = useTelegram();
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!isRegistered) {
      onNeedRegistration();
      return;
    }

    if (!rawInitData || items.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/telegram/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': rawInitData,
        },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        }),
      });

      if (res.ok) {
        setSuccess(true);
        clear();
        webApp?.HapticFeedback.notificationOccurred('success');
      } else {
        const data = await res.json();
        setError(data.error || t.telegram.orderError);
        webApp?.HapticFeedback.notificationOccurred('error');
      }
    } catch {
      setError(t.telegram.orderError);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
        <div className="bg-cream w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="text-green-600" size={28} />
          </div>
          <h3 className="font-display text-xl font-bold text-brown-deep mb-2">{t.telegram.orderSuccess}</h3>
          <p className="text-text-secondary mb-6">{t.telegram.orderSuccessDesc}</p>
          <button onClick={onClose} className="w-full bg-brown-deep text-cream py-3 rounded-lg font-semibold hover:bg-brown transition-colors">
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-cream w-full max-w-lg max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand/60">
          <h3 className="font-display text-lg font-bold text-brown-deep">{t.telegram.cart}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-brown-deep transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-center text-text-secondary py-8">{t.telegram.cartEmpty}</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 bg-white-warm rounded-lg p-3 border border-sand/40">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-brown-deep text-sm truncate">{item.name}</h4>
                  <p className="text-text-secondary text-xs">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full bg-sand-light border border-sand/50 flex items-center justify-center text-brown-deep hover:bg-sand transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center font-semibold text-brown-deep text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full bg-sand-light border border-sand/50 flex items-center justify-center text-brown-deep hover:bg-sand transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-sand/60 space-y-3">
            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-text-secondary font-medium">{t.telegram.total}</span>
              <span className="font-display text-xl font-bold text-brown-deep">{formatPrice(total)}</span>
            </div>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full bg-brown-deep text-cream py-3 rounded-lg font-semibold hover:bg-brown transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '...' : t.telegram.confirmOrder}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
