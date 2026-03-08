import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function ChatPanel({ streamId, chatEnabled = true }) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!chatEnabled || !streamId) return;

    const channel = supabase
      .channel(`chat:${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'livestream_messages',
          filter: `livestream_id=eq.${streamId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, chatEnabled]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !streamId) return;
    const displayName =
      profile?.full_name || profile?.display_name || profile?.email || 'Khách';

    await supabase.from('livestream_messages').insert({
      livestream_id: streamId,
      display_name: displayName,
      message: text
    });

    setInput('');
  };

  if (!chatEnabled) {
    return null;
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl flex flex-col h-full max-h-[420px]">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Chat trực tiếp</h3>
        <span className="text-xs text-white/50">
          {messages.length} tin nhắn
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 text-sm custom-scrollbar">
        {messages.length === 0 ? (
          <p className="text-white/40 text-center mt-6 text-xs">
            Chưa có tin nhắn nào. Hãy là người mở lời đầu tiên!
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex flex-col">
              <span className="text-[11px] text-amber-300 font-semibold">
                {m.display_name}
              </span>
              <span className="text-white/90">{m.message}</span>
            </div>
          ))
        )}
      </div>

      <div className="px-3 py-2 border-t border-white/10 flex items-center gap-2">
        <input
          type="text"
          value={input}
          placeholder="Gửi lời chào đến nhà hát..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 bg-black/50 border border-white/10 rounded-full px-3 py-2 text-xs text-white outline-none focus:border-amber-400/80"
        />
        <button
          type="button"
          onClick={sendMessage}
          className="px-3 py-2 rounded-full bg-amber-500 text-xs font-semibold text-black hover:bg-amber-400 transition-colors"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}

