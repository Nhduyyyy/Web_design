import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../Header';
import { useViewer } from '../../hooks/useViewer';
import { getLivestreamById, subscribeLivestreamUpdates } from '../../services/livestreamService';
import ChatPanel from './ChatPanel';
import ViewerCount from './ViewerCount';

export default function LivestreamWatch() {
  const { id: streamId } = useParams();
  const videoRef = useRef(null);
  const { remoteStream } = useViewer(streamId);
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('watch');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getLivestreamById(streamId);
        console.log('[ViewerPage] Loaded stream data', data);
        setStream(data);
      } catch (err) {
        console.error('Error loading livestream', err);
        setError('Không tìm thấy livestream hoặc đã kết thúc.');
      } finally {
        setLoading(false);
      }
    };
    if (streamId) load();
  }, [streamId]);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      console.log('[ViewerPage] Attaching remoteStream to video element');
      videoRef.current.srcObject = remoteStream;
    } else if (!remoteStream) {
      console.log('[ViewerPage] remoteStream is null, waiting for tracks...');
    }
  }, [remoteStream]);

  useEffect(() => {
    if (!streamId) return;
    const channel = subscribeLivestreamUpdates(streamId, (payload) => {
      if (payload?.new) {
        console.log('[ViewerPage] Livestream status update', payload.new);
        setStream((prev) => ({ ...(prev || {}), ...payload.new }));
      }
    });
    return () => {
      if (channel) {
        // Supabase client will handle cleanup; optional explicit remove
      }
    };
  }, [streamId]);

  if (loading) {
    return (
      <div className="live-stream-page">
        <div className="container">
          <p className="text-center text-white/70 mt-10 text-sm">
            Đang tải livestream...
          </p>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="live-stream-page">
        <div className="container">
          <div className="stream-error mt-10">{error}</div>
        </div>
      </div>
    );
  }

  const isLive = stream.status === 'live';

  return (
    <div className="flex flex-col min-h-screen live-stream-page has-fixed-header">
      <Header activeSection={activeSection} setActiveSection={setActiveSection} />

      <div className="flex-1">
        <div className="container">
        <div className="grid lg:grid-cols-[2fr,1fr] gap-6 items-start">
          <div className="space-y-4">
            {/* Player */}
            <div className="bg-black/70 border border-white/10 rounded-2xl overflow-hidden">
              <div className="bg-black aspect-video relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  controls
                  className="w-full h-full object-contain bg-black"
                />
                {!remoteStream && (
                  <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
                    Đang chờ tín hiệu từ nhà hát...
                  </div>
                )}
              </div>
            </div>

            {/* Title + meta (YouTube-like) */}
            <div className="bg-black/60 border border-white/10 rounded-2xl p-4 md:p-5">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-base md:text-lg font-semibold text-white leading-snug truncate">
                      {stream.title}
                    </h1>
                    <p className="text-xs text-white/60 mt-1 line-clamp-2">
                      {stream.description ||
                        'Buổi diễn trực tiếp nghệ thuật Tuồng Việt Nam.'}
                    </p>
                  </div>

                  <div className="flex items-end gap-2 shrink-0">
                    {isLive && (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 text-[10px] font-semibold uppercase tracking-wide"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Live
                      </motion.div>
                    )}
                    <ViewerCount current={stream.current_viewers || 0} />
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                <div className="grid sm:grid-cols-3 gap-2 text-sm text-white/80">
                  {stream.start_time && (
                    <p className="sm:col-span-1">
                      <span className="text-white/50 mr-1">Bắt đầu:</span>
                      {new Date(stream.start_time).toLocaleString('vi-VN')}
                    </p>
                  )}
                  {stream.end_time && (
                    <p className="sm:col-span-1">
                      <span className="text-white/50 mr-1">Kết thúc dự kiến:</span>
                      {new Date(stream.end_time).toLocaleString('vi-VN')}
                    </p>
                  )}
                  {stream.price > 0 && (
                    <p className="sm:col-span-1">
                      <span className="text-white/50 mr-1">Giá vé:</span>
                      {stream.price.toLocaleString('vi-VN')}₫
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <ChatPanel
            streamId={streamId}
            chatEnabled={stream.chat_enabled ?? true}
            theaterOwnerId={stream.theater?.owner_id ?? null}
            theaterName={stream.theater?.name ?? ''}
          />
        </div>
      </div>
      </div>

      <footer className="mt-auto border-t border-border-gold p-6 text-center bg-surface-dark">
        <p className="text-slate-500 text-sm">
          © 2024 Tuồng Platform Vietnam. Livestream Theater Console.
        </p>
      </footer>
    </div>
  );
}

