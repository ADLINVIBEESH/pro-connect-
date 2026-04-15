import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

// ── Configuration ─────────────────────────────────────────────────────────────
const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/,  "");

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

// ── Types ─────────────────────────────────────────────────────────────────────
export type WebRTCState = "idle" | "calling" | "incoming" | "connected";

export interface UseWebRTCReturn {
  state: WebRTCState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  screenStream: MediaStream | null;
  remoteScreenSharing: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  callElapsed: number;
  startCall: () => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  screenVideoRef: React.RefObject<HTMLVideoElement>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useWebRTC(
  roomId: string | null,
  userId: string | null,
): UseWebRTCReturn {
  const [state, setState] = useState<WebRTCState>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callElapsed, setCallElapsed] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const callStartRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const isCallerRef = useRef(false);
  const stateRef = useRef<WebRTCState>("idle");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // Keep a ref in sync so socket handlers can read the latest state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ── Utility: attach stream to a video element ──────────────────────────────
  const attachStream = useCallback(
    (ref: React.RefObject<HTMLVideoElement>, stream: MediaStream | null) => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    },
    [],
  );

  // Sync streams with video elements safely after renders
  useEffect(() => {
    attachStream(localVideoRef, localStream);
    attachStream(remoteVideoRef, remoteStream);
    attachStream(screenVideoRef, screenStream);
  }, [state, localStream, remoteStream, screenStream, attachStream]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    callStartRef.current = Date.now();
    setCallElapsed(0);
    timerRef.current = setInterval(() => {
      if (callStartRef.current) {
        setCallElapsed(Math.floor((Date.now() - callStartRef.current) / 1000));
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    callStartRef.current = null;
    setCallElapsed(0);
  }, []);

  // ── Get local media ───────────────────────────────────────────────────────
  const getLocalMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      attachStream(localVideoRef, stream);
      return stream;
    } catch (err) {
      console.error("[webrtc] Failed to get local media:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsCameraOff(true);
        return stream;
      } catch (err2) {
        console.error("[webrtc] Failed to get even audio:", err2);
        return null;
      }
    }
  }, [attachStream]);

  // ── Stop local media ──────────────────────────────────────────────────────
  const stopLocalMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    attachStream(localVideoRef, null);
  }, [attachStream]);

  // ── Stop screen share ─────────────────────────────────────────────────────
  const stopScreenShareInternal = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setScreenStream(null);
    setIsScreenSharing(false);
    attachStream(screenVideoRef, null);
  }, [attachStream]);

  // ── Build a PeerConnection and wire ontrack / onicecandidate ──────────────
  const buildPC = useCallback(
    (stream: MediaStream, socket: Socket, room: string) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Receive remote tracks
      const remote = new MediaStream();
      remoteStreamRef.current = remote;
      setRemoteStream(remote);

      pc.ontrack = (event) => {
        console.log("[webrtc] remote track received:", event.track.kind);
        remote.addTrack(event.track);
        setRemoteStream(new MediaStream(remote.getTracks()));
        attachStream(remoteVideoRef, remote);
      };

      // Relay ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            roomId: room,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("[webrtc] ICE state:", pc.iceConnectionState);
        if (pc.iceConnectionState === "failed") {
          console.warn("[webrtc] ICE connection failed");
        }
      };

      return pc;
    },
    [attachStream],
  );

  // ── Full cleanup ──────────────────────────────────────────────────────────
  const fullCleanup = useCallback(() => {
    stopTimer();
    stopScreenShareInternal();
    stopLocalMedia();

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    remoteStreamRef.current = null;
    setRemoteStream(null);
    attachStream(remoteVideoRef, null);
    setState("idle");
    setIsMuted(false);
    setIsCameraOff(false);
    setRemoteScreenSharing(false);
    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;
  }, [stopTimer, stopScreenShareInternal, stopLocalMedia, attachStream]);

  // ── Socket.IO connection ──────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !userId) return;

    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[socket] connected:", socket.id);
      socket.emit("join-room", roomId, userId);
    });

    socket.on("user-joined", ({ userId: joinedUserId }) => {
      console.log("[socket] user joined room:", joinedUserId);
    });

    // ── Receive WebRTC offer (we are the callee) ────────────────────────────
    // DON'T auto-accept. Store the offer and set state to "incoming".
    // The user must click Accept, which calls acceptCall().
    socket.on("webrtc-offer", ({ offer }) => {
      console.log("[socket] received offer — waiting for user to accept");
      pendingOfferRef.current = offer;
      pendingCandidatesRef.current = []; // reset pending ICE
      setState("incoming");
    });

    // ── Receive WebRTC answer (we are the caller) ───────────────────────────
    socket.on("webrtc-answer", async ({ answer }) => {
      console.log("[socket] received answer");
      try {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        // Flush queued ICE candidates
        for (const c of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidatesRef.current = [];

        setState("connected");
        startTimer();
      } catch (err) {
        console.error("[webrtc] Error handling answer:", err);
      }
    });

    // ── Receive ICE candidate ───────────────────────────────────────────────
    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        const pc = pcRef.current;
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      } catch (err) {
        console.error("[webrtc] Error adding ICE candidate:", err);
      }
    });

    // ── Renegotiation (screen share track add/remove) ───────────────────────
    socket.on("webrtc-renegotiate-offer", async ({ offer }) => {
      try {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-renegotiate-answer", {
          roomId,
          answer: pc.localDescription,
        });
      } catch (err) {
        console.error("[webrtc] renegotiation answer error:", err);
      }
    });

    socket.on("webrtc-renegotiate-answer", async ({ answer }) => {
      try {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("[webrtc] renegotiation answer set error:", err);
      }
    });

    // ── Call-ended by remote user ───────────────────────────────────────────
    socket.on("call-ended", () => {
      console.log("[socket] remote user ended call");
      fullCleanup();
    });

    // ── Screen sharing notifications from remote ────────────────────────────
    socket.on("screen-share-started", () => setRemoteScreenSharing(true));
    socket.on("screen-share-stopped", () => setRemoteScreenSharing(false));

    // ── User left (disconnect) ──────────────────────────────────────────────
    socket.on("user-left", () => {
      console.log("[socket] remote user left");
      const s = stateRef.current;
      if (s === "connected" || s === "calling") {
        fullCleanup();
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId]);

  // ── Start a call (caller) ─────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    if (!roomId || !socketRef.current) return;

    isCallerRef.current = true;
    setState("calling");

    const stream = await getLocalMedia();
    if (!stream) {
      setState("idle");
      return;
    }

    const socket = socketRef.current;
    const pc = buildPC(stream, socket, roomId);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("webrtc-offer", {
        roomId,
        offer: pc.localDescription,
      });
    } catch (err) {
      console.error("[webrtc] Error creating offer:", err);
      fullCleanup();
    }
  }, [roomId, getLocalMedia, buildPC, fullCleanup]);

  // ── Accept an incoming call (callee) ──────────────────────────────────────
  const acceptCall = useCallback(async () => {
    const offer = pendingOfferRef.current;
    const socket = socketRef.current;
    if (!offer || !socket || !roomId) return;

    isCallerRef.current = false;

    // 1. Get local camera + mic
    const stream = await getLocalMedia();
    if (!stream) {
      fullCleanup();
      return;
    }

    // 2. Build peer connection and add local tracks
    const pc = buildPC(stream, socket, roomId);

    try {
      // 3. Set the remote offer
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // 4. Flush any queued ICE candidates
      for (const c of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingCandidatesRef.current = [];

      // 5. Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("webrtc-answer", {
        roomId,
        answer: pc.localDescription,
      });

      pendingOfferRef.current = null;
      setState("connected");
      startTimer();
    } catch (err) {
      console.error("[webrtc] Error accepting call:", err);
      fullCleanup();
    }
  }, [roomId, getLocalMedia, buildPC, fullCleanup, startTimer]);

  // ── Decline an incoming call ─────────────────────────────────────────────
  const declineCall = useCallback(() => {
    pendingOfferRef.current = null;
    if (roomId && socketRef.current) {
      socketRef.current.emit("call-ended", { roomId });
    }
    fullCleanup();
  }, [roomId, fullCleanup]);

  // ── End the current call ──────────────────────────────────────────────────
  const endCall = useCallback(() => {
    if (roomId && socketRef.current) {
      socketRef.current.emit("call-ended", { roomId });
    }
    fullCleanup();
  }, [roomId, fullCleanup]);

  // ── Toggle mic ────────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((p) => !p);
  }, []);

  // ── Toggle camera ────────────────────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCameraOff((p) => !p);
  }, []);

  // ── Toggle screen share ──────────────────────────────────────────────────
  const toggleScreenShare = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !roomId || !socketRef.current) return;

    if (isScreenSharing) {
      stopScreenShareInternal();

      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(cameraTrack);
        }
      }

      socketRef.current.emit("screen-share-stopped", { roomId });
      return;
    }

    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      screenStreamRef.current = screen;
      setScreenStream(screen);
      setIsScreenSharing(true);
      attachStream(screenVideoRef, screen);

      const screenTrack = screen.getVideoTracks()[0];
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender && screenTrack) {
        await sender.replaceTrack(screenTrack);
      }

      socketRef.current.emit("screen-share-started", { roomId });

      screenTrack.addEventListener("ended", async () => {
        stopScreenShareInternal();
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
        if (cameraTrack && sender) {
          await sender.replaceTrack(cameraTrack);
        }
        socketRef.current?.emit("screen-share-stopped", { roomId });
      });
    } catch (err) {
      console.error("[webrtc] Screen share denied:", err);
    }
  }, [isScreenSharing, roomId, stopScreenShareInternal, attachStream]);

  // ── Clean up on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      fullCleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    localStream,
    remoteStream,
    screenStream,
    remoteScreenSharing,
    isMuted,
    isCameraOff,
    isScreenSharing,
    callElapsed,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    localVideoRef: localVideoRef as React.RefObject<HTMLVideoElement>,
    remoteVideoRef: remoteVideoRef as React.RefObject<HTMLVideoElement>,
    screenVideoRef: screenVideoRef as React.RefObject<HTMLVideoElement>,
  };
}
