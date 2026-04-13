import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Bell, BriefcaseBusiness, CalendarClock, ImagePlus, Send, Trash2, X, Zap, Paperclip, Video, VideoOff, Mic, MicOff, Phone, Monitor, MonitorOff } from "lucide-react";
import Lottie from "lottie-react";
import messageLottieData from "@/assets/message-lottie.json";
import sendLottieData from "@/assets/send-lottie.json";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyJobsRequest } from "@/lib/networkApi";
import { deleteAllNotificationsRequest, deleteNotificationRequest, fetchNotificationsRequest, type Notification } from "@/lib/userApi";
import { getConversationsRequest, getMessagesRequest, sendMessageRequest, type Conversation } from "@/lib/chatApi";
import { cn } from "@/lib/utils";
import { InvitationModal } from "@/components/dashboard/InvitationModal";

type InboxTab = "chat" | "notifications";

type InboxNotification = {
  id: string;
  type: "application" | "job_invite" | "general";
  message: string;
  createdAt?: string;
  avatar?: string;
  subtitle?: string;
  jobId?: string;
  isUnread: boolean;
  sourceNotification?: Notification;
};

const formatTimestamp = (createdAt?: string) => {
  if (!createdAt) return "Recently";
  const parsed = new Date(createdAt);
  return Number.isNaN(parsed.getTime()) ? "Recently" : parsed.toLocaleString();
};

const formatTime = (createdAt: string) => {
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const MessagesPlaceholder = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<InboxTab>("chat");
  const [selectedInvite, setSelectedInvite] = useState<Notification | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isVideoCallIncoming, setIsVideoCallIncoming] = useState(false);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [callElapsed, setCallElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("hidden_notifications");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const dashboardBasePath = location.pathname.startsWith("/client-dashboard") ? "/client-dashboard" : "/dashboard";

  // ── Queries ────────────────────────────────────────────────────────────────

  const clientApplicationsQuery = useQuery({
    queryKey: ["my-jobs", "applications-notifications"],
    queryFn: () => fetchMyJobsRequest(true),
    enabled: user?.role === "client",
  });

  const notificationsQuery = useQuery({
    queryKey: ["user-notifications"],
    queryFn: fetchNotificationsRequest,
    enabled: Boolean(user),
  });

  const conversationsQuery = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: getConversationsRequest,
    enabled: Boolean(user),
    refetchInterval: 4000,
  });

  const messagesQuery = useQuery({
    queryKey: ["chat-messages", activeConversation?._id],
    queryFn: () => getMessagesRequest(activeConversation!._id),
    enabled: Boolean(activeConversation),
    refetchInterval: 2500,
  });

  // ── Scroll to bottom on new messages ────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data?.messages]);

  // ── Camera start/stop ───────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (callStartTime) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [callStartTime, startCamera, stopCamera]);

  // ── Call timer ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!callStartTime) { setCallElapsed(0); return; }
    const iv = setInterval(() => setCallElapsed(Math.floor((Date.now() - callStartTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [callStartTime]);

  // ── Toggle mic / camera ────────────────────────────────────────────────

  const toggleMic = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
      setIsMuted((p) => !p);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
      setIsCameraOff((p) => !p);
    }
  }, []);

  // ── Screen sharing ─────────────────────────────────────────────────────

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }
      setIsScreenSharing(true);
      // Auto-stop when user clicks browser's native "Stop sharing" button
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        stopScreenShare();
      });
    } catch (err) {
      console.error("Screen share denied:", err);
    }
  }, [isScreenSharing, stopScreenShare]);

  // ── Video Call sync ───────────────────────────────────────────────────────
  
  useEffect(() => {
    const msgs = messagesQuery.data?.messages;
    if (!msgs || !msgs.length) return;
    const lastMsg = msgs[msgs.length - 1];
    const isMe = lastMsg.senderId._id === user?.id || (lastMsg.senderId as any) === user?.id;

    if (lastMsg.text === "📞 CALL_ACCEPTED") {
      if (!isMe && isVideoCallActive && !callStartTime) {
         setCallStartTime(Date.now());
      }
    } else if (lastMsg.text.startsWith("📞 Video call ended") || lastMsg.text.startsWith("📞 Video call declined") || lastMsg.text.startsWith("📞 Missed call")) {
      setIsVideoCallIncoming(false);
      setIsVideoCallActive(false);
      setCallStartTime(null);
    } else if (lastMsg.text === "📞 INCOMING_CALL" && !isMe) {
      const ageMs = Date.now() - new Date(lastMsg.createdAt).getTime();
      if (ageMs < 45000 && !isVideoCallActive && !isVideoCallIncoming) {
        setIsVideoCallIncoming(true);
      }
    }
  }, [messagesQuery.data?.messages, user?.id, isVideoCallActive, callStartTime, isVideoCallIncoming]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const sendMessageMutation = useMutation({
    mutationFn: ({ text }: { text: string }) => sendMessageRequest(activeConversation!._id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", activeConversation?._id] });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      setMessageText("");
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotificationRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
    },
  });

  const deleteAllNotificationsMutation = useMutation({
    mutationFn: deleteAllNotificationsRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
      const idsToHide = inboxNotifications.map((n) => n.id);
      setHiddenIds((prev) => {
        const next = new Set(prev);
        for (const id of idsToHide) next.add(id);
        localStorage.setItem("hidden_notifications", JSON.stringify(Array.from(next)));
        return next;
      });
      setShowClearAllModal(false);
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  const hideNotification = (id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("hidden_notifications", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleDelete = (e: React.MouseEvent, entry: InboxNotification) => {
    e.stopPropagation();
    if (entry.type !== "application") {
      const objectId = entry.id.replace("notif-", "");
      deleteNotificationMutation.mutate(objectId);
    }
    hideNotification(entry.id);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = messageText.trim();
    if (!text || !activeConversation || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate({ text });
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const inboxNotifications = useMemo<InboxNotification[]>(() => {
    if (!user) return [];
    const list: InboxNotification[] = [];

    if (user.role === "client" && clientApplicationsQuery.data?.jobs) {
      for (const job of clientApplicationsQuery.data.jobs) {
        for (const application of job.applications ?? []) {
          list.push({
            id: `app-${application.id}`,
            type: "application",
            message: `${application.freelancerName} applied for ${job.title}`,
            createdAt: application.createdAt,
            avatar: application.freelancerAvatar,
            subtitle: "Application received",
            jobId: job.id,
            isUnread: true,
          });
        }
      }
    }

    if (notificationsQuery.data?.notifications) {
      for (const notification of notificationsQuery.data.notifications) {
        const senderName =
          notification.senderId?.fullName ||
          notification.senderId?.email?.split("@")[0] ||
          "A user";
        const isJobInvite = notification.type === "job_invite";

        list.push({
          id: `notif-${notification._id}`,
          type: isJobInvite ? "job_invite" : "general",
          message: isJobInvite ? `${senderName} invited you to a job.` : notification.message,
          createdAt: notification.createdAt,
          avatar: notification.senderId?.avatar,
          subtitle: notification.jobId?.title || undefined,
          jobId: notification.jobId?._id,
          isUnread: !notification.isRead,
          sourceNotification: notification,
        });
      }
    }

    return list.filter((item) => !hiddenIds.has(item.id)).sort((a, b) => {
      const aTime = new Date(a.createdAt ?? 0).getTime();
      const bTime = new Date(b.createdAt ?? 0).getTime();
      return bTime - aTime;
    });
  }, [clientApplicationsQuery.data?.jobs, notificationsQuery.data?.notifications, user, hiddenIds]);

  const isLoading =
    notificationsQuery.isLoading || (user?.role === "client" ? clientApplicationsQuery.isLoading : false);
  const isError =
    notificationsQuery.isError || (user?.role === "client" ? clientApplicationsQuery.isError : false);
  const errorMessage =
    (notificationsQuery.error as Error)?.message ||
    (clientApplicationsQuery.error as Error)?.message ||
    "Failed to load notifications.";

  const conversations = conversationsQuery.data?.conversations ?? [];
  const messages = messagesQuery.data?.messages ?? [];

  // ── Chat helpers ───────────────────────────────────────────────────────────

  const getOtherParticipant = (conv: Conversation) =>
    conv.participants.find((p) => p._id !== user?.id);

  const unreadCountPerConv = (_conv: Conversation) => 0; // future: track per-conv unread

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="px-6 pt-8 pb-4 md:px-10 max-w-6xl mx-auto">
        {/* ── Tab Toggle ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center">
          <div className="relative inline-flex h-14 items-center gap-1 rounded-full border border-border bg-muted/40 p-1 shadow-sm backdrop-blur">
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={cn(
                "relative z-10 inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[1.03rem] font-display transition-colors duration-300",
                activeTab === "chat"
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Lottie animationData={messageLottieData} loop={true} className="h-6 w-6" />
              Chats
              {conversations.length > 0 && (
                <span className="relative z-10 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground dark:bg-black/40">
                  {conversations.length}
                </span>
              )}
              {activeTab === "chat" && (
                <motion.div
                  layoutId="inboxTabIndicator"
                  className="absolute inset-0 -z-10 rounded-full bg-card shadow-[0_8px_16px_-8px_rgba(0,0,0,0.5)]"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className={cn(
                "relative z-10 inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[1.03rem] font-display transition-colors duration-300",
                activeTab === "notifications"
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              Notifications
              <span className="relative z-10 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground dark:bg-black/40">
                {inboxNotifications.length}
              </span>
              {activeTab === "notifications" && (
                <motion.div
                  layoutId="inboxTabIndicator"
                  className="absolute inset-0 -z-10 rounded-full bg-card shadow-[0_8px_16px_-8px_rgba(0,0,0,0.5)]"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
            </button>
          </div>
        </div>

        {/* ── CONTENT AREA ──────────────────────────────────────────────────── */}
        <div className="mt-8 relative h-[600px]">
          <AnimatePresence mode="wait">
            {/* ── CHAT TAB ───────────────────────────────────────────────────── */}
            {activeTab === "chat" ? (
              <motion.div
                key="chat-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute inset-0 overflow-hidden flex flex-col rounded-[20px] border border-border bg-card shadow-xl dark:shadow-none"
              >
                <AnimatePresence mode="wait">
                  {activeConversation ? (
                    // ── Active conversation (message thread) ──────────────────────
                    <motion.div
                      key="active-chat"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="flex h-full flex-col w-full bg-card"
                    >
                      {/* Header */}
                      <div className="flex z-10 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-5 py-3.5 sticky top-0">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setActiveConversation(null)}
                            className="mr-1 flex items-center justify-center p-2 rounded-full text-muted-foreground transition-all hover:bg-secondary/10 hover:text-foreground active:scale-95"
                          >
                            <ArrowLeft className="h-5 w-5" />
                          </button>
                          {(() => {
                            const other = getOtherParticipant(activeConversation);
                            return other ? (
                              <>
                                {other.avatar ? (
                                  <img src={other.avatar} alt={other.fullName} className="h-10 w-10 rounded-full object-cover shadow-sm ring-2 ring-background left-0" />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shadow-sm">
                                    {other.fullName?.[0]?.toUpperCase() ?? "?"}
                                  </div>
                                )}
                                <div className="flex flex-col ml-1">
                                  <p className="text-[0.95rem] font-bold text-foreground tracking-tight">{other.fullName}</p>
                                  {activeConversation.jobId && (
                                    <p className="text-[0.7rem] text-primary font-medium tracking-wide bg-primary/10 px-2 py-0.5 rounded-full w-fit mt-0.5">{activeConversation.jobId.title}</p>
                                  )}
                                </div>
                              </>
                            ) : null;
                          })()}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsVideoCallActive(true);
                            sendMessageMutation.mutate({ text: "📞 INCOMING_CALL" });
                          }}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-primary transition-all hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                          title="Start Video Call"
                        >
                          <Video className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-6 space-y-4 bg-muted/10 relative scroll-smooth">
                        {messagesQuery.isLoading && (
                          <div className="flex justify-center py-10">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                            />
                          </div>
                        )}
                        {!messagesQuery.isLoading && messages.length === 0 && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-20 text-center"
                          >
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary/10 text-primary">
                              <Lottie animationData={messageLottieData} loop={true} className="h-10 w-10 drop-shadow-sm" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">No messages yet</h3>
                            <p className="mt-2 text-sm text-muted-foreground">Start the conversation by saying hello! 👋</p>
                          </motion.div>
                        )}
                        <AnimatePresence initial={false}>
                          {messages.filter(m => m.text !== "📞 INCOMING_CALL" && m.text !== "📞 CALL_ACCEPTED").map((msg) => {
                            const isMe = msg.senderId._id === user?.id || (msg.senderId as any) === user?.id;
                            const isSchedule = msg.text.startsWith("📅");
                            const isFile = msg.text.startsWith("📎");
                            const isCallLog = msg.text.startsWith("📞");

                            if (isSchedule || isFile || isCallLog) {
                              return (
                                <motion.div
                                  key={msg._id}
                                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  transition={{ duration: 0.3, type: "spring", bounce: 0.35 }}
                                  className={cn("flex px-4 w-full", isMe ? "justify-end" : "justify-start")}
                                >
                                  <div className="w-fit max-w-[85%] rounded-[12px] border border-primary/15 bg-primary/5 backdrop-blur-sm px-2.5 py-1.5 shadow-sm">
                                    <div className="flex items-center gap-2">
                                      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[14px]", isCallLog ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10")}>
                                        {isSchedule ? "📅" : isFile ? "📎" : "📞"}
                                      </div>
                                      <div className="flex-1 min-w-0 py-0.5">
                                        <p className="text-[8px] font-bold uppercase tracking-widest text-primary/70 mb-0.5">
                                          {isSchedule ? "Meeting Scheduled" : isFile ? "File Shared" : "Call Status"}
                                        </p>
                                        <p className="text-[12px] text-foreground font-medium leading-[1.3]">
                                          {msg.text.replace(/^📅\s*/, "").replace(/^📎\s*/, "").replace(/^📞\s*/, "")}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-primary/10">
                                      <span className="text-[8px] text-muted-foreground font-medium">
                                        Sent by {isMe ? "you" : msg.senderId.fullName}
                                      </span>
                                      <span className="text-[8px] text-muted-foreground/80 font-medium ml-4">{formatTime(msg.createdAt)}</span>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            }

                            return (
                              <motion.div
                                key={msg._id}
                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.25, type: "spring", bounce: 0.4 }}
                                className={cn("flex items-end gap-3", isMe ? "flex-row-reverse" : "flex-row")}
                              >
                                {!isMe && (
                                  msg.senderId.avatar ? (
                                    <img src={msg.senderId.avatar} alt={msg.senderId.fullName} className="h-8 w-8 shrink-0 rounded-full object-cover shadow-sm" />
                                  ) : (
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shadow-sm">
                                      {msg.senderId.fullName?.[0]?.toUpperCase() ?? "?"}
                                    </div>
                                  )
                                )}
                                <div className={cn("max-w-[75%]", isMe ? "items-end" : "items-start", "flex flex-col gap-1")}>
                                  <div
                                    className={cn(
                                      "px-4 py-3 text-[0.92rem] leading-relaxed shadow-sm",
                                      isMe
                                        ? "rounded-[20px] rounded-br-sm bg-gradient-to-tr from-primary to-accent text-primary-foreground dark:from-primary dark:to-primary"
                                        : "rounded-[20px] rounded-bl-sm bg-card border border-border text-foreground",
                                    )}
                                  >
                                    {msg.text}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground/80 px-2 font-medium">{formatTime(msg.createdAt)}</span>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                        <div ref={messagesEndRef} className="h-1" />
                      </div>

                      {/* Schedule Picker Overlay */}
                      <AnimatePresence>
                        {showScheduler && (
                          <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.9 }}
                            transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
                            className="absolute bottom-24 left-4 z-30 w-[280px] rounded-[20px] border border-white/10 bg-gradient-to-b from-card/98 to-card/90 backdrop-blur-2xl p-0 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.5)] overflow-hidden"
                          >
                            {/* Header */}
                            <div className="relative px-4 pt-4 pb-3">
                              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-inner">
                                    <CalendarClock className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-display font-bold text-foreground tracking-tight">Schedule</h4>
                                    <p className="text-[10px] text-muted-foreground">Pick date & time</p>
                                  </div>
                                </div>
                                <button onClick={() => setShowScheduler(false)} className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all hover:scale-110 active:scale-95">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            {/* Fields */}
                            <div className="px-4 pb-3 space-y-2.5">
                              <div>
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Date</label>
                                <input
                                  type="date"
                                  value={scheduleDate}
                                  onChange={(e) => setScheduleDate(e.target.value)}
                                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-[2px] focus:ring-primary/15 transition-all"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Time</label>
                                <input
                                  type="time"
                                  value={scheduleTime}
                                  onChange={(e) => setScheduleTime(e.target.value)}
                                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60 focus:ring-[2px] focus:ring-primary/15 transition-all"
                                />
                              </div>

                              {/* Preview */}
                              {scheduleDate && scheduleTime && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="rounded-xl bg-primary/5 border border-primary/10 px-3 py-2.5"
                                >
                                  <p className="text-[10px] font-semibold uppercase text-primary/70 tracking-wider mb-0.5">Preview</p>
                                  <p className="text-xs text-foreground font-medium leading-relaxed">
                                    📅 {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </motion.div>
                              )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 pb-4 pt-0.5">
                              <button
                                onClick={() => {
                                  if (!scheduleDate || !scheduleTime || !activeConversation) return;
                                  const dt = new Date(`${scheduleDate}T${scheduleTime}`);
                                  const formatted = dt.toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
                                  sendMessageMutation.mutate({ text: `📅 Meeting has been scheduled on ${formatted}` });
                                  setShowScheduler(false); setScheduleDate(""); setScheduleTime("");
                                }}
                                disabled={!scheduleDate || !scheduleTime}
                                className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:brightness-110 active:scale-[0.98] disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-1.5"
                              >
                                <Send className="h-3.5 w-3.5" />
                                Send Schedule
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Hidden file input */}
                      <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && activeConversation) {
                          sendMessageMutation.mutate({ text: `📎 Shared a file: ${file.name}` });
                        }
                        e.target.value = "";
                      }} />

                      {/* Message input */}
                      <form
                        onSubmit={handleSendMessage}
                        className="flex items-end gap-2 border-t border-border bg-card/80 backdrop-blur-md px-4 py-4 z-10"
                      >
                        {/* Attach button */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => { setShowAttachMenu((p) => !p); setShowScheduler(false); }}
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:scale-105 active:scale-95"
                          >
                            <Paperclip className="h-5 w-5" />
                          </button>
                          <AnimatePresence>
                            {showAttachMenu && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                transition={{ type: "spring", bounce: 0.35, duration: 0.3 }}
                                className="absolute bottom-14 left-0 z-40 flex flex-col gap-1 rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-2 shadow-2xl min-w-[160px]"
                              >
                                <button
                                  type="button"
                                  onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
                                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors"
                                >
                                  <ImagePlus className="h-4 w-4 text-emerald-500" /> Gallery
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setShowScheduler(true); setShowAttachMenu(false); }}
                                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-foreground hover:bg-muted/60 transition-colors"
                                >
                                  <CalendarClock className="h-4 w-4 text-blue-500" /> Schedule
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full rounded-[24px] border border-border bg-muted/50 px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-[3px] focus:ring-primary/20 focus:bg-background transition-all"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            onFocus={() => { setShowAttachMenu(false); setShowScheduler(false); }}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!messageText.trim() || sendMessageMutation.isPending}
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100"
                        >
                          <Lottie animationData={sendLottieData} loop={true} className="h-6 w-6 relative left-[-2px]" />
                        </button>
                      </form>

                      {/* Video Call Overlay */}
                      <AnimatePresence>
                        {(isVideoCallActive || isVideoCallIncoming) && activeConversation && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-card/95 backdrop-blur-xl border border-border rounded-[20px]"
                          >
                            {(() => {
                              const other = getOtherParticipant(activeConversation);
                              
                              if (isVideoCallIncoming) {
                                return (
                                  <div className="flex flex-col items-center text-center">
                                    <div className="relative flex h-32 w-32 mb-6 items-center justify-center rounded-full bg-primary/10 text-primary text-4xl font-bold shadow-2xl ring-4 ring-primary/20">
                                      {other?.avatar ? (
                                        <img src={other.avatar} alt={other.fullName} className="relative z-10 h-full w-full rounded-full object-cover" />
                                      ) : (
                                        <span className="relative z-10">{other?.fullName?.[0]?.toUpperCase() ?? "?"}</span>
                                      )}
                                      <motion.div 
                                        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute inset-0 z-0 rounded-full border-[4px] border-primary/40 ring-4 ring-primary/20" 
                                      />
                                    </div>
                                    <h3 className="text-2xl font-display font-bold text-foreground">Incoming video call...</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">{other?.fullName} is calling you</p>
                                    
                                    <div className="mt-12 flex gap-8">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsVideoCallIncoming(false);
                                          sendMessageMutation.mutate({ text: "📞 Video call declined" });
                                        }}
                                        className="flex flex-col items-center gap-2 group focus:outline-none"
                                      >
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg group-hover:bg-red-600 transition-all group-hover:scale-105 active:scale-95">
                                          <X className="h-8 w-8" />
                                        </div>
                                        <span className="text-xs font-semibold text-muted-foreground group-hover:text-red-500 uppercase tracking-widest">Decline</span>
                                      </button>
                                      
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsVideoCallIncoming(false);
                                          setIsVideoCallActive(true);
                                          setCallStartTime(Date.now());
                                          sendMessageMutation.mutate({ text: "📞 CALL_ACCEPTED" });
                                        }}
                                        className="flex flex-col items-center gap-2 group focus:outline-none"
                                      >
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg group-hover:bg-emerald-600 transition-all group-hover:scale-105 active:scale-95 animate-bounce-subtle">
                                          <Video className="h-8 w-8" />
                                        </div>
                                        <span className="text-xs font-semibold text-muted-foreground group-hover:text-emerald-500 uppercase tracking-widest">Accept</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              if (callStartTime) {
                                // ── Active video call with camera ──────────────────
                                const hrs = String(Math.floor(callElapsed / 3600)).padStart(2, "0");
                                const mins = String(Math.floor((callElapsed % 3600) / 60)).padStart(2, "0");
                                const secs = String(callElapsed % 60).padStart(2, "0");

                                return (
                                  <div className="relative flex h-full w-full flex-col bg-black rounded-[20px] overflow-hidden">
                                    {/* Screen share feed (replaces camera as main view when active) */}
                                    {isScreenSharing && (
                                      <video
                                        ref={screenVideoRef}
                                        autoPlay
                                        playsInline
                                        className="absolute inset-0 h-full w-full object-contain bg-black z-[1]"
                                      />
                                    )}

                                    {/* Camera feed — full bg normally, small PiP when screen sharing */}
                                    <video
                                      ref={localVideoRef}
                                      autoPlay
                                      playsInline
                                      muted
                                      className={cn(
                                        isCameraOff && "hidden",
                                        isScreenSharing
                                          ? "absolute bottom-24 right-4 z-[5] h-32 w-44 rounded-2xl object-cover shadow-2xl ring-2 ring-white/20"
                                          : "absolute inset-0 h-full w-full object-cover"
                                      )}
                                    />
                                    {isCameraOff && !isScreenSharing && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gray-700 text-white text-4xl font-bold">
                                          {user?.name?.[0]?.toUpperCase() ?? "?"}
                                        </div>
                                      </div>
                                    )}

                                    {/* Top bar */}
                                    <div className="relative z-10 flex items-center justify-between px-5 pt-5">
                                      <div className="flex items-center gap-3">
                                        {other?.avatar ? (
                                          <img src={other.avatar} alt={other.fullName} className="h-10 w-10 rounded-full object-cover ring-2 ring-white/30" />
                                        ) : (
                                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white text-sm font-bold">
                                            {other?.fullName?.[0]?.toUpperCase() ?? "?"}
                                          </div>
                                        )}
                                        <div>
                                          <p className="text-sm font-bold text-white drop-shadow-md">{other?.fullName}</p>
                                          <p className="text-xs text-white/70 drop-shadow-md">{activeConversation.jobId?.title || "ProConnect Meeting"}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {isScreenSharing && (
                                          <div className="rounded-full bg-emerald-500/80 backdrop-blur-md px-3 py-1.5 flex items-center gap-1.5">
                                            <Monitor className="h-3.5 w-3.5 text-white" />
                                            <span className="text-xs font-semibold text-white">Sharing</span>
                                          </div>
                                        )}
                                        <div className="rounded-full bg-black/50 backdrop-blur-md px-4 py-1.5">
                                          <span className="text-sm font-mono font-semibold text-emerald-400 tracking-wider">{hrs}:{mins}:{secs}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Bottom controls */}
                                    <div className="relative z-10 mt-auto flex items-center justify-center gap-4 pb-8 pt-6 bg-gradient-to-t from-black/70 to-transparent">
                                      <button
                                        type="button"
                                        onClick={toggleMic}
                                        className={cn("flex h-13 w-13 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg", isMuted ? "bg-red-500/80 text-white" : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30")}
                                      >
                                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={toggleCamera}
                                        className={cn("flex h-13 w-13 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg", isCameraOff ? "bg-red-500/80 text-white" : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30")}
                                      >
                                        {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={toggleScreenShare}
                                        className={cn("flex h-13 w-13 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg", isScreenSharing ? "bg-emerald-500/80 text-white" : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30")}
                                        title={isScreenSharing ? "Stop sharing" : "Share screen"}
                                      >
                                        {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const dur = callStartTime ? Math.floor((Date.now() - callStartTime) / 1000) : 0;
                                          const m = Math.floor(dur / 60);
                                          const s = dur % 60;
                                          const timeStr = dur > 0 ? `(${m}m ${s}s)` : "";
                                          stopScreenShare();
                                          setIsVideoCallActive(false);
                                          setCallStartTime(null);
                                          setIsMuted(false);
                                          setIsCameraOff(false);
                                          sendMessageMutation.mutate({ text: `📞 Video call ended ${timeStr}` });
                                        }}
                                        className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-all hover:scale-110 active:scale-95"
                                      >
                                        <Phone className="h-6 w-6 rotate-[135deg]" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              // ── Ringing / waiting for answer ────────────────────
                              return (
                                <div className="flex flex-col items-center text-center">
                                  {other?.avatar ? (
                                    <div className="relative h-32 w-32 mb-6">
                                      <img src={other.avatar} alt={other.fullName} className="relative z-10 h-full w-full rounded-full object-cover shadow-2xl ring-4 ring-primary/20" />
                                      <motion.div 
                                        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute inset-0 z-0 rounded-full bg-primary/20" 
                                      />
                                    </div>
                                  ) : (
                                    <div className="relative flex h-32 w-32 mb-6 items-center justify-center rounded-full bg-primary/10 text-primary text-4xl font-bold shadow-2xl ring-4 ring-primary/20">
                                      <span className="relative z-10">{other?.fullName?.[0]?.toUpperCase() ?? "?"}</span>
                                      <motion.div 
                                        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute inset-0 z-0 rounded-full bg-primary/20" 
                                      />
                                    </div>
                                  )}
                                  <h3 className="text-2xl font-display font-bold text-foreground">Calling {other?.fullName}...</h3>
                                  <p className="mt-2 text-sm text-muted-foreground">{activeConversation.jobId?.title || "ProConnect Meeting"}</p>
                                  
                                  <div className="mt-12 flex gap-6">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsVideoCallActive(false);
                                        setCallStartTime(null);
                                        sendMessageMutation.mutate({ text: "📞 Missed call" });
                                      }}
                                      className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-all hover:scale-105 active:scale-95"
                                    >
                                      <Phone className="h-8 w-8 rotate-[135deg]" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    // ── Conversation list ──────────────────────────────────────────
                    <motion.div
                      key="conversation-list"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="flex flex-col h-full bg-card"
                    >
                      <div className="border-b border-border px-6 py-5 bg-card z-10">
                        <h2 className="text-lg font-display font-semibold text-foreground">Active Chats</h2>
                      </div>

                      <div className="flex-1 overflow-y-auto scrollbar-hide w-full">
                        {conversationsQuery.isLoading && (
                          <div className="py-12 flex justify-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                            />
                          </div>
                        )}

                        {!conversationsQuery.isLoading && conversations.length === 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-6 py-20 text-center max-w-md mx-auto"
                          >
                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-muted shadow-inner text-muted-foreground">
                              <Lottie animationData={messageLottieData} loop={true} className="h-12 w-12 opacity-80" />
                            </div>
                            <h3 className="text-xl font-display font-semibold text-foreground mb-2">Your inbox is empty</h3>
                            <p className="text-[0.95rem] text-muted-foreground leading-relaxed">
                              When a freelancer accepts a job invite, a secure conversation thread will appear here for both of you.
                            </p>
                          </motion.div>
                        )}

                        {conversations.length > 0 && (
                          <div className="divide-y divide-border/60">
                            {conversations.map((conv) => {
                              const other = getOtherParticipant(conv);
                              if (!other) return null;
                              return (
                                <button
                                  key={conv._id}
                                  type="button"
                                  onClick={() => setActiveConversation(conv)}
                                  className="group relative flex w-full items-center gap-4 px-6 py-4 text-left transition-all hover:bg-muted/50 focus:outline-none focus:bg-muted/80 overflow-hidden"
                                >
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="relative flex-shrink-0"
                                  >
                                    {other.avatar ? (
                                      <img src={other.avatar} alt={other.fullName} className="h-14 w-14 shrink-0 rounded-full object-cover border border-border" />
                                    ) : (
                                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary text-xl font-bold border border-secondary/20">
                                        {other.fullName?.[0]?.toUpperCase() ?? "?"}
                                      </div>
                                    )}
                                  </motion.div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="truncate text-[1rem] font-bold text-foreground">{other.fullName}</p>
                                      {conv.lastMessageAt && (
                                        <span className="ml-3 shrink-0 text-xs font-medium text-muted-foreground/70">
                                          {formatTime(conv.lastMessageAt)}
                                        </span>
                                      )}
                                    </div>
                                    {conv.jobId && (
                                      <p className="truncate text-xs font-semibold text-primary uppercase letter-spacing-wide mb-1 opacity-90">{conv.jobId.title}</p>
                                    )}
                                    {conv.lastMessage ? (
                                      <p className="truncate text-sm text-muted-foreground/80 font-medium">{conv.lastMessage}</p>
                                    ) : (
                                      <p className="text-sm italic text-muted-foreground/50">Say hello!</p>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              // ── NOTIFICATIONS TAB ──────────────────────────────────────────────
              <motion.div
                key="notifications-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute inset-0 flex flex-col rounded-[20px] border border-border bg-card shadow-xl dark:shadow-none overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-border px-6 py-5 bg-card z-10 sticky top-0">
                  <h2 className="text-lg font-display font-semibold text-foreground">Recent Activity</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2 py-1 bg-muted rounded-md text-muted-foreground">
                      {inboxNotifications.length} items
                    </span>
                    {inboxNotifications.length > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setShowClearAllModal(true)}
                        className="flex shrink-0 items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/15 hover:text-red-500"
                        title="Clear All Notifications"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  {isLoading && (
                    <div className="py-12 flex justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                      />
                    </div>
                  )}

                  {isError && (
                    <div className="p-6">
                      <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 text-center">
                        {errorMessage}
                      </div>
                    </div>
                  )}

                  {!isLoading && !isError && inboxNotifications.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-6 py-20 text-center max-w-md mx-auto"
                    >
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-muted text-muted-foreground mb-6 shadow-inner">
                        <Bell className="h-8 w-8 opacity-70" />
                      </div>
                      <h3 className="text-xl font-display font-semibold text-foreground mb-2">You're all caught up!</h3>
                      <p className="mt-2 text-[0.95rem] text-muted-foreground">When you receive job invites, application updates, or alerts, they'll show up right here.</p>
                    </motion.div>
                  ) : null}

                  {!isLoading && !isError && inboxNotifications.length > 0 && (
                    <div className="divide-y divide-border/60">
                      <AnimatePresence initial={false}>
                        {inboxNotifications.map((entry) => {
                          const icon =
                            entry.type === "application" ? (
                              <BriefcaseBusiness className="h-5 w-5" />
                            ) : entry.type === "job_invite" ? (
                              <Bell className="h-5 w-5" />
                            ) : (
                              <Zap className="h-5 w-5" />
                            );

                          return (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0, scale: 0.95, filter: "blur(4px)" }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="group relative w-full overflow-hidden"
                            >
                              <div className="flex w-full items-start justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-muted/40 backdrop-blur-sm">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (entry.type === "job_invite" && entry.sourceNotification) {
                                      setSelectedInvite(entry.sourceNotification);
                                      return;
                                    }

                                    if (entry.jobId) {
                                      navigate(`${dashboardBasePath}/job/${entry.jobId}`);
                                    }
                                  }}
                                  className="flex min-w-0 flex-1 items-start gap-4 text-left outline-none"
                                >
                                  {entry.avatar ? (
                                    <img src={entry.avatar} alt="" className="h-12 w-12 shrink-0 rounded-2xl bg-muted object-cover shadow-sm border border-border" />
                                  ) : (
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm border border-primary/10">
                                      {icon}
                                    </div>
                                  )}

                                  <div className="min-w-0 flex-1 pt-0.5">
                                    <p className="text-[0.95rem] font-medium text-foreground leading-snug">{entry.message}</p>
                                    {entry.subtitle && <p className="mt-1 text-[0.8rem] text-primary font-semibold tracking-wide uppercase">{entry.subtitle}</p>}
                                    <p className="mt-1.5 text-xs font-medium text-muted-foreground/80">{formatTimestamp(entry.createdAt)}</p>
                                  </div>
                                </button>

                                <div className="flex shrink-0 items-center gap-3 pt-2">
                                  <button
                                    type="button"
                                    onClick={(e) => handleDelete(e, entry)}
                                    className="rounded-full p-2 text-muted-foreground/60 opacity-0 transition-all hover:bg-red-500/15 hover:text-red-500 group-hover:opacity-100 hover:scale-110 active:scale-95"
                                    title="Delete message"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                  <div className="flex w-2.5 justify-center">
                                    {entry.isUnread ? <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> : null}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      <InvitationModal
        isOpen={Boolean(selectedInvite)}
        onOpenChange={(open) => !open && setSelectedInvite(null)}
        notification={selectedInvite}
        dashboardBasePath={dashboardBasePath}
      />

      <AnimatePresence>
        {showClearAllModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background/60 p-6 backdrop-blur-md px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
              className="w-full max-w-sm rounded-[24px] border border-border bg-card p-8 shadow-2xl"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500 shadow-inner">
                <Trash2 className="h-7 w-7" />
              </div>
              <h3 className="text-center text-[1.25rem] font-display font-semibold text-foreground">Empty Notifications</h3>
              <p className="mt-2.5 text-center text-[0.95rem] text-muted-foreground leading-relaxed">
                Are you sure you want to empty your entire notification feed?<br />This action cannot be undone.
              </p>
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowClearAllModal(false)}
                  disabled={deleteAllNotificationsMutation.isPending}
                  className="flex-1 rounded-xl border border-border bg-transparent py-3 text-[0.95rem] font-semibold text-foreground transition-colors hover:bg-muted active:scale-[0.98]"
                >
                  No, cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteAllNotificationsMutation.mutate()}
                  disabled={deleteAllNotificationsMutation.isPending}
                  className="flex-1 rounded-xl bg-red-600 py-3 text-[0.95rem] font-semibold text-white shadow-md transition-colors hover:bg-red-700 disabled:opacity-70 active:scale-[0.98]"
                >
                  {deleteAllNotificationsMutation.isPending ? "Emptying..." : "Yes, empty it"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MessagesPlaceholder;
