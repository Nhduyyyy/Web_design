import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBroadcast } from '../../hooks/useBroadcast';
import { getLivestreamById, startLivestream, endLivestream, subscribeLivestreamUpdates } from '../../services/livestreamService';
import TheaterHeader from './TheaterHeader';
import ChatPanel from '../Livestream/ChatPanel';
import BroadcastControls from '../Livestream/BroadcastControls';
import ViewerCount from '../Livestream/ViewerCount';

export default function LivestreamBroadcast() {
  const { id: streamId } = useParams();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [mode, setMode] = useState('camera'); // camera | screen
  const { startBroadcast, stopBroadcast, localStream } = useBroadcast(streamId);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getLivestreamById(streamId);
        console.log('[BroadcastPage] Loaded stream data', data);
        setStream(data);
      } catch (err) {
        console.error('Error loading livestream for broadcast', err);
        setError('Không tìm thấy livestream để phát.');
      } finally {
        setLoading(false);
      }
    };
    if (streamId) load();
  }, [streamId]);

  // Realtime cập nhật viewer count và status cho theater
  useEffect(() => {
    if (!streamId) return;

    const channel = subscribeLivestreamUpdates(streamId, (payload) => {
      if (payload?.new) {
        setStream((prev) => ({ ...(prev || {}), ...payload.new }));
      }
    });

    return () => {
      if (channel) {
        // Supabase client sẽ tự quản lý cleanup; để phòng trường hợp cần, có thể gọi removeChannel
      }
    };
  }, [streamId]);

  // Gán local stream lên video preview khi đã có
  useEffect(() => {
    if (videoRef.current && localStream.current) {
      console.log('[BroadcastPage] Attaching localStream to video element');
      videoRef.current.srcObject = localStream.current;
    }
  }, [localStream]);

  const getCameraStream = async () => {
    return navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, frameRate: 30 },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }
    });
  };

  const getScreenStream = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: true
    });

    if (!stream.getAudioTracks().length) {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      const [track] = mic.getAudioTracks();
      if (track) {
        stream.addTrack(track);
      }
    }

    return stream;
  };

  const handleStart = async () => {
    try {
      const mediaStream =
        mode === 'screen' ? await getScreenStream() : await getCameraStream();
      // Hiển thị preview ngay cho theater
      if (videoRef.current) {
        console.log('[BroadcastPage] Setting preview video srcObject from mediaStream');
        videoRef.current.srcObject = mediaStream;
      }
      await startBroadcast(mediaStream);
      await startLivestream(streamId);
      setStream((prev) => ({ ...(prev || {}), status: 'live' }));
      setIsBroadcasting(true);
    } catch (err) {
      console.error('Cannot start broadcast', err);
      setError('Không thể khởi động livestream. Vui lòng kiểm tra quyền camera/micro.');
    }
  };

  const handleStop = async () => {
    try {
      await endLivestream(streamId);
      stopBroadcast();
      setStream((prev) => ({ ...(prev || {}), status: 'ended', current_viewers: 0 }));
      setIsBroadcasting(false);
    } catch (err) {
      console.error('Cannot stop broadcast', err);
    }
  };

  if (loading) {
    return (
      <div className="live-stream-page">
        <div className="container">
          <p className="text-center text-white/70 mt-10 text-sm">
            Đang tải phòng phát trực tiếp...
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

  return (
    <div className="flex flex-col live-stream-page">
      <TheaterHeader theater={stream?.theater} />

      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6 items-start">
          <main className="min-w-0 space-y-4 lg:order-1 order-1">
            <div className="flex flex-col bg-black/80 border border-white/10 rounded-2xl overflow-hidden h-[600px]">
              <div className="flex-1 flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div>
                  <h1 className="text-base md:text-lg font-semibold text-white">
                    Phát sóng: {stream.title}
                  </h1>
                  <p className="text-xs text-white/60 mt-1">
                    Hãy chọn nguồn tín hiệu (camera hoặc màn hình) và nhấn{' '}
                    <span className="font-semibold text-red-400">Bắt đầu phát</span>.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {stream.status === 'live' && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600 text-[10px] font-semibold uppercase tracking-wide"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Đang phát
                    </motion.div>
                  )}
                  <ViewerCount current={stream.current_viewers || 0} />
                </div>
              </div>

              <div className="mt-auto p-4 flex flex-col gap-3">
                <BroadcastControls
                  isBroadcasting={isBroadcasting}
                  mode={mode}
                  onSelectMode={setMode}
                  onStart={handleStart}
                  onStop={handleStop}
                />

                <div className="bg-black border border-white/10 rounded-xl overflow-hidden">
                  <div className="aspect-video relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      controls
                      className="w-full h-full object-contain bg-black"
                    />
                    {!localStream.current && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 text-sm">
                        <span className="mb-1">
                          Xem trước tín hiệu phát (camera/màn hình) sẽ hiển thị tại đây.
                        </span>
                        <span className="text-xs text-white/40">
                          Trình duyệt có thể yêu cầu quyền truy cập camera/micro.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>

          <aside className="lg:order-2 order-2 min-w-0 lg:sticky lg:top-24">
            <div className="bg-black/70 border border-white/10 rounded-2xl overflow-hidden">
              <ChatPanel
                streamId={streamId}
                chatEnabled={stream.chat_enabled ?? true}
                theaterOwnerId={stream.theater?.owner_id ?? null}
                theaterName={stream.theater?.name ?? ''}
              />
            </div>
          </aside>
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

