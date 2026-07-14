import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  Clock,
  Video,
  Play,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Classroom } from "@/types";

/**
 * Student Dashboard — overview with stats, enrolled classrooms, and recent notifications.
 *
 * Data is fetched from Supabase via TanStack Query.
 */
export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch enrolled classrooms
  const { data: classrooms = [], isLoading: isClassroomsLoading } = useQuery<Classroom[]>({
    queryKey: ["student-classrooms"],
    queryFn: async () => {
      const res = await api.get("/classrooms");
      return res.data.data;
    },
  });

  // Fetch recent notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["student-notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications");
      return res.data.data;
    },
  });

  const greeting = getGreeting();

  const totalClassrooms = classrooms.length;
  const upcomingClasses = classrooms.filter((c) => c.status === "approved" || c.status === "active").length;
  const completedClasses = classrooms.filter((c) => c.status === "completed").length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <PageHeader
        title={`${greeting}, ${user?.email?.split("@")[0] ?? "Student"}`}
        description="Here's what's happening in your classrooms today."
      />

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/student/classrooms" className="block transition-all hover:-translate-y-1 hover:shadow-md rounded-xl">
          <StatCard
            label="Total Classrooms"
            value={isClassroomsLoading ? "..." : totalClassrooms}
            icon={BookOpen}
          />
        </Link>
        <Link to="/student/classrooms" className="block transition-all hover:-translate-y-1 hover:shadow-md rounded-xl">
          <StatCard
            label="Upcoming/Active"
            value={isClassroomsLoading ? "..." : upcomingClasses}
            icon={CalendarClock}
          />
        </Link>
        <Link to="/student/classrooms" className="block transition-all hover:-translate-y-1 hover:shadow-md rounded-xl">
          <StatCard
            label="Attendance"
            value="—"
            icon={BarChart3}
          />
        </Link>
        <Link to="/student/classrooms" className="block transition-all hover:-translate-y-1 hover:shadow-md rounded-xl">
          <StatCard
            label="Completed"
            value={isClassroomsLoading ? "..." : completedClasses}
            icon={CheckCircle2}
          />
        </Link>
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Classes */}
        <div className="lg:col-span-2">
          <div className="ps-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-foreground">
                My Classrooms
              </h2>
              <button
                onClick={() => navigate("/student/classrooms")}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {isClassroomsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : classrooms.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No upcoming classes"
                description="Join a classroom to see your upcoming sessions here."
                action={{
                  label: "Join Classroom",
                  onClick: () => navigate("/student/join"),
                }}
              />
            ) : (
              <div className="divide-y divide-border">
                {classrooms.slice(0, 5).map((c) => {
                  const liveSession = c.class_sessions?.find((s: any) => s.status === "live");
                  const isLive = !!liveSession;
                  return (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/student/classrooms/${c.id}`)}
                      className="flex cursor-pointer items-center justify-between py-3 hover:bg-muted/50 px-2 rounded-lg transition-colors"
                    >
                      <div>
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          {c.name}
                          {isLive && (
                            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                          )}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {c.course} • {c.department}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-mono">
                          {c.schedule?.length ? `${c.schedule.length} slots/wk` : "No schedule"}
                        </span>
                        {isLive ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/live/${c.id}`);
                            }}
                            className="rounded bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white uppercase animate-pulse border-0 flex items-center gap-1"
                          >
                            <Play className="h-2.5 w-2.5 fill-current text-white" />
                            Join Live
                          </button>
                        ) : (
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary uppercase">
                            {c.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1 space-y-4">
          <div className="ps-card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
              Recent Activity
            </h2>

            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>No recent activity</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {notifications.slice(0, 5).map((n: any) => (
                    <div key={n.id} className="text-xs border-b border-border pb-2 last:border-0 last:pb-0">
                      <p className="font-semibold text-foreground">{n.title || "Notification"}</p>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recordings Quick Access */}
          <div className="ps-card p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
              Latest Recordings
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Video className="h-4 w-4 shrink-0" />
              <span>No recordings available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Returns a time-appropriate greeting. */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
