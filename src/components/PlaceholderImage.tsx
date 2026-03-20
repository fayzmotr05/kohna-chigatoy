import { Wheat, Soup, Salad, Cookie, UtensilsCrossed } from 'lucide-react';

const categoryConfig: Record<string, { gradient: string; Icon: any }> = {
  "Uyg'ur taomlar": { gradient: 'placeholder-soup',  Icon: Soup },
  'Milliy taomlar':  { gradient: 'placeholder-palov', Icon: Wheat },
  'Salatlar':        { gradient: 'placeholder-salad', Icon: Salad },
  'Shirinliklar':    { gradient: 'placeholder-somsa', Icon: Cookie },
};

interface Props {
  categoryName?: string | null;
  className?: string;
}

export default function PlaceholderImage({ categoryName, className = '' }: Props) {
  const config = categoryConfig[categoryName || ''] || { gradient: 'placeholder-palov', Icon: UtensilsCrossed };
  const { gradient, Icon } = config;

  return (
    <div className={`absolute inset-0 ${gradient} ${className}`}>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 pattern-geo opacity-[0.06]" />
      {/* Category icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon size={56} strokeWidth={1} className="text-brown-deep/20" />
      </div>
    </div>
  );
}
