import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  Users,
  Play,
  StopCircle,
  Loader2,
  Copy,
  Check,
  Share2,
} from "lucide-react";
import api from "@/lib/axios";
import type { Classroom } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { cn } from "@/lib/utils";

interface ClassSession {
  id: string;
  classroom_id: string;
  livekit_room_name: string;
  status: string;
}

export default function TrainerClassroomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [copiedType, setCopiedType] = useState<"code" | "link" | null>(null);

  const handleCopy = (text: string, type: "code" | "link") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const getInviteLink = (code: string) => {
    return `${window.location.origin}/student/join?code=${code}`;
  };

  const handleShare = async (className: string, code: string) => {
    const shareData = {
      title: `Join ${className}`,
      text: `Join the smart classroom "${className}" on Prosculpt.ai using invite code: ${code}`,
      url: getInviteLink(code),
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      setCopiedType("link");
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  // Fetch classroom details
  const { data: classroom, isLoading: isClassroomLoading, error: classroomError } = useQuery<Classroom>({
    queryKey: ["classroom", id],
    queryFn: async () => {
      const res = await api.get(`/classrooms/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  // Fetch active session status
  const { data: activeSession, isLoading: isSessionLoading } = useQuery<ClassSession | null>({
    queryKey: ["active-session", id],
    queryFn: async () => {
      const res = await api.get(`/classrooms/${id}/active-session`);
      return res.data.data;
    },
    refetchInterval: 5000, // Poll every 5 seconds to stay updated
    enabled: !!id,
  });

  // Mutation to start a live class
  const startClassMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/classrooms/${id}/sessions`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-session", id] });
      navigate(`/live/${id}`);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to start live class.");
    },
  });

  // Mutation to end a live class
  const endClassMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await api.post(`/classrooms/${id}/sessions/${sessionId}/end`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-session", id] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to end live class.");
    },
  });

  if (isClassroomLoading || isSessionLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading classroom details...</p>
      </div>
    );
  }

  if (classroomError || !classroom) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <p className="text-error font-semibold">Failed to find or load classroom details.</p>
        <button onClick={() => navigate(-1)} className="btn-outline text-sm">
          Go Back
        </button>
      </div>
    );
  }

  const isLive = !!activeSession;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Back + Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/trainer/dashboard")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader
          title={classroom.name}
          description={`${classroom.course} • Dept: ${classroom.department}`}
        />
      </div>

      {/* ── Live Session Control Banner ── */}
      <div className="ps-card overflow-hidden">
        <div className={cn(
          "transition-all duration-300 p-6 text-white",
          isLive ? "bg-success-gradient bg-emerald-700" : "bg-hero-gradient"
        )}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <StatusChip
                  status={isLive ? "active" : "scheduled"}
                  label={isLive ? "SESSION IS LIVE" : "Ready to Start"}
                />
              </div>
              <h2 className="font-display text-xl font-bold">
                {isLive ? "Live Class is Running" : "Launch Smart Classroom"}
              </h2>
              <p className="mt-1 text-sm text-white/70">
                {isLive
                  ? "Your students are waiting. Jump back in to resume teaching."
                  : "Start a new video session to deliver your lecture with real-time AI analytics."}
              </p>
            </div>
            
            <div className="flex gap-2">
              {isLive ? (
                <>
                  <button
                    onClick={() => navigate(`/live/${id}`)}
                    className="btn-ai bg-white text-emerald-800 hover:bg-white/90 text-sm font-bold flex items-center gap-1.5"
                  >
                    <Play className="h-4 w-4 fill-emerald-800" />
                    Resume Session
                  </button>
                  <button
                    onClick={() => endClassMutation.mutate(activeSession.id)}
                    disabled={endClassMutation.isPending}
                    className="btn-danger bg-red-650 hover:bg-red-700 text-white border border-red-500/20 text-sm font-bold flex items-center gap-1.5 rounded-lg px-4 py-2"
                  >
                    {endClassMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <StopCircle className="h-4 w-4" />
                    )}
                    End Class
                  </button>
                </>
              ) : (
                <button
                  onClick={() => startClassMutation.mutate()}
                  disabled={startClassMutation.isPending}
                  className="btn-ai text-sm font-bold flex items-center gap-1.5 bg-white text-primary hover:bg-white/95"
                >
                  {startClassMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 fill-primary" />
                  )}
                  Start Live Class
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Pulse bar */}
        {isLive && (
          <div className="flex items-center gap-3 border-t border-emerald-500/10 bg-emerald-55/5 px-6 py-3">
            <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Students can now join using their portal.
            </span>
          </div>
        )}
      </div>

      {/* ── Tabs Content ── */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="ps-card p-6 md:col-span-2 space-y-4">
          <h3 className="font-display text-lg font-bold text-foreground">Classroom Overview</h3>
          <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
            {classroom.description || "No description provided for this classroom."}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <CalendarClock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Class Schedule</p>
                <p className="text-sm font-semibold text-foreground">
                  {classroom.schedule?.length ? `${classroom.schedule.length} sessions/week` : "Not set"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Max Capacity</p>
                <p className="text-sm font-semibold text-foreground">{classroom.max_students} students</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="ps-card p-6 space-y-4">
          <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">Registration Details</h3>
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Batch</span>
              <span className="font-medium text-foreground">{classroom.batch}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Semester</span>
              <span className="font-medium text-foreground">Semester {classroom.semester}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Start Date</span>
              <span className="font-medium text-foreground">{new Date(classroom.start_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">End Date</span>
              <span className="font-medium text-foreground">{new Date(classroom.end_date).toLocaleDateString()}</span>
            </div>
            {classroom.invite_code && (
              <>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Invite Code</span>
                  <div className="flex items-center gap-1.5 font-mono font-semibold text-primary">
                    <span>{classroom.invite_code}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(classroom.invite_code!, "code")}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded"
                      title="Copy Code"
                    >
                      {copiedType === "code" ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col border-b pb-2 gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Invite Link</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(getInviteLink(classroom.invite_code!), "link")}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded"
                        title="Copy Link"
                      >
                        {copiedType === "link" ? (
                          <Check className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShare(classroom.name, classroom.invite_code!)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded"
                        title="Share Invite"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground truncate max-w-full select-all bg-muted/50 p-1.5 rounded border border-border/50">
                    {getInviteLink(classroom.invite_code)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
