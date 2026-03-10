import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile } from '../../lib/supabase';
import {
  getLivestreamComments,
  addLivestreamComment,
  subscribeLivestreamComments
} from '../../services/livestreamService';

function getDisplayName(c, { theaterOwnerId, theaterName, currentUserId }) {
  if (c.user_id === theaterOwnerId) return theaterName || 'Nhà hát';
  const p = c.profile;
  const name = p?.full_name || p?.email;
  if (name) return name;
  return c.user_id === currentUserId ? 'Bạn' : 'Khán giả';
}

export default function ChatPanel({ streamId, chatEnabled = true, theaterOwnerId = null, theaterName = '' }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const displayOpts = { theaterOwnerId, theaterName, currentUserId: user?.id ?? null };

  // Load initial comments + subscribe realtime
  useEffect(() => {
    if (!chatEnabled || !streamId) return;

    let cancelled = false;

    const loadInitial = async () => {
      try {
        const data = await getLivestreamComments(streamId);
        if (!cancelled) setComments(data || []);
      } catch (err) {
        if (!cancelled) setError('Không thể tải bình luận.');
      }
    };

    loadInitial();

    const channel = subscribeLivestreamComments(streamId, (newComment) => {
      setComments((prev) => {
        if (prev.some((c) => c.id === newComment.id)) return prev;
        return [...prev, newComment];
      });
      if (newComment.user_id && newComment.user_id !== theaterOwnerId) {
        getUserProfile(newComment.user_id)
          .then((profile) => {
            setComments((prev) =>
              prev.map((c) => (c.id === newComment.id ? { ...c, profile } : c))
            );
          })
          .catch(() => {});
      }
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [streamId, chatEnabled, theaterOwnerId]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !streamId || sending) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      livestream_id: streamId,
      user_id: user?.id ?? null,
      message: text,
      created_at: new Date().toISOString()
    };
    setComments((prev) => [...prev, optimistic]);
    setInput('');
    setSending(true);
    setError(null);

    try {
      const saved = await addLivestreamComment(streamId, text, user?.id ?? null);
      setComments((prev) =>
        prev.map((c) => (c.id === tempId ? saved : c))
      );
    } catch (err) {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setError(err.message || 'Không thể gửi bình luận. Vui lòng đăng nhập.');
    } finally {
      setSending(false);
    }
  }, [streamId, user?.id, input, sending]);

  if (!chatEnabled) {
    return null;
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl flex flex-col h-full h-[600px]">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Bình luận</h3>
        <span className="text-xs text-white/50">
          {comments.length} bình luận
        </span>
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-red-400 bg-red-900/20 border-b border-red-500/30">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-sm custom-scrollbar">
        {comments.length === 0 ? (
          <p className="text-white/40 text-center mt-6 text-xs">
            Chưa có bình luận nào. Hãy là người mở lời đầu tiên!
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex flex-col">
              <span className="text-[11px] text-amber-300 font-semibold">
                {getDisplayName(c, displayOpts)}
              </span>
              <span className="text-white/90">{c.message}</span>
            </div>
          ))
        )}
      </div>

      <div className="px-3 py-2 border-t border-white/10 flex items-center gap-2">
        <input
          type="text"
          value={input}
          placeholder="Gửi bình luận của bạn..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={sending}
          className="flex-1 bg-black/50 border border-white/10 rounded-full px-3 py-2 text-xs text-white outline-none focus:border-amber-400/80 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={sending}
          className="px-3 py-2 rounded-full bg-amber-500 text-xs font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-60"
        >
          {sending ? '...' : 'Gửi'}
        </button>
      </div>
    </div>
  );
}

