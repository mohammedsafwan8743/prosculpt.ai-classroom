import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle,
  Calendar,
  Users,
  Video,
  ArrowRight,
  GraduationCap,
  Play,
} from "lucide-react";
import api from "@/lib/axios";
import type { Classroom } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { EmptyState } from "@/components/ui/EmptyState";

export default function TrainerDashboard() {
  const navigate = useNavigate();

  // Fetch trainer classrooms list
  const { data: classrooms = [], isLoading, error } = useQuery<Classroom[]>({
    queryKey: ["trainer-classrooms"],
    queryFn: async () => {
      const res = await api.get("/classrooms");
      return res.data.data;
    },
  });

  const startLiveSession = async (classroomId: string) => {
    try {
      await api.post(`/classrooms/${classroomId}/sessions`);
      navigate(`/live/${classroomId}`);
    } catch (err: any) {
      console.error("Failed to start live session:", err);
      alert(err.response?.data?.error || "Failed to start live session. Please try again.");
    }
  };

  const totalClasses = classrooms.length;
  const activeClasses = classrooms.filter((c) => c.status === "active" || c.status === "approved").length;

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <p className="text-error font-semibold">Failed to load trainer dashboard.</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-outline text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Page Header ── */}
      <PageHeader
        title={`Welcome, Instructor`}
        description="Manage your smart classrooms, launch live sessions, and track student attendance."
      />

      {/* ── Statistics Cards ── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-card border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Assigned Classrooms"
            value={totalClasses}
            icon={BookOpen}
          />
          <StatCard
            label="Active Classrooms"
            value={activeClasses}
            icon={CheckCircle}
          />
          <StatCard
            label="Live Class Sessions"
            value={classrooms.filter((c) => c.status === "active").length}
            icon={Video}
          />
        </div>
      )}

      {/* ── Classrooms List ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">
            My Assigned Classrooms
          </h2>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl bg-card border border-border" />
            ))}
          </div>
        ) : classrooms.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No classrooms assigned"
            description="You have not been assigned to any smart classrooms yet. Contact the administration."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classrooms.map((c) => {
              const liveSession = c.class_sessions?.find((s: any) => s.status === "live");
              const isLive = !!liveSession;
              return (
                <div key={c.id} className="ps-card p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-bold text-foreground text-base truncate flex items-center gap-2">
                        {c.name}
                        {isLive && (
                          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        )}
                      </h3>
                      {isLive ? (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          LIVE
                        </span>
                      ) : (
                        <StatusChip status={c.status} />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Course: <span className="text-foreground font-medium">{c.course}</span> • Dept:{" "}
                      <span className="text-foreground font-medium">{c.department}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Batch: <span className="text-foreground font-medium">{c.batch}</span> (Sem{" "}
                      {c.semester})
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2 pt-1">
                      {c.description || "No description provided."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {c.max_students} max
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {c.schedule?.length ?? 0}/week
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {c.status === "active" && (
                        isLive ? (
                          <button
                            onClick={() => navigate(`/live/${c.id}`)}
                            className="btn-primary h-7 px-2.5 text-[10px] font-bold flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 animate-pulse text-white border-0"
                          >
                            <Play className="h-3 w-3 fill-current text-white" />
                            Resume
                          </button>
                        ) : (
                          <button
                            onClick={() => startLiveSession(c.id)}
                            className="btn-outline h-7 px-2.5 text-[10px] font-semibold flex items-center gap-1 hover:bg-muted text-foreground"
                          >
                            <Play className="h-3 w-3" />
                            Go Live
                          </button>
                        )
                      )}
                      <Link
                        to={`/trainer/classrooms/${c.id}`}
                        className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        View Details
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
