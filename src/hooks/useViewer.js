import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { ICE_SERVERS } from '../config/webrtc';

/**
 * Hook WebRTC cho phía viewer.
 * - Tạo RTCPeerConnection nhận media từ theater
 * - Dùng Supabase Realtime Broadcast làm signaling layer
 */
export function useViewer(streamId) {
  const [remoteStream, setRemoteStream] = useState(null);
  const pc = useRef(null);
  const channel = useRef(null);
  const viewerId = useRef(uuidv4());

  const cleanup = useCallback(() => {
    console.log('[Viewer] Cleanup for stream', streamId, 'viewer', viewerId.current);
    if (pc.current) {
      try {
        pc.current.close();
      } catch {
        // ignore
      }
      pc.current = null;
    }
    if (channel.current) {
      supabase.removeChannel(channel.current);
      channel.current = null;
    }
    setRemoteStream(null);
  }, []);

  const joinStream = useCallback(async () => {
    if (!streamId) return;

    console.log('[Viewer] joinStream for stream', streamId, 'viewer', viewerId.current);
    pc.current = new RTCPeerConnection(ICE_SERVERS);
    console.log('[Viewer] Using ICE_SERVERS', ICE_SERVERS);
    channel.current = supabase.channel(`stream:${streamId}`);
    console.log('[Viewer] Created RTCPeerConnection and channel', `stream:${streamId}`);

    pc.current.ontrack = ({ streams }) => {
      if (streams && streams[0]) {
        console.log('[Viewer] ontrack received, attaching remote stream');
        setRemoteStream(streams[0]);
      }
    };

    // Log tất cả broadcast event trên channel này để debug
    channel.current.on(
      'broadcast',
      { event: '*' },
      ({ event, payload }) => {
        console.log('[Viewer] Broadcast event received', event, payload);
      }
    );

    // Khi broadcaster thông báo đã sẵn sàng, gửi lại viewer-join
    channel.current.on(
      'broadcast',
      { event: 'broadcaster-ready' },
      () => {
        console.log('[Viewer] Received broadcaster-ready, sending viewer-join again');
        channel.current.send({
          type: 'broadcast',
          event: 'viewer-join',
          payload: {
            viewerId: viewerId.current
          }
        });
      }
    );

    // Nhận SDP offer từ theater
    channel.current.on(
      'broadcast',
      { event: 'sdp-offer' },
      async ({ payload }) => {
        console.log('[Viewer] Received sdp-offer payload', payload);
        if (!payload || payload.targetId !== viewerId.current) return;
        const { offer } = payload;
        if (!offer) return;

        try {
          // offer là RTCSessionDescriptionInit ({ type, sdp })
          await pc.current.setRemoteDescription(offer);
          console.log('[Viewer] Remote description set from offer');
          const answer = await pc.current.createAnswer();
          await pc.current.setLocalDescription(answer);
          console.log(
            '[Viewer] Local description set with answer, sending sdp-answer'
          );

          channel.current.send({
            type: 'broadcast',
            event: 'sdp-answer',
            payload: {
              viewerId: viewerId.current,
              answer
            }
          });
        } catch (err) {
          console.error('[Viewer] Error handling sdp-offer', err);
        }
      }
    );

    // ICE từ theater xuống
    channel.current.on(
      'broadcast',
      { event: 'ice-candidate' },
      ({ payload }) => {
        if (!payload || payload.targetId !== viewerId.current) return;
        const { candidate } = payload;
        if (!candidate) return;
        console.log('[Viewer] ICE candidate from theater');
        pc.current
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch(() => {});
      }
    );

    // ICE gửi lên theater
    pc.current.onicecandidate = ({ candidate }) => {
      if (candidate && channel.current) {
        console.log('[Viewer] Local ICE candidate generated, sending to theater');
        channel.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            viewerId: viewerId.current,
            candidate: candidate.toJSON()
          }
        });
      }
    };

    await channel.current.subscribe();
    console.log('[Viewer] Supabase channel subscribed for stream', streamId);

    // Báo theater biết viewer join (lần đầu), phòng trường hợp broadcaster đã sẵn sàng
    channel.current.send({
      type: 'broadcast',
      event: 'viewer-join',
      payload: {
        viewerId: viewerId.current
      }
    });

  }, [streamId]);

  useEffect(() => {
    joinStream();
    return () => {
      cleanup();
    };
  }, [joinStream, cleanup]);

  return {
    remoteStream
  };
}

