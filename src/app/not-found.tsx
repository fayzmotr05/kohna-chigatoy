import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center px-4">
      <div className="text-center">
        <div className="flex justify-center gap-1.5 mb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-4 h-6 rounded-t-full border border-brown-light/40" />
          ))}
        </div>
        <h1 className="font-display text-6xl font-bold text-cream mb-4">404</h1>
        <p className="text-brown-light/70 mb-8 text-lg">Sahifa topilmadi</p>
        <Link
          href="/"
          className="bg-brown-deep text-cream px-8 py-3 rounded font-semibold hover:bg-brown transition-colors"
        >
          Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  );
}
