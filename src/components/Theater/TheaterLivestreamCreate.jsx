import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../contexts/AuthContext';
import TheaterHeader from './TheaterHeader';
import { getTheatersByOwner } from '../../services/theaterService';
import { createLivestream } from '../../services/livestreamService';

export default function TheaterLivestreamCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [theater, setTheater] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [accessType, setAccessType] = useState('free');
  const [price, setPrice] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const theaters = await getTheatersByOwner(user.id);
        if (!theaters || theaters.length === 0) {
          setError('Bạn chưa có Nhà hát. Hãy hoàn tất đăng ký Nhà hát trước.');
          setLoading(false);
          return;
        }
        setTheater(theaters[0]);
      } catch (err) {
        console.error('Error loading theater for livestream create', err);
        setError('Không thể tải thông tin Nhà hát.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!theater) return;

    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề livestream.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const roomId = uuidv4();
      const parsedPrice =
        accessType === 'free' ? 0 : Number.isNaN(Number(price)) ? 0 : Number(price);

      const start =
        startTime && !Number.isNaN(Date.parse(startTime))
          ? new Date(startTime).toISOString()
          : new Date().toISOString();

      const livestream = await createLivestream({
        theater_id: theater.id,
        title: title.trim(),
        description: description.trim() || null,
        stream_url: roomId,
        stream_key: uuidv4(),
        start_time: start,
        status: 'scheduled',
        access_type: accessType,
        price: parsedPrice,
        chat_enabled: true,
        current_viewers: 0,
        total_views: 0,
        peak_viewers: 0
      });

      navigate(`/theater/livestreams/${livestream.id}/broadcast`);
    } catch (err) {
      console.error('Error creating livestream', err);
      setError(err.message || 'Không thể tạo livestream.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
      <TheaterHeader theater={theater} />

      <main className="flex-1 max-w-3xl mx-auto px-4 py-6 space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-50">
              Tạo Livestream mới
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Thiết lập tiêu đề, thời gian và chế độ truy cập cho buổi phát trực tiếp.
            </p>
          </div>
        </header>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center text-slate-400 text-sm">
              Đang tải thông tin Nhà hát...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-900/20 border border-red-500/60 text-red-200 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error && (
          <form
            onSubmit={handleSubmit}
            className="bg-surface-dark border border-border-gold rounded-xl px-6 py-6 space-y-5"
          >
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                Tiêu đề buổi livestream
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg bg-background-dark border border-border-gold px-3 py-2 text-sm text-slate-100"
                placeholder="Ví dụ: Tuồng Sơn Hậu - Đêm diễn đặc biệt"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                Mô tả
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg bg-background-dark border border-border-gold px-3 py-2 text-sm text-slate-100 resize-none"
                placeholder="Giới thiệu nội dung buổi diễn, nghệ sĩ tham gia, thời lượng..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Thời gian bắt đầu (dự kiến)
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg bg-background-dark border border-border-gold px-3 py-2 text-sm text-slate-100"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Nếu để trống, hệ thống sẽ lấy thời gian hiện tại.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Kiểu truy cập
                </label>
                <select
                  value={accessType}
                  onChange={(e) => setAccessType(e.target.value)}
                  className="w-full rounded-lg bg-background-dark border border-border-gold px-3 py-2 text-sm text-slate-100"
                >
                  <option value="free">Miễn phí</option>
                  <option value="paid">Trả phí</option>
                  <option value="subscribers_only">Chỉ cho người đăng ký</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                Giá vé (nếu trả phí)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={accessType === 'free'}
                  className="w-full rounded-lg bg-background-dark border border-border-gold px-3 py-2 text-sm text-slate-100"
                />
                <span className="text-sm text-slate-400">VNĐ</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Để 0 nếu miễn phí hoặc dùng chế độ có quảng cáo/đăng ký.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/theater/livestreams')}
                className="px-4 py-2 rounded-lg border border-border-gold text-sm text-slate-200 hover:bg-background-dark transition-colors"
                disabled={saving}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg gold-gradient text-background-dark font-semibold text-sm hover:brightness-110 transition-all inline-flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 border-2 border-background-dark/40 border-t-background-dark rounded-full animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">
                      check_circle
                    </span>
                    Tạo livestream
                  </>
                )}
              </button>
            </div>
          </form>
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

