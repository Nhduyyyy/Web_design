export default function BroadcastControls({
  isBroadcasting,
  mode,
  onSelectMode,
  onStart,
  onStop
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex rounded-full bg-black/60 border border-white/15 p-1">
        <button
          type="button"
          className={`px-3 py-1.5 text-xs rounded-full ${
            mode === 'camera'
              ? 'bg-red-600 text-white'
              : 'text-white/70 hover:text-white'
          }`}
          onClick={() => onSelectMode('camera')}
          disabled={isBroadcasting}
        >
          Camera
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-xs rounded-full ${
            mode === 'screen'
              ? 'bg-red-600 text-white'
              : 'text-white/70 hover:text-white'
          }`}
          onClick={() => onSelectMode('screen')}
          disabled={isBroadcasting}
        >
          Chia sẻ màn hình
        </button>
      </div>

      {isBroadcasting ? (
        <button
          type="button"
          onClick={onStop}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-700 hover:bg-red-600 text-white text-xs font-semibold uppercase tracking-wide"
        >
          <span className="w-2 h-2 rounded-full bg-white" />
          Kết thúc phát sóng
        </button>
      ) : (
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold uppercase tracking-wide"
        >
          <span className="material-symbols-outlined text-base">
            play_arrow
          </span>
          Bắt đầu phát
        </button>
      )}
    </div>
  );
}

