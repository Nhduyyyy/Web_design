export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
    // TURN server có thể thêm sau khi có cấu hình env:
    // {
    //   urls: import.meta.env.VITE_TURN_URL,
    //   username: import.meta.env.VITE_TURN_USERNAME,
    //   credential: import.meta.env.VITE_TURN_CREDENTIAL
    // }
  ]
};

