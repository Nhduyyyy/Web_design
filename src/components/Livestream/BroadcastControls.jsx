import { Link } from 'react-router-dom';

export default function BroadcastControls({
  isBroadcasting,
  mode,
  onSelectMode,
  onStart,
  onStop
}) {
  const tabs = [
    { id: 'camera', label: 'Camera', icon: 'videocam' },
    { id: 'screen', label: 'Chia sẻ màn hình', icon: 'screen_share' }
  ];

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Link
        to="/theater/livestreams"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm bg-surface-dark text-slate-300 hover:text-slate-100 hover:bg-surface-dark/80 border border-transparent hover:border-slate-600 transition-all"
      >
        <span className="material-symbols-outlined text-[1.1rem]">arrow_back</span>
        Quản lý livestream
      </Link>
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectMode(tab.id)}
            disabled={isBroadcasting}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold whitespace-nowrap transition-all ${
              mode === tab.id
                ? 'bg-primary text-background-dark shadow-[0_0_15px_rgba(255,215,0,0.2)]'
                : 'bg-surface-dark text-slate-400 hover:text-slate-100 hover:bg-surface-dark/80 border border-transparent hover:border-slate-600'
            } ${isBroadcasting ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <span className="material-symbols-outlined text-[1.1rem]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {isBroadcasting ? (
        <button
          type="button"
          onClick={onStop}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-red-700 hover:bg-red-600 text-white text-sm font-bold transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Kết thúc phát sóng
        </button>
      ) : (
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold transition-all"
        >
          <span className="material-symbols-outlined text-[1.1rem]">play_arrow</span>
          Bắt đầu phát
        </button>
      )}
    </div>
  );
}

