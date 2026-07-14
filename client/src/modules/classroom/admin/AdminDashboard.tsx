import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  Check,
  X,
  Loader2,
  Users,
  Calendar,
} from "lucide-react";
import api from "@/lib/axios";
import type { Classroom } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { EmptyState } from "@/components/ui/EmptyState";

interface Trainer {
  id: string;
  email: string;
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [approvedCode, setApprovedCode] = useState<{ name: string; code: string } | null>(null);

  // Fetch all classrooms
  const { data: classrooms = [], isLoading, error } = useQuery<Classroom[]>({
    queryKey: ["admin-classrooms"],
    queryFn: async () => {
      const res = await api.get("/classrooms");
      return res.data.data;
    },
  });

  // Fetch trainers
  const { data: trainers = [] } = useQuery<Trainer[]>({
    queryKey: ["trainers"],
    queryFn: async () => {
      const res = await api.get("/auth/trainers");
      return res.data.data;
    },
    enabled: !!selectedClassroom, // fetch only when opening approval modal
  });

  // Calculate statistics
  const pendingRequests = classrooms.filter((c) => c.status === "pending").length;
  const approvedClasses = classrooms.filter((c) => c.status === "approved" || c.status === "active").length;
  const activeClasses = classrooms.filter((c) => c.status === "active").length;
  const rejectedRequests = classrooms.filter((c) => c.status === "rejected").length;

  // Pending requests list
  const pendingClassrooms = classrooms.filter((c) => c.status === "pending");

  // Mutation to Approve Classroom
  const approveMutation = useMutation({
    mutationFn: async ({ id, trainerId }: { id: string; trainerId: string }) => {
      const res = await api.patch(`/classrooms/${id}/approve`, { trainer_id: trainerId });
      return res.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin-classrooms"] });
      setApprovedCode({
        name: selectedClassroom?.name || "Classroom",
        code: data.invite_code,
      });
      setSelectedClassroom(null);
      setSelectedTrainerId("");
      setErrorMsg("");
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || "Failed to approve classroom.");
    },
  });

  // Mutation to Reject Classroom
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/classrooms/${id}/reject`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classrooms"] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Failed to reject classroom.");
    },
  });

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroom) return;
    approveMutation.mutate({
      id: selectedClassroom.id,
      trainerId: selectedTrainerId,
    });
  };

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <p className="text-error font-semibold">Failed to load admin dashboard.</p>
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
    <div className="space-y-8 animate-fade-in relative">
      {/* ── Page Header ── */}
      <PageHeader
        title="Admin Control Center"
        description="Review smart classroom requests, allocate trainers, and oversee campus activities."
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
          <Link to="/admin/classrooms" className="block transition-all hover:-translate-y-1 hover:shadow-md rounded-xl">
            <StatCard
              label="Pending Approvals"
              value={pendingRequests}
              icon={Clock}
            />
          </Link>
          <Link to="/admin/classrooms" className="block transition-all hover:-translate-y-1 hover:shadow-md rounded-xl">
            <StatCard
              label="Total Approved"
              value={approvedClasses}
              icon={CheckCircle}
            />
          </Link>
          <Link to="/admin/classrooms" className="block transition-all hover:-translate-y-1 hover:shadow-md rounded-xl">
            <StatCard
              label="Active Classrooms"
              value={activeClasses}
              icon={BookOpen}
            />
          </Link>
          <Link to="/admin/classrooms" className="block transition-all hover:-translate-y-1 hover:shadow-md rounded-xl">
            <StatCard
              label="Rejected Requests"
              value={rejectedRequests}
              icon={AlertTriangle}
            />
          </Link>
        </div>
      )}

      {/* ── Pending Requests List ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">
            Pending Classroom Requests
          </h2>
          {classrooms.length > 0 && (
            <Link
              to="/admin/classrooms"
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
        ) : pendingClassrooms.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="All caught up!"
            description="No pending smart classroom approval requests found."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pendingClassrooms.map((c) => (
              <div key={c.id} className="ps-card p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-bold text-foreground text-base truncate">
                      {c.name}
                    </h3>
                    <StatusChip status="pending" />
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
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => rejectMutation.mutate(c.id)}
                      disabled={rejectMutation.isPending}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-error/20 bg-error/5 text-error hover:bg-error hover:text-white transition-colors"
                      title="Reject Request"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedClassroom(c);
                        setSelectedTrainerId("");
                      }}
                      className="flex h-8 px-3 items-center justify-center gap-1 rounded-lg bg-success text-white hover:bg-success/90 transition-colors text-xs font-semibold"
                      title="Approve & Assign Trainer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Approve & Assign Trainer Modal ── */}
      {selectedClassroom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="ps-card w-full max-w-md p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-display font-bold text-foreground text-lg">
                Approve Classroom
              </h3>
              <button
                onClick={() => setSelectedClassroom(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{selectedClassroom.name}</p>
              <p className="text-xs text-muted-foreground">
                Course: {selectedClassroom.course} • Dept: {selectedClassroom.department}
              </p>
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Allocate Trainer</label>
                <select
                  required
                  value={selectedTrainerId}
                  onChange={(e) => setSelectedTrainerId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">Select an available trainer...</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.email}
                    </option>
                  ))}
                </select>
                {trainers.length === 0 && (
                  <p className="text-xs text-warning pt-1">
                    No trainers found in the system.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedClassroom(null)}
                  className="btn-outline h-9 px-4 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approveMutation.isPending || !selectedTrainerId}
                  className="btn-primary h-9 px-4 text-xs font-semibold flex items-center gap-1.5"
                >
                  {approveMutation.isPending ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Confirm Approval
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Approval Success / Invite Code Modal ── */}
      {approvedCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="ps-card w-full max-w-md p-6 space-y-4 text-center animate-scale-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-foreground text-lg">
              Classroom Approved!
            </h3>
            <p className="text-sm text-muted-foreground">
              Smart classroom <strong className="text-foreground">{approvedCode.name}</strong> has been successfully approved and assigned to the trainer.
            </p>
            <div className="bg-muted p-4 rounded-lg border border-border">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                Student Invite Code
              </p>
              <p className="text-2xl font-mono font-bold text-primary tracking-wider mt-1">
                {approvedCode.code}
              </p>
            </div>
            <button
              onClick={() => setApprovedCode(null)}
              className="btn-primary w-full justify-center text-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
