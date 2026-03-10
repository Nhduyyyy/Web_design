export default function ViewerCount({ current = 0 }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-red-500/60 text-xs text-white">
      <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      <span className="text-[11px] uppercase tracking-wide text-red-300 font-semibold">
        Đang xem
      </span>
      <span className="font-semibold">{current.toLocaleString('vi-VN')}</span>
    </div>
  );
}

