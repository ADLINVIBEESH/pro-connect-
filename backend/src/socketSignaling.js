/**
 * Socket.IO signaling handler for WebRTC video calls.
 *
 * Each "room" is a conversation ID. When a user joins a room the server
 * relays WebRTC offers, answers and ICE candidates to the other participant
 * so a peer-to-peer media connection can be established.
 */

function attachSignaling(io) {
  io.on("connection", (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // ── Join a conversation room ────────────────────────────────────────
    socket.on("join-room", (roomId, userId) => {
      if (!roomId || !userId) return;
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userId = userId;
      console.log(`[socket] ${userId} joined room ${roomId}`);

      // Let the other participant(s) know someone joined
      socket.to(roomId).emit("user-joined", { userId, socketId: socket.id });
    });

    // ── WebRTC offer ────────────────────────────────────────────────────
    socket.on("webrtc-offer", ({ roomId, offer }) => {
      console.log(`[socket] offer from ${socket.id} in room ${roomId}`);
      socket.to(roomId).emit("webrtc-offer", {
        offer,
        from: socket.id,
      });
    });

    // ── WebRTC answer ───────────────────────────────────────────────────
    socket.on("webrtc-answer", ({ roomId, answer }) => {
      console.log(`[socket] answer from ${socket.id} in room ${roomId}`);
      socket.to(roomId).emit("webrtc-answer", {
        answer,
        from: socket.id,
      });
    });

    // ── ICE candidate ───────────────────────────────────────────────────
    socket.on("ice-candidate", ({ roomId, candidate }) => {
      socket.to(roomId).emit("ice-candidate", {
        candidate,
        from: socket.id,
      });
    });

    // ── Call ended ──────────────────────────────────────────────────────
    socket.on("call-ended", ({ roomId }) => {
      console.log(`[socket] call-ended by ${socket.id} in room ${roomId}`);
      socket.to(roomId).emit("call-ended", { from: socket.id });
    });

    // ── Screen sharing notifications ────────────────────────────────────
    socket.on("screen-share-started", ({ roomId }) => {
      socket.to(roomId).emit("screen-share-started", { from: socket.id });
    });

    socket.on("screen-share-stopped", ({ roomId }) => {
      socket.to(roomId).emit("screen-share-stopped", { from: socket.id });
    });

    // ── Renegotiation (needed when adding/removing screen-share track) ─
    socket.on("webrtc-renegotiate-offer", ({ roomId, offer }) => {
      console.log(`[socket] renegotiate-offer from ${socket.id}`);
      socket.to(roomId).emit("webrtc-renegotiate-offer", {
        offer,
        from: socket.id,
      });
    });

    socket.on("webrtc-renegotiate-answer", ({ roomId, answer }) => {
      console.log(`[socket] renegotiate-answer from ${socket.id}`);
      socket.to(roomId).emit("webrtc-renegotiate-answer", {
        answer,
        from: socket.id,
      });
    });

    // ── Disconnect ──────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const { roomId } = socket.data;
      if (roomId) {
        socket.to(roomId).emit("user-left", { socketId: socket.id });
      }
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });
}

module.exports = attachSignaling;
