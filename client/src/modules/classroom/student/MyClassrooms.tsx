import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { SkeletonClassroomCard } from "@/components/ui/LoadingSkeleton";
import {
  BookOpen,
  Search,
  LayoutGrid,
  List,
  CalendarClock,
  Users,
  UserCircle,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Classroom } from "@/types";

type FilterTab = "all" | "active" | "upcoming" | "completed";

/**
 * Student "My Classrooms" page — grid/list of enrolled classrooms.
 * Connected to Supabase via TanStack Query.
 */
export default function MyClassrooms() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: classrooms = [], isLoading, error } = useQuery<Classroom[]>({
    queryKey: ["student-classrooms"],
    queryFn: async () => {
      const res = await api.get("/classrooms");
      return res.data.data;
    },
  });

  const filters: { label: string; value: FilterTab }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Upcoming", value: "upcoming" },
    { label: "Completed", value: "completed" },
  ];

  // Apply filters and search query
  const filteredClassrooms = classrooms.filter((classroom) => {
    let matchesFilter = true;
    if (activeFilter === "active") {
      matchesFilter = classroom.status === "active";
    } else if (activeFilter === "upcoming") {
      matchesFilter = classroom.status === "approved";
    } else if (activeFilter === "completed") {
      matchesFilter = classroom.status === "completed";
    }

    const matchesSearch =
      classroom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classroom.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classroom.department.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <p className="text-error font-semibold">Failed to load classrooms.</p>
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
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Classrooms"
        description="View and manage your enrolled classrooms."
        actions={
          <button
            onClick={() => navigate("/student/join")}
            className="btn-primary text-sm"
          >
            Join Classroom
          </button>
        }
      />

      {/* ── Filters & Search ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                activeFilter === filter.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Search + View Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search classrooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-60 rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex rounded-lg border border-input">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-l-lg transition-colors",
                viewMode === "grid"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-r-lg transition-colors",
                viewMode === "list"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonClassroomCard key={i} />
          ))}
        </div>
      ) : classrooms.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No classrooms found"
          description="You haven't joined any classrooms yet. Use a classroom code or invite link to get started."
          action={{
            label: "Join Classroom",
            onClick: () => navigate("/student/join"),
          }}
        />
      ) : filteredClassrooms.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No matching classrooms"
          description="Try adjusting your filters or search query."
        />
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          )}
        >
          {filteredClassrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              classroom={classroom}
              viewMode={viewMode}
              onClick={() => navigate(`/student/classrooms/${classroom.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Classroom Card ── */

interface ClassroomCardProps {
  classroom: Classroom;
  viewMode: "grid" | "list";
  onClick: () => void;
}

function ClassroomCard({ classroom, viewMode, onClick }: ClassroomCardProps) {
  const navigate = useNavigate();
  const liveSession = classroom.class_sessions?.find((s: any) => s.status === "live");
  const isLive = !!liveSession;

  if (viewMode === "list") {
    return (
      <button
        onClick={onClick}
        className="ps-card-interactive flex w-full items-center gap-4 p-4 text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-semibold text-foreground flex items-center gap-2">
            {classroom.name}
            {isLive && (
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {classroom.course} • {classroom.department}
          </p>
        </div>
        {isLive ? (
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              LIVE
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/live/${classroom.id}`);
              }}
              className="btn-primary h-8 px-3 text-xs font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 animate-pulse text-white border-0"
            >
              <Play className="h-3 w-3 fill-current text-white" />
              Join Class
            </button>
          </div>
        ) : (
          <StatusChip status={classroom.status} />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="ps-card-interactive space-y-4 p-5 text-left flex flex-col justify-between"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display font-semibold text-foreground flex items-center gap-2">
              {classroom.name}
              {isLive && (
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {classroom.course}
            </p>
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {classroom.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <UserCircle className="h-3.5 w-3.5" />
            Trainer
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {classroom.max_students} max
          </span>
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            {classroom.schedule?.length ?? 0} sessions/week
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-3 mt-1.5">
        {isLive ? (
          <>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              LIVE NOW
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/live/${classroom.id}`);
              }}
              className="btn-primary h-7 px-2.5 text-[10px] font-bold flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 animate-pulse text-white border-0"
            >
              <Play className="h-3 w-3 fill-current text-white" />
              Join Class
            </button>
          </>
        ) : (
          <StatusChip status={classroom.status} />
        )}
      </div>
    </button>
  );
}
