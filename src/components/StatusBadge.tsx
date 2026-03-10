const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'Yangi', color: 'bg-blue-100 text-blue-800' },
  confirmed: { label: 'Tasdiqlangan', color: 'bg-green-100 text-green-800' },
  preparing: { label: 'Tayyorlanmoqda', color: 'bg-yellow-100 text-yellow-800' },
  done: { label: 'Tayyor', color: 'bg-green-200 text-green-900' },
  cancelled: { label: 'Bekor', color: 'bg-red-100 text-red-800' },
  pending: { label: 'Kutilmoqda', color: 'bg-blue-100 text-blue-800' },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
}
