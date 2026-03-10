/**
 * Format price in UZS with space separators
 * e.g. 55000 → "55 000 UZS"
 */
export function formatPrice(price: number): string {
  const formatted = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} UZS`;
}

/**
 * Format date for display
 * e.g. "2026-03-11" → "11 mart 2026"
 */
export function formatDate(dateStr: string): string {
  const months = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
  ];
  const date = new Date(dateStr);
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Format time for display
 * e.g. "14:30:00" → "14:30"
 */
export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

/**
 * Get Supabase storage public URL for a file path
 */
export function getStorageUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${supabaseUrl}/storage/v1/object/public/media/${path}`;
}
