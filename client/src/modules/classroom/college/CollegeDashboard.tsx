import { useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle,
  Clock,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import api from "@/lib/axios";
import type { Classroom } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CollegeDashboard() {
  const navigate = useNavigate();

  // Fetch college classrooms list
  const { data: classrooms = [], isLoading, error } = useQuery<Classroom[]>({
    queryKey: ["college-classrooms"],
    queryFn: async () => {
      const res = await api.get("/classrooms");
      return res.data.data;
    },
  });

  // Calculate statistics
  const totalClasses = classrooms.length;
  const activeClasses = classrooms.filter((c) => c.status === "active").length;
  const pendingClasses = classrooms.filter((c) => c.status === "pending").length;
  const rejectedClasses = classrooms.filter((c) => c.status === "rejected").length;

  // Get most recent 5 classroom requests
  const recentClassrooms = [...classrooms]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <p className="text-error font-semibold">Failed to load dashboard data.</p>
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
        title="College Portal"
        description="Monitor and request smart classrooms for your campus."
        actions={
          <button
            onClick={() => navigate("/college/classrooms/new")}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Request Classroom
          </button>
        }
      />

      {/* ── Statistics Cards ── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-card border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/college/classrooms" className="block transition-all hover:-translate-y-1 hover:shadow-md rounded-xl">
            <StatCard
              label="Total Classrooms"
              value={totalClasses}
              icon={BookOpen}
            />
          </Link>
          <Link to="/college/classrooms" className="block transition-all hover:-translate-y-1 hover:shadow-md rounded-xl">
            <StatCard
              label="Active Classrooms"
              value={activeClasses}
              icon={CheckCircle}
            />
          </Link>
          <Link to="/college/classrooms" className="block transition-all hover:-translate-y-1 hover:shadow-md rounded-xl">
            <StatCard
              label="Pending Approval"
              value={pendingClasses}
              icon={Clock}
            />
          </Link>
          <Link to="/college/classrooms" className="block transition-all hover:-translate-y-1 hover:shadow-md rounded-xl">
            <StatCard
              label="Rejected Requests"
              value={rejectedClasses}
              icon={AlertTriangle}
            />
          </Link>
        </div>
      )}

      {/* ── Recent Requests Section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">
            Recent Classroom Requests
          </h2>
          {totalClasses > 0 && (
            <Link
              to="/college/classrooms"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all classrooms
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-card border border-border" />
            ))}
          </div>
        ) : classrooms.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No classrooms registered"
            description="Create your first AI-enabled smart classroom to assign trainers and invite students."
            action={{
              label: "Request Classroom",
              onClick: () => navigate("/college/classrooms/new"),
            }}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-muted-foreground font-medium">
                    <th className="p-4">Classroom Name</th>
                    <th className="p-4">Course & Dept</th>
                    <th className="p-4">Batch</th>
                    <th className="p-4">Max Students</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentClassrooms.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-display font-semibold text-foreground">
                        {c.name}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {c.course} <span className="mx-1.5 text-border">•</span> {c.department}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {c.batch} (Sem {c.semester})
                      </td>
                      <td className="p-4 text-muted-foreground">{c.max_students}</td>
                      <td className="p-4">
                        <StatusChip status={c.status} />
                      </td>
                      <td className="p-4 text-right text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
