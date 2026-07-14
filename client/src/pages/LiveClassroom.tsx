import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  LogOut,
  Users,
  MessageSquare,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveSession {
  id: string;
  classroom_id: string;
  livekit_room_name: string;
  status: string;
}

export default function LiveClassroom() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Mock states for simulation mode
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);

  const isTrainer = user?.role === "trainer";
  const isCollege = user?.role === "college";
  const isHost = isTrainer || isCollege;

  useEffect(() => {
    async function fetchSessionAndToken() {
      try {
        setIsLoading(true);
        // 1. Fetch active session
        const sessionRes = await api.get(`/classrooms/${classroomId}/active-session`);
        const session = sessionRes.data.data;

        if (!session) {
          setErrorMsg("No active live session found for this classroom. The host might have ended the class.");
          setIsLoading(false);
          return;
        }

        setActiveSession(session);

        // 2. Fetch LiveKit token
        const tokenRes = await api.post("/livekit/token", {
          room_name: session.livekit_room_name,
          participant_name: user?.email?.split("@")[0] || "User",
        });

        const { token, ws_url, simulation } = tokenRes.data;
        setToken(token);
        setWsUrl(ws_url);
        setIsSimulated(!!simulation);
        setIsLoading(false);
      } catch (err: any) {
        console.error("Failed to connect to session:", err);
        setErrorMsg(err.response?.data?.error || "Failed to join live session. Please try again.");
        setIsLoading(false);
      }
    }

    if (classroomId && user) {
      fetchSessionAndToken();
    }
  }, [classroomId, user]);

  const handleNavigationAfterLeave = () => {
    if (user?.role === "trainer") {
      navigate(`/trainer/classrooms/${classroomId}`);
    } else if (user?.role === "college") {
      navigate(`/college/classrooms`);
    } else {
      navigate(`/student/classrooms/${classroomId}`);
    }
  };

  const handleEndSession = async () => {
    if (!classroomId || !activeSession) return;
    const confirmEnd = window.confirm("Are you sure you want to end this class? This will disconnect all students.");
    if (!confirmEnd) return;

    try {
      setIsLoading(true);
      await api.post(`/classrooms/${classroomId}/sessions/${activeSession.id}/end`);
      handleNavigationAfterLeave();
    } catch (err) {
      console.error("Failed to end session:", err);
      alert("Failed to end class session. Please try again.");
      setIsLoading(false);
    }
  };

  const handleLeaveSession = () => {
    handleNavigationAfterLeave();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0B0F19] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-sm font-medium text-slate-400">Connecting to smart classroom session...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0B0F19] p-4 text-white">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error/10 text-error mb-4">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold">Connection Failed</h3>
        <p className="mt-2 max-w-md text-center text-sm text-slate-400">{errorMsg}</p>
        <button
          onClick={() => navigate(-1)}
          className="btn-outline border-slate-700 hover:bg-slate-800 text-white mt-6 text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  // RENDER REAL LIVEKIT ROOM
  if (token && wsUrl && !isSimulated) {
    return (
      <div className="h-screen w-screen bg-[#0B0F19]">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={wsUrl}
          onDisconnected={handleLeaveSession}
          data-lk-theme="default"
        >
          <div className="relative h-full w-full flex flex-col justify-between">
            {/* Top Bar inside call */}
            <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
              <div className="bg-black/55 backdrop-blur-md rounded-lg px-4 py-1.5 border border-white/10 pointer-events-auto">
                <span className="text-xs font-semibold text-white/95">Live Room: {activeSession?.livekit_room_name}</span>
              </div>
              <div className="pointer-events-auto flex gap-2">
                {isHost ? (
                  <button
                    onClick={handleEndSession}
                    className="flex items-center gap-1.5 bg-error px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white hover:bg-error/90 transition-all shadow-lg"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    End Class
                  </button>
                ) : (
                  <button
                    onClick={handleLeaveSession}
                    className="flex items-center gap-1.5 bg-slate-700/80 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white transition-all shadow-lg"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Leave Class
                  </button>
                )}
              </div>
            </div>

            <VideoConference />
          </div>
        </LiveKitRoom>
      </div>
    );
  }

  // RENDER SIMULATED (MOCK) CLASSROOM FOR TESTING
  return (
    <div className="h-screen w-screen bg-[#090D16] flex flex-col overflow-hidden text-white font-sans">
      {/* ── Header ── */}
      <header className="h-16 border-b border-white/5 bg-[#0F172A]/85 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
          <div>
            <h1 className="font-semibold text-sm">Classroom live session</h1>
            <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-xs">
              ID: {activeSession?.livekit_room_name} (Simulation Mode)
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {isHost ? (
            <button
              onClick={handleEndSession}
              className="flex items-center gap-1.5 bg-error px-4 py-2 text-xs font-bold rounded-lg text-white hover:bg-error/90 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              End Class
            </button>
          ) : (
            <button
              onClick={handleLeaveSession}
              className="flex items-center gap-1.5 bg-slate-800 border border-white/10 hover:bg-slate-700 px-4 py-2 text-xs font-bold rounded-lg text-white transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              Leave Class
            </button>
          )}
        </div>
      </header>

      {/* ── Main Layout ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Grid */}
        <div className="flex-1 p-6 flex flex-col justify-center items-center overflow-y-auto">
          <div className="grid gap-4 w-full max-w-5xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3 h-full max-h-[75vh]">
            
            {/* Host Video Card */}
            <div className={cn(
              "relative bg-slate-900 border border-white/5 rounded-2xl overflow-hidden aspect-video flex flex-col items-center justify-center shadow-lg transition-all",
              isHost && !videoEnabled && "bg-slate-950"
            )}>
              {videoEnabled && (!isHost || videoEnabled) ? (
                <div className="absolute inset-0 bg-[#1e293b] flex flex-col items-center justify-center">
                  <div className="absolute top-3 left-3 bg-black/60 rounded px-2 py-0.5 text-[10px] font-medium border border-white/10 text-ai-cyan">
                    HOST / {isTrainer ? "TRAINER" : "COLLEGE"}
                  </div>
                  {/* Glowing user avatar representing feed */}
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl border border-primary/40 animate-pulse shadow-[0_0_20px_rgba(21,101,192,0.3)]">
                    {isHost ? "YOU" : (isTrainer ? "TR" : "CO")}
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-300">
                    {isHost ? "Your Camera Feed" : "Host Active Stream"}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 rounded-full bg-slate-850 flex items-center justify-center mx-auto text-slate-400">
                    <VideoOff className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-slate-400">Host camera off</p>
                </div>
              )}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="text-xs font-medium bg-black/60 rounded-md px-2 py-1 border border-white/5 text-white/90">
                  {isHost ? (isTrainer ? "Trainer (Instructor)" : "College Host") : "Host"}
                </span>
                <span className="p-1 bg-black/60 rounded-full border border-white/5 text-success">
                  <Mic className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

            {/* Student 1 Video Card */}
            <div className="relative bg-slate-900 border border-white/5 rounded-2xl overflow-hidden aspect-video flex flex-col items-center justify-center shadow-lg">
              <div className="absolute inset-0 bg-[#0f172a] flex flex-col items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                  AR
                </div>
                <div className="mt-2 text-xs font-medium text-slate-400">Arjun Reddy</div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="text-xs font-medium bg-black/60 rounded-md px-2 py-1 border border-white/5 text-white/90">
                  Arjun Reddy
                </span>
                <span className="p-1 bg-black/60 rounded-full border border-white/5 text-slate-400">
                  <MicOff className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

            {/* Student 2 Video Card */}
            <div className="relative bg-slate-900 border border-white/5 rounded-2xl overflow-hidden aspect-video flex flex-col items-center justify-center shadow-lg">
              <div className="absolute inset-0 bg-[#0f172a] flex flex-col items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20">
                  KP
                </div>
                <div className="mt-2 text-xs font-medium text-slate-400">Kavya Priya</div>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="text-xs font-medium bg-black/60 rounded-md px-2 py-1 border border-white/5 text-white/90">
                  Kavya Priya
                </span>
                <span className="p-1 bg-black/60 rounded-full border border-white/5 text-success">
                  <Mic className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

            {/* Screen Share Card (if active) */}
            {screenShareEnabled && (
              <div className="relative bg-slate-900 border border-primary/20 rounded-2xl overflow-hidden aspect-video flex flex-col items-center justify-center shadow-xl col-span-1 sm:col-span-2 md:col-span-2 border-2">
                <div className="absolute inset-0 bg-[#070b12] flex flex-col items-center justify-center">
                  <div className="absolute top-3 left-3 bg-primary px-2 py-0.5 text-[10px] font-bold rounded text-white flex items-center gap-1">
                    <Monitor className="h-3 w-3" />
                    SCREEN SHARING ACTIVE
                  </div>
                  <div className="text-center space-y-2">
                    <Monitor className="h-12 w-12 text-primary mx-auto animate-pulse" />
                    <p className="text-xs font-semibold text-white">Your screen is being shared with everyone.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Sidebar */}
        {chatOpen && (
          <div className="w-80 border-l border-white/5 bg-[#0b0f19] flex flex-col h-full animate-slide-in-right shrink-0">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Class Chat</h3>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white text-xs">Close</button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-1">
                <p className="text-slate-400 font-semibold">Arjun Reddy <span className="text-[10px] font-normal text-slate-500">10:15 AM</span></p>
                <p className="text-slate-200 bg-slate-900/50 rounded-lg p-2 border border-white/5">Hello sir, can you explain the dashboard structure again?</p>
              </div>
              <div className="space-y-1">
                <p className="text-primary font-semibold">Trainer <span className="text-[10px] font-normal text-slate-500">10:16 AM</span></p>
                <p className="text-slate-200 bg-primary/10 rounded-lg p-2 border border-primary/10">Yes Arjun, I'll go through the stat cards config in a minute.</p>
              </div>
            </div>
            <div className="p-4 border-t border-white/5 bg-[#0c1221]">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full bg-[#182035] border border-white/5 rounded-lg h-9 px-3 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* Participants Sidebar */}
        {participantsOpen && (
          <div className="w-80 border-l border-white/5 bg-[#0b0f19] flex flex-col h-full animate-slide-in-right shrink-0">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Participants (3)</h3>
              <button onClick={() => setParticipantsOpen(false)} className="text-slate-400 hover:text-white text-xs">Close</button>
            </div>
            <div className="flex-1 p-2 overflow-y-auto space-y-1 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[10px]">{isTrainer ? "TR" : "CO"}</div>
                  <span className="font-semibold">{isTrainer ? "Trainer (Host)" : "College (Host)"}</span>
                </div>
                <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded">{isTrainer ? "Instructor" : "Staff"}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-[10px]">AR</div>
                  <span>Arjun Reddy</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-[10px]">KP</div>
                  <span>Kavya Priya</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Control Bar ── */}
      <footer className="h-20 border-t border-white/5 bg-[#0B1220]/95 backdrop-blur px-8 flex items-center justify-between shrink-0">
        {/* Left indicators */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-white/5">
            <Users className="h-4 w-4 text-primary" />
            3 Connected
          </div>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-3 mx-auto sm:mx-0">
          <button
            onClick={() => setMicEnabled(!micEnabled)}
            className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center transition-all border shadow-md",
              micEnabled
                ? "bg-slate-800 border-white/10 hover:bg-slate-700 text-white"
                : "bg-error border-error hover:bg-error/90 text-white"
            )}
            title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
          >
            {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setVideoEnabled(!videoEnabled)}
            className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center transition-all border shadow-md",
              videoEnabled
                ? "bg-slate-800 border-white/10 hover:bg-slate-700 text-white"
                : "bg-error border-error hover:bg-error/90 text-white"
            )}
            title={videoEnabled ? "Stop Camera" : "Start Camera"}
          >
            {videoEnabled ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setScreenShareEnabled(!screenShareEnabled)}
            className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center transition-all border shadow-md",
              screenShareEnabled
                ? "bg-primary border-primary hover:bg-primary/95 text-white"
                : "bg-slate-800 border-white/10 hover:bg-slate-700 text-white"
            )}
            title="Share Screen"
          >
            <Monitor className="h-5 w-5" />
          </button>
        </div>

        {/* Right Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setChatOpen(!chatOpen);
              setParticipantsOpen(false);
            }}
            className={cn(
              "h-9 px-3 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-all",
              chatOpen
                ? "bg-primary/10 border-primary text-primary"
                : "bg-slate-800 border-white/10 text-slate-300 hover:text-white"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </button>

          <button
            onClick={() => {
              setParticipantsOpen(!participantsOpen);
              setChatOpen(false);
            }}
            className={cn(
              "h-9 px-3 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-all",
              participantsOpen
                ? "bg-primary/10 border-primary text-primary"
                : "bg-slate-800 border-white/10 text-slate-300 hover:text-white"
            )}
          >
            <Users className="h-4 w-4" />
            Users
          </button>
        </div>
      </footer>
    </div>
  );
}
