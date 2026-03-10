import { useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ICE_SERVERS } from '../config/webrtc';
import { updateViewerCount } from '../services/livestreamService';

/**
 * Hook WebRTC cho phía theater (broadcaster).
 * - Nhận local media stream (camera/screen) từ component
 * - Thiết lập Supabase Realtime channel để signaling với nhiều viewer
 * - Tạo RTCPeerConnection riêng cho từng viewer
 */
export function useBroadcast(streamId) {
  const peerConnections = useRef({});
  const localStream = useRef(null);
  const channel = useRef(null);
  const viewerIds = useRef(new Set());

  const cleanupConnections = useCallback(() => {
    console.log('[Broadcast] Cleaning up connections for stream', streamId);
    Object.values(peerConnections.current).forEach((pc) => {
      try {
        pc.close();
      } catch {
        // ignore
      }
    });
    peerConnections.current = {};
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
      localStream.current = null;
    }
    if (channel.current) {
      supabase.removeChannel(channel.current);
      channel.current = null;
    }
    viewerIds.current = new Set();
  }, []);

  const createPeerForViewer = useCallback(
    async (viewerId) => {
      console.log('[Broadcast] Creating peer for viewer', viewerId, 'stream', streamId);
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnections.current[viewerId] = pc;

      // Cập nhật viewer count khi có viewer mới
      if (!viewerIds.current.has(viewerId)) {
        viewerIds.current.add(viewerId);
        const current = viewerIds.current.size;
        console.log('[Broadcast] Viewer joined, updating viewer count to', current);
        if (streamId) {
          updateViewerCount(streamId, current).catch((err) => {
            console.error('[Broadcast] Failed to update viewer count', err);
          });
        }
      }

      if (localStream.current) {
        console.log(
          '[Broadcast] Adding tracks to peer for viewer',
          viewerId,
          'tracks:',
          localStream.current.getTracks().map((t) => t.kind)
        );
        localStream.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStream.current);
        });
      }

      pc.onconnectionstatechange = () => {
        console.log(
          '[Broadcast] Peer connection state change',
          viewerId,
          pc.connectionState
        );
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          if (viewerIds.current.has(viewerId)) {
            viewerIds.current.delete(viewerId);
            const current = viewerIds.current.size;
            console.log(
              '[Broadcast] Viewer left, updating viewer count to',
              current
            );
            if (streamId) {
              updateViewerCount(streamId, current).catch((err) => {
                console.error('[Broadcast] Failed to update viewer count', err);
              });
            }
          }
        }
      };

      pc.onicecandidate = ({ candidate }) => {
        if (candidate && channel.current) {
          console.log('[Broadcast] ICE candidate from theater → viewer', viewerId);
          channel.current.send({
            type: 'broadcast',
            event: 'ice-candidate',
            payload: {
              targetId: viewerId,
              candidate: candidate.toJSON()
            }
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const offerInit = {
        type: offer.type,
        sdp: offer.sdp
      };
      console.log(
        '[Broadcast] Prepared SDP offer for viewer',
        viewerId,
        'length:',
        offerInit.sdp ? offerInit.sdp.length : 0
      );

      if (channel.current) {
        try {
          channel.current.send({
            type: 'broadcast',
            event: 'sdp-offer',
            payload: {
              targetId: viewerId,
              offer: offerInit
            }
          });
          console.log('[Broadcast] Sent SDP offer to viewer', viewerId);
        } catch (err) {
          console.error('[Broadcast] Failed to send SDP offer to viewer', viewerId, err);
        }
      }
    },
    []
  );

  const startBroadcast = useCallback(
    async (mediaStream) => {
      console.log('[Broadcast] startBroadcast for stream', streamId);
      localStream.current = mediaStream;
      console.log(
        '[Broadcast] Local stream tracks:',
        mediaStream.getTracks().map((t) => `${t.kind}:${t.id}`)
      );

      channel.current = supabase.channel(`stream:${streamId}`);
      console.log('[Broadcast] Created Supabase channel', `stream:${streamId}`);

      // Viewer yêu cầu join
      channel.current.on(
        'broadcast',
        { event: 'viewer-join' },
        async ({ payload }) => {
          const { viewerId } = payload || {};
          if (!viewerId) return;
          console.log('[Broadcast] Received viewer-join from', viewerId);
          await createPeerForViewer(viewerId);
        }
      );

      // ICE từ viewer gửi lên
      channel.current.on(
        'broadcast',
        { event: 'ice-candidate' },
        ({ payload }) => {
          const { viewerId, candidate } = payload || {};
          if (!viewerId || !candidate) return;
          console.log('[Broadcast] ICE candidate from viewer', viewerId);
          const pc = peerConnections.current[viewerId];
          if (pc) {
            pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          }
        }
      );

      // SDP answer từ viewer
      channel.current.on(
        'broadcast',
        { event: 'sdp-answer' },
        async ({ payload }) => {
          const { viewerId, answer } = payload || {};
          if (!viewerId || !answer) return;
          console.log('[Broadcast] Received SDP answer from viewer', viewerId);
          const pc = peerConnections.current[viewerId];
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        }
      );

      const subscribedChannel = await channel.current.subscribe();
      console.log('[Broadcast] Supabase channel subscribed for stream', streamId);

      // Thông báo cho mọi viewer rằng broadcaster đã sẵn sàng
      subscribedChannel.send({
        type: 'broadcast',
        event: 'broadcaster-ready',
        payload: {
          streamId
        }
      });
      console.log('[Broadcast] Sent broadcaster-ready for stream', streamId);
    },
    [createPeerForViewer, streamId]
  );

  const stopBroadcast = useCallback(() => {
    cleanupConnections();
  }, [cleanupConnections]);

  useEffect(() => {
    return () => {
      cleanupConnections();
    };
  }, [cleanupConnections]);

  return {
    startBroadcast,
    stopBroadcast,
    localStream,
    peerConnections
  };
}

