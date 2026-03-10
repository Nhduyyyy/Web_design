import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TheaterHeader from './TheaterHeader';
import { getTheatersByOwner } from '../../services/theaterService';
import {
  getLivestreams,
  deleteLivestream,
  startLivestream,
  endLivestream
} from '../../services/livestreamService';

const statusLabels = {
  scheduled: { label: 'Đã lên lịch', className: 'bg-yellow-500/15 text-yellow-300' },
  upcoming: { label: 'Sắp phát', className: 'bg-yellow-500/15 text-yellow-300' },
  live: { label: 'Đang phát', className: 'bg-red-600/20 text-red-400' },
  ended: { label: 'Đã kết thúc', className: 'bg-slate-600/20 text-slate-300' },
  cancelled: { label: 'Đã hủy', className: 'bg-slate-700/30 text-slate-400' }
};

export default function TheaterLivestreams() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [theater, setTheater] = useState(null);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);

        const theaters = await getTheatersByOwner(user.id);
        if (!theaters || theaters.length === 0) {
          setError('Bạn chưa có Nhà hát. Hãy hoàn tất đăng ký Nhà hát trước.');
          setLoading(false);
          return;
        }
        const t = theaters[0];
        setTheater(t);

        const data = await getLivestreams({ theaterId: t.id });
        setStreams(data || []);
      } catch (err) {
        console.error('Error loading theater livestreams', err);
        setError('Không thể tải danh sách livestream. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const handleCreate = () => {
    navigate('/theater/livestreams/create');
  };

  const handleBroadcast = (streamId) => {
    navigate(`/theater/livestreams/${streamId}/broadcast`);
  };

  const handleToggleLive = async (stream) => {
    try {
      if (stream.status === 'live') {
        await endLivestream(stream.id);
      } else {
        await startLivestream(stream.id);
      }
      const data = await getLivestreams({ theaterId: theater.id });
      setStreams(data || []);
    } catch (err) {
      console.error('Error toggling live status', err);
      alert('Không thể cập nhật trạng thái livestream.');
    }
  };

  const handleDelete = async (streamId) => {
    if (!window.confirm('Bạn có chắc muốn xóa livestream này?')) return;
    try {
      await deleteLivestream(streamId);
      setStreams((prev) => prev.filter((s) => s.id !== streamId));
    } catch (err) {
      console.error('Error deleting livestream', err);
      alert('Không thể xóa livestream.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <TheaterHeader theater={theater} />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-50">
              Quản lý Livestream
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Tạo, quản lý và bắt đầu buổi phát trực tiếp nghệ thuật Tuồng từ Nhà hát của bạn.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg gold-gradient text-background-dark font-semibold text-sm hover:brightness-110 transition-all inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            Thêm live mới
          </button>
        </header>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center text-slate-400 text-sm">
              Đang tải danh sách livestream...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-900/20 border border-red-500/60 text-red-200 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error && streams.length === 0 && (
          <div className="bg-surface-dark border border-border-gold rounded-xl px-6 py-10 text-center text-slate-300">
            <div className="text-3xl mb-3">📡</div>
            <h2 className="text-lg font-semibold mb-2">Chưa có livestream nào</h2>
            <p className="text-sm text-slate-400 mb-4">
              Hãy tạo buổi phát trực tiếp đầu tiên cho Nhà hát của bạn.
            </p>
            <button
              type="button"
              onClick={handleCreate}
              className="px-4 py-2 rounded-lg gold-gradient text-background-dark font-semibold text-sm hover:brightness-110 transition-all inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Tạo livestream mới
            </button>
          </div>
        )}

        {!loading && !error && streams.length > 0 && (
          <div className="bg-surface-dark border border-border-gold rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border-gold flex items-center justify-between">
              <span className="text-sm text-slate-200 font-semibold">
                Livestream của Nhà hát {theater?.name || ''}
              </span>
              <span className="text-xs text-slate-400">
                Tổng cộng {streams.length} buổi phát
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-background-dark/60 text-slate-300">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Tiêu đề</th>
                    <th className="px-4 py-2 text-left font-medium">Thời gian</th>
                    <th className="px-4 py-2 text-left font-medium">Truy cập</th>
                    <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                    <th className="px-4 py-2 text-right font-medium">Người xem</th>
                    <th className="px-4 py-2 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {streams.map((s) => {
                    const status = statusLabels[s.status] || statusLabels.scheduled;
                    return (
                      <tr
                        key={s.id}
                        className="border-t border-white/5 hover:bg-background-dark/60 transition-colors"
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-slate-50 line-clamp-2">
                            {s.title}
                          </div>
                          {s.description && (
                            <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                              {s.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-300">
                          {s.start_time ? (
                            <div className="flex flex-col gap-0.5">
                              <span>
                                {new Date(s.start_time).toLocaleDateString('vi-VN')}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(s.start_time).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">Chưa đặt</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-slate-300">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs uppercase tracking-wide text-slate-400">
                              {s.access_type || 'free'}
                            </span>
                            <span className="text-sm font-semibold text-amber-300">
                              {s.price
                                ? `${s.price.toLocaleString('vi-VN')}₫`
                                : 'Miễn phí'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-right text-slate-300">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-sm">
                              {s.current_viewers != null
                                ? s.current_viewers.toLocaleString('vi-VN')
                                : 0}
                            </span>
                            <span className="text-xs text-slate-500">
                              Tổng: {s.total_views?.toLocaleString('vi-VN') || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleBroadcast(s.id)}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/20 text-primary hover:bg-primary/30 transition-colors inline-flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-base">
                                radio
                              </span>
                              Phát sóng
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleLive(s)}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-100 hover:bg-slate-600 transition-colors"
                            >
                              {s.status === 'live' ? 'Kết thúc' : 'Đánh dấu Live'}
                            </button>
                            <Link
                              to={`/livestreams/${s.id}`}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-background-dark text-slate-200 hover:bg-slate-800 transition-colors"
                            >
                              Xem như viewer
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(s.id)}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-900/40 text-red-300 hover:bg-red-800/60 transition-colors"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-border-gold p-6 text-center bg-surface-dark">
        <p className="text-slate-500 text-sm">
          © 2024 Tuồng Platform Vietnam. Livestream Theater Console.
        </p>
      </footer>
    </div>
  );
}

