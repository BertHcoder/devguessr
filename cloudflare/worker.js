// Puts devguessr.itaanhuys.com in front of the Render service. Every request, including the
// Socket.IO WebSocket upgrade, is forwarded as-is; the game server itself stays on Render.
const ORIGIN = 'https://devguessr.onrender.com';

export default {
  fetch(request) {
    const url = new URL(request.url);
    return fetch(new Request(ORIGIN + url.pathname + url.search, request));
  },
};
