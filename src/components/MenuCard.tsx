'use client';

import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import type { MenuItem } from '@/lib/types';

interface MenuCardProps {
  item: MenuItem;
  onAR?: (item: MenuItem) => void;
}

export default function MenuCard({ item, onAR }: MenuCardProps) {
  const hasAR = item.model_status === 'ready' && item.model_glb_url;

  return (
    <div className="bg-white-warm border border-sand rounded-lg overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
      {/* Image */}
      <div className="relative h-44 bg-sand">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-brown-light/50">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 3c-1.5 0-2.5.5-3.5 1.5S7 6.5 7 8c0 2 1 3 2 4l1 1H9c-2 0-4 1-5 3v1h16v-1c-1-2-3-3-5-3h-1l1-1c1-1 2-2 2-4 0-1.5-.5-2.5-1.5-3.5S13.5 3 12 3z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {item.is_featured && (
            <span className="bg-tan/90 text-brown-deep px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Mashhur
            </span>
          )}
          {hasAR && (
            <span className="bg-brown-deep/90 text-tan px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              AR
            </span>
          )}
        </div>

        {/* AR button on image */}
        {hasAR && onAR && (
          <button
            onClick={() => onAR(item)}
            className="absolute bottom-2 right-2 bg-brown-deep text-tan px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 hover:bg-brown transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            AR ko&apos;rish
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display text-base font-semibold text-brown-deep mb-1 line-clamp-1">
          {item.name}
        </h3>
        <p className="text-text-secondary text-sm line-clamp-2 mb-3 min-h-[2.5rem]">
          {item.description}
        </p>
        <p className="font-display text-lg font-bold text-brown-deep">
          {formatPrice(item.price)}
        </p>
      </div>
    </div>
  );
}
