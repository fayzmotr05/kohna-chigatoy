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
  const hasAR = item.model_status === 'ready' && (item.model_glb_url || item.model_usdz_url);

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
      <div className="relative h-32 sm:h-44">
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
        <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 flex gap-1">
          {item.is_featured && (
            <span className="bg-white-warm/90 backdrop-blur-sm text-brown-deep px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold flex items-center gap-0.5 shadow-sm">
              <Star size={8} fill="currentColor" className="sm:w-[10px] sm:h-[10px]" />
              {t.menu.popular}
            </span>
          )}
          {hasAR && (
            <span className="bg-brown-deep/90 backdrop-blur-sm text-tan px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-semibold flex items-center gap-0.5 shadow-sm">
              <Box size={8} className="sm:w-[10px] sm:h-[10px]" />
              {t.menu.ar}
            </span>
          )}
        </div>

        {/* AR button on image */}
        {hasAR && onAR && (
          <button
            onClick={() => onAR(item)}
            className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 bg-brown-deep text-tan px-2 py-1 sm:px-3 sm:py-1.5 rounded text-[10px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 hover:bg-brown transition-all duration-200 shadow-sm"
          >
            <Box size={13} />
            {t.menu.arView}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-4">
        <h3 className="font-display text-sm sm:text-base font-semibold text-brown-deep mb-0.5 sm:mb-1 line-clamp-1">
          {item.name}
        </h3>
        <p className="text-text-secondary text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-3 min-h-[2rem] sm:min-h-[2.5rem] leading-relaxed">
          {item.description}
        </p>
        <div className="flex items-center justify-between">
          <p className="font-display text-base sm:text-xl font-bold text-brown-deep">
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
