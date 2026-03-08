import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getLivestreams } from '../../services/livestreamService';
import '../LiveStream.css';

export default function LivestreamList() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getLivestreams();
        setStreams(data || []);
      } catch (err) {
        console.error('Error loading livestreams', err);
        setError('Không thể tải danh sách livestream. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const liveStreams = streams.filter((s) => s.status === 'live');
  const scheduledStreams = streams.filter(
    (s) => s.status === 'scheduled' || s.status === 'upcoming'
  );

  const handleWatch = (stream) => {
    navigate(`/livestreams/${stream.id}`);
  };

  if (loading) {
    return (
      <div className="live-stream-page">
        <div className="container">
          <p className="text-center text-white/70 mt-10 text-sm">
            Đang tải danh sách livestream...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="live-stream-page">
      <div className="container">
        <section className="live-streams-section">
          <header className="ls-header">
            <h1 className="ls-header-title">Livestream Tuồng Việt Nam</h1>
            <p className="ls-header-desc">
              Danh sách buổi diễn đang phát trực tiếp và sắp diễn ra từ các
              nhà hát đối tác.
            </p>
          </header>

          {error && (
            <div className="stream-error">
              {error}
            </div>
          )}

          {liveStreams.length === 0 && scheduledStreams.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📺</div>
              <p>Hiện chưa có livestream nào được lên lịch.</p>
              <p className="empty-subtitle">
                Khi nhà hát tạo buổi phát sóng, bạn sẽ thấy tại đây.
              </p>
            </div>
          ) : (
            <div className="streams-grid">
              {[...liveStreams, ...scheduledStreams].map((stream) => (
                <motion.div
                  key={stream.id}
                  className={`stream-card ${
                    stream.status === 'live' ? 'live' : 'upcoming'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  onClick={() => handleWatch(stream)}
                >
                  <div className="stream-thumbnail cinematic-gradient">
                    <img
                      src={
                        stream.thumbnail_url ||
                        '/backgrounds/bec029d1937648da5a7c3ac4205a7af3.jpg'
                      }
                      alt={stream.title}
                    />
                    {stream.status === 'live' ? (
                      <div className="live-badge">
                        <span className="live-dot" />
                        ĐANG PHÁT TRỰC TIẾP
                      </div>
                    ) : (
                      <div className="upcoming-badge">SẮP PHÁT SÓNG</div>
                    )}
                    {stream.price > 0 && (
                      <div className="price-badge">
                        {stream.price.toLocaleString('vi-VN')}₫
                      </div>
                    )}
                  </div>
                  <div className="stream-info">
                    <h3>{stream.title}</h3>
                    <p className="stream-description">
                      {stream.description || 'Buổi diễn trực tiếp nghệ thuật Tuồng.'}
                    </p>
                    <div className="stream-meta">
                      <div className="meta-item">
                        <span className="meta-icon" aria-hidden />
                        <span>
                          {stream.current_viewers != null
                            ? `${stream.current_viewers.toLocaleString(
                                'vi-VN'
                              )} người đang xem`
                            : 'Đang cập nhật'}
                        </span>
                      </div>
                      {stream.start_time && (
                        <div className="meta-item">
                          <span className="meta-icon" aria-hidden />
                          <span>
                            {new Date(stream.start_time).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className={
                        stream.status === 'live'
                          ? 'btn-watch-live'
                          : 'btn-watch-upcoming'
                      }
                    >
                      {stream.status === 'live'
                        ? 'Vào xem ngay'
                        : 'Xem chi tiết'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

