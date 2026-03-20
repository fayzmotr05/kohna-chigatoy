'use client';

import Image from 'next/image';
import { Star, Box, Plus } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useTranslation } from '@/i18n/LanguageContext';
import { useTelegram } from '@/telegram/TelegramProvider';
import { useCart } from '@/telegram/CartProvider';
import PlaceholderImage from '@/components/PlaceholderImage';
import type { MenuItem } from '@/lib/types';

interface MenuCardProps {
  item: MenuItem;
  onAR?: (item: MenuItem) => void;
  onAddToCart?: (item: MenuItem) => void;
}

export default function MenuCard({ item, onAR, onAddToCart }: MenuCardProps) {
  const { t } = useTranslation();
  const { isTelegram } = useTelegram();
  const { addItem } = useCart();
  const hasAR = item.model_status === 'ready' && item.model_glb_url;

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(item);
    } else {
      addItem({ id: item.id, name: item.name, price: item.price });
    }
  };

  return (
    <div className="bg-white-warm border border-sand/60 rounded-lg overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(61,33,23,0.08)] transition-all duration-200 group">
      {/* Image */}
      <div className="relative h-44">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <PlaceholderImage categoryName={item.categories?.name} />
        )}

        {/* Bottom gradient for depth */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/8 to-transparent" />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {item.is_featured && (
            <span className="bg-white-warm/90 backdrop-blur-sm text-brown-deep px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 shadow-sm">
              <Star size={10} fill="currentColor" />
              {t.menu.popular}
            </span>
          )}
          {hasAR && (
            <span className="bg-brown-deep/90 backdrop-blur-sm text-tan px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 shadow-sm">
              <Box size={10} />
              {t.menu.ar}
            </span>
          )}
        </div>

        {/* AR button on image */}
        {hasAR && onAR && (
          <button
            onClick={() => onAR(item)}
            className="absolute bottom-2.5 right-2.5 bg-brown-deep text-tan px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 hover:bg-brown transition-all duration-200 opacity-0 group-hover:opacity-100 sm:opacity-100 shadow-sm"
          >
            <Box size={13} />
            {t.menu.arView}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display text-base font-semibold text-brown-deep mb-1 line-clamp-1">
          {item.name}
        </h3>
        <p className="text-text-secondary text-sm line-clamp-2 mb-3 min-h-[2.5rem] leading-relaxed">
          {item.description}
        </p>
        <div className="flex items-center justify-between">
          <p className="font-display text-xl font-bold text-brown-deep">
            {formatPrice(item.price)}
          </p>
          {isTelegram && (
            <button
              onClick={handleAdd}
              className="w-8 h-8 rounded-full bg-brown-deep text-cream flex items-center justify-center hover:bg-brown transition-colors shadow-sm active:scale-95"
              aria-label={t.telegram.addToCart}
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
