import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Classroom } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ArrowLeft,
  Video,
  CalendarClock,
  Users,
  UserCircle,
  Clock,
  FileText,
  BarChart3,
  Play,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Tab = "overview" | "attendance" | "recordings" | "materials";

interface ClassSession {
  id: string;
  classroom_id: string;
  livekit_room_name: string;
  status: string;
}

/**
 * Classroom Detail page for students.
 * Shows class info, join live session button, attendance, recordings, and materials tabs.
 */
export default function ClassroomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Fetch classroom details
  const { data: classroom, isLoading: isClassroomLoading, error } = useQuery<Classroom>({
    queryKey: ["classroom", id],
    queryFn: async () => {
      const res = await api.get(`/classrooms/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  // Fetch active session status
  const { data: activeSession } = useQuery<ClassSession | null>({
    queryKey: ["active-session", id],
    queryFn: async () => {
      const res = await api.get(`/classrooms/${id}/active-session`);
      return res.data.data;
    },
    refetchInterval: 5000, // Poll every 5s to auto-detect class start
    enabled: !!id,
  });

  const tabs: { label: string; value: Tab; icon: typeof Video }[] = [
    { label: "Overview", value: "overview", icon: CalendarClock },
    { label: "Attendance", value: "attendance", icon: BarChart3 },
    { label: "Recordings", value: "recordings", icon: Video },
    { label: "Materials", value: "materials", icon: FileText },
  ];

  if (isClassroomLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading classroom details...</p>
      </div>
    );
  }

  if (error || !classroom) {
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
          onClick={() => navigate("/student/classrooms")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader
          title={classroom.name}
          description={`${classroom.course} • Dept: ${classroom.department}`}
        />
      </div>

      {/* ── Live Session Banner ── */}
      <div className="ps-card overflow-hidden">
        <div className={cn(
          "transition-all duration-350 p-6 text-white",
          isLive ? "bg-success-gradient bg-emerald-700 animate-pulse-subtle" : "bg-hero-gradient"
        )}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <StatusChip
                  status={isLive ? "active" : "scheduled"}
                  label={isLive ? "CLASS IS LIVE NOW" : "No Active Session"}
                />
              </div>
              <h2 className="font-display text-xl font-bold">Live Session</h2>
              <p className="mt-1 text-sm text-white/70">
                {isLive
                  ? "The trainer has started the live video session. Connect now to join the class."
                  : "The trainer has not started the class yet. You'll be notified when it begins."}
              </p>
            </div>
            <button
              onClick={() => navigate(`/live/${id}`)}
              disabled={!isLive}
              className={cn(
                "btn-ai transition-all duration-350 text-sm font-bold flex items-center gap-1.5",
                isLive
                  ? "bg-white text-emerald-800 hover:bg-white/90 shadow-lg cursor-pointer"
                  : "opacity-60 cursor-not-allowed bg-white/20 text-white/80"
              )}
            >
              <Play className="h-4 w-4 fill-current" />
              Join Session
            </button>
          </div>
        </div>

        {/* Waiting / Join bar */}
        <div className="flex items-center gap-3 border-t border-white/10 bg-primary/5 px-6 py-3">
          <div className={cn(
            "h-2.5 w-2.5 rounded-full",
            isLive ? "bg-emerald-500 animate-ping" : "bg-warning animate-pulse"
          )} />
          <span className="text-sm text-muted-foreground">
            {isLive
              ? "Live session active. Tap 'Join Session' to start the video call."
              : "Waiting for trainer to start the session…"}
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
              activeTab === tab.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="ps-card p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Class Details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow
                icon={UserCircle}
                label="Trainer"
                value={classroom.trainer_id ? "Assigned (Instructor)" : "Not assigned"}
              />
              <InfoRow
                icon={CalendarClock}
                label="Schedule"
                value={classroom.schedule?.length ? `${classroom.schedule.length} sessions/week` : "Not set"}
              />
              <InfoRow
                icon={Users}
                label="Students Cap"
                value={`${classroom.max_students} capacity`}
              />
              <InfoRow
                icon={Clock}
                label="Course Batch"
                value={`${classroom.batch} (Sem ${classroom.semester})`}
              />
            </div>
          </div>
        )}

        {activeTab === "attendance" && (
          <EmptyState
            icon={BarChart3}
            title="No attendance records"
            description="Attendance will appear here after you join a live session."
          />
        )}

        {activeTab === "recordings" && (
          <EmptyState
            icon={Video}
            title="No recordings yet"
            description="Recorded sessions will be available here after the trainer enables recording."
          />
        )}

        {activeTab === "materials" && (
          <EmptyState
            icon={FileText}
            title="No materials uploaded"
            description="The trainer will share notes and materials here."
          />
        )}
      </div>
    </div>
  );
}

/* ── Helper Components ── */

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Video;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
