import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
  PlusCircle,
  Copy,
  Check,
  Share2,
  Edit,
  Trash,
  Plus,
  Loader2,
  X,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Classroom, ClassroomStatus } from "@/types";

type FilterStatus = "all" | ClassroomStatus;

export default function CollegeClassrooms() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Copy/Share state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<"code" | "link" | null>(null);

  // Edit Modal state
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [editName, setEditName] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editCourse, setEditCourse] = useState("");
  const [editBatch, setEditBatch] = useState("");
  const [editSemester, setEditSemester] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMaxStudents, setEditMaxStudents] = useState(50);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  const [editRecordingEnabled, setEditRecordingEnabled] = useState(true);
  const [editAllowStudentChat, setEditAllowStudentChat] = useState(true);
  const [editAllowScreenShare, setEditAllowScreenShare] = useState(true);
  const [editVisibility, setEditVisibility] = useState<"public" | "private">("private");

  const [editSchedule, setEditSchedule] = useState<{ day: string; start_time: string; end_time: string }[]>([]);
  const [tempDay, setTempDay] = useState("Monday");
  const [tempStartTime, setTempStartTime] = useState("09:00");
  const [tempEndTime, setTempEndTime] = useState("10:00");

  const [editErrorMsg, setEditErrorMsg] = useState("");

  // College Profile selection states
  const [deptList, setDeptList] = useState<string[]>([]);
  const [batchList, setBatchList] = useState<string[]>([]);
  const [semList, setSemList] = useState<string[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Fetch college profile metadata
  useEffect(() => {
    async function fetchCollegeData() {
      if (!user?.id) return;
      setIsLoadingProfile(true);
      try {
        const { data: profile } = await supabase
          .from("college_profiles")
          .select("departments, batches, semesters")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile) {
          setDeptList(profile.departments || []);
          setBatchList(profile.batches || []);
          setSemList(profile.semesters || []);
        }
      } catch (err) {
        console.error("Error fetching college profile details:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    fetchCollegeData();
  }, [user?.id]);

  // Populate edit fields when editingClassroom changes
  useEffect(() => {
    if (editingClassroom) {
      setEditName(editingClassroom.name || "");
      setEditDepartment(editingClassroom.department || "");
      setEditCourse(editingClassroom.course || "");
      setEditBatch(editingClassroom.batch || "");
      setEditSemester(editingClassroom.semester || "");
      setEditDescription(editingClassroom.description || "");
      setEditMaxStudents(editingClassroom.max_students || 50);
      setEditStartDate(editingClassroom.start_date ? editingClassroom.start_date.split("T")[0] : "");
      setEditEndDate(editingClassroom.end_date ? editingClassroom.end_date.split("T")[0] : "");
      setEditSchedule(editingClassroom.schedule || []);
      setEditRecordingEnabled(editingClassroom.settings?.recording_enabled ?? true);
      setEditAllowStudentChat(editingClassroom.settings?.allow_student_chat ?? true);
      setEditAllowScreenShare(editingClassroom.settings?.allow_screen_share ?? true);
      setEditVisibility(editingClassroom.settings?.visibility || "private");
      setEditErrorMsg("");
    }
  }, [editingClassroom]);

  // Copy/Share handlers
  const handleCopy = (text: string, classroomId: string, type: "code" | "link") => {
    navigator.clipboard.writeText(text);
    setCopiedId(classroomId);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedId(null);
      setCopiedType(null);
    }, 2000);
  };

  const getInviteLink = (code: string) => {
    return `${window.location.origin}/student/join?code=${code}`;
  };

  const handleShare = async (classroom: Classroom) => {
    if (!classroom.invite_code) return;
    const inviteLink = getInviteLink(classroom.invite_code);
    const shareData = {
      title: `Join ${classroom.name}`,
      text: `Join the smart classroom "${classroom.name}" on Prosculpt.ai using invite code: ${classroom.invite_code}`,
      url: inviteLink,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      setCopiedId(classroom.id);
      setCopiedType("link");
      setTimeout(() => {
        setCopiedId(null);
        setCopiedType(null);
      }, 2000);
    }
  };

  // Schedule handlers
  const handleAddSchedule = () => {
    if (editSchedule.some((s) => s.day === tempDay && s.start_time === tempStartTime)) {
      return;
    }
    setEditSchedule([...editSchedule, { day: tempDay, start_time: tempStartTime, end_time: tempEndTime }]);
  };

  const handleRemoveSchedule = (index: number) => {
    setEditSchedule(editSchedule.filter((_, i) => i !== index));
  };

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await api.patch(`/classrooms/${id}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["college-classrooms"] });
      setEditingClassroom(null);
    },
    onError: (err: any) => {
      setEditErrorMsg(err.response?.data?.error || "Failed to update classroom.");
    },
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassroom) return;
    if (!editName || !editDepartment || !editCourse || !editBatch || !editSemester || !editStartDate || !editEndDate) {
      setEditErrorMsg("Please fill out all required fields.");
      return;
    }
    const payload = {
      name: editName,
      department: editDepartment,
      course: editCourse,
      batch: editBatch,
      semester: editSemester,
      description: editDescription,
      max_students: Number(editMaxStudents),
      start_date: editStartDate,
      end_date: editEndDate,
      schedule: editSchedule,
      settings: {
        recording_enabled: editRecordingEnabled,
        allow_student_chat: editAllowStudentChat,
        allow_screen_share: editAllowScreenShare,
        visibility: editVisibility,
      },
    };
    editMutation.mutate({ id: editingClassroom.id, payload });
  };

  // Fetch college classrooms list
  const { data: classrooms = [], isLoading, error } = useQuery<Classroom[]>({
    queryKey: ["college-classrooms"],
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

  const filters: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Active", value: "active" },
    { label: "Completed", value: "completed" },
    { label: "Rejected", value: "rejected" },
  ];

  // Apply filters and search query
  const filteredClassrooms = classrooms.filter((classroom) => {
    const matchesFilter =
      activeFilter === "all" || classroom.status === activeFilter;
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
        title="College Classrooms"
        description="View and manage all classrooms for your college."
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

      {/* ── Filters & Search ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1 w-fit">
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
        <div className="flex items-center gap-2 self-end lg:self-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, course..."
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
      ) : filteredClassrooms.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No classrooms found"
          description={
            searchQuery || activeFilter !== "all"
              ? "Try adjusting your filters or search query."
              : "No classrooms requested yet. Click the button above to request a new classroom."
          }
          action={
            searchQuery || activeFilter !== "all"
              ? undefined
              : {
                  label: "Request Classroom",
                  onClick: () => navigate("/college/classrooms/new"),
                }
          }
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
            <CollegeClassroomCard
              key={classroom.id}
              classroom={classroom}
              viewMode={viewMode}
              onEdit={setEditingClassroom}
              onStartLiveSession={startLiveSession}
              handleCopy={handleCopy}
              handleShare={handleShare}
              getInviteLink={getInviteLink}
              copiedId={copiedId}
              copiedType={copiedType}
            />
          ))}
        </div>
      )}

      {/* ── Edit Classroom Modal ── */}
      {editingClassroom && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="ps-card w-full max-w-2xl p-6 space-y-6 my-8 animate-scale-in bg-card border border-border rounded-xl shadow-2xl text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display font-bold text-foreground text-lg">
                Edit Classroom Details
              </h3>
              <button
                type="button"
                onClick={() => setEditingClassroom(null)}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editErrorMsg && (
              <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
                {editErrorMsg}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Basic Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Classroom Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Course *</label>
                  <input
                    type="text"
                    required
                    value={editCourse}
                    onChange={(e) => setEditCourse(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Department *</label>
                  <select
                    required
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    disabled={isLoadingProfile}
                  >
                    <option value="">Select department...</option>
                    {deptList.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Batch *</label>
                    <select
                      required
                      value={editBatch}
                      onChange={(e) => setEditBatch(e.target.value)}
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isLoadingProfile}
                    >
                      <option value="">Select batch...</option>
                      {batchList.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Semester *</label>
                    <select
                      required
                      value={editSemester}
                      onChange={(e) => setEditSemester(e.target.value)}
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      disabled={isLoadingProfile}
                    >
                      <option value="">Select semester...</option>
                      {semList.map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Dates & limits */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">End Date *</label>
                  <input
                    type="date"
                    required
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Max Students *</label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={200}
                    value={editMaxStudents}
                    onChange={(e) => setEditMaxStudents(Number(e.target.value))}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Weekly Schedule */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-foreground block">Weekly Session Times</label>
                <div className="flex flex-col sm:flex-row gap-3 items-end bg-muted/30 p-3 rounded-lg border border-border">
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] text-muted-foreground">Select Day</span>
                    <select
                      value={tempDay}
                      onChange={(e) => setTempDay(e.target.value)}
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none"
                    >
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">Start Time</span>
                    <input
                      type="time"
                      value={tempStartTime}
                      onChange={(e) => setTempStartTime(e.target.value)}
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">End Time</span>
                    <input
                      type="time"
                      value={tempEndTime}
                      onChange={(e) => setTempEndTime(e.target.value)}
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSchedule}
                    className="btn-outline h-9 px-4 text-xs font-semibold shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Slot
                  </button>
                </div>

                {editSchedule.length > 0 && (
                  <div className="grid gap-2 sm:grid-cols-2 max-h-40 overflow-y-auto pr-1">
                    {editSchedule.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg border bg-card text-xs"
                      >
                        <span>
                          <strong>{item.day}</strong>: {item.start_time} - {item.end_time}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSchedule(idx)}
                          className="text-error hover:bg-error/5 p-1 rounded-md transition-colors"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings Controls */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-foreground block">
                      Automatic Recording
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      Record all live classes automatically.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editRecordingEnabled}
                    onChange={(e) => setEditRecordingEnabled(e.target.checked)}
                    className="h-4 w-4 text-primary border-input rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-foreground block">
                      Allow Student Chat
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      Enable live chat for students in class.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editAllowStudentChat}
                    onChange={(e) => setEditAllowStudentChat(e.target.checked)}
                    className="h-4 w-4 text-primary border-input rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium text-foreground block">
                      Allow Student Screen Share
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      Allow student accounts to present.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editAllowScreenShare}
                    onChange={(e) => setEditAllowScreenShare(e.target.checked)}
                    className="h-4 w-4 text-primary border-input rounded"
                  />
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block">
                      Classroom Visibility
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      Public or private invite requirement.
                    </span>
                  </div>
                  <select
                    value={editVisibility}
                    onChange={(e) => setEditVisibility(e.target.value as "public" | "private")}
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none"
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>

              {/* Form actions */}
              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setEditingClassroom(null)}
                  className="btn-outline h-9 px-4 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editMutation.isPending}
                  className="btn-primary h-9 px-4 text-xs font-semibold flex items-center gap-1.5"
                >
                  {editMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── College Classroom Card ── */

interface CollegeClassroomCardProps {
  classroom: Classroom;
  viewMode: "grid" | "list";
  onEdit: (classroom: Classroom) => void;
  onStartLiveSession: (classroomId: string) => void;
  handleCopy: (text: string, id: string, type: "code" | "link") => void;
  handleShare: (classroom: Classroom) => void;
  getInviteLink: (code: string) => string;
  copiedId: string | null;
  copiedType: "code" | "link" | null;
}

function CollegeClassroomCard({
  classroom,
  viewMode,
  onEdit,
  onStartLiveSession,
  handleCopy,
  handleShare,
  getInviteLink,
  copiedId,
  copiedType,
}: CollegeClassroomCardProps) {
  const navigate = useNavigate();
  const liveSession = classroom.class_sessions?.find((s: any) => s.status === "live");
  const isLive = !!liveSession;

  if (viewMode === "list") {
    return (
      <div className="ps-card flex w-full items-center gap-4 p-4 text-left">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-foreground truncate flex items-center gap-2">
            {classroom.name}
            {isLive && (
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {classroom.course} <span className="mx-1 text-border">•</span> {classroom.department}
          </p>
        </div>
        <div className="flex items-center gap-6">
          {classroom.invite_code && (
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase">Invite Code</span>
              <span className="text-xs font-mono font-semibold text-primary">{classroom.invite_code}</span>
            </div>
          )}
          <div className="hidden sm:flex flex-col text-right text-xs text-muted-foreground">
            <span>Batch: {classroom.batch}</span>
            <span>Sem: {classroom.semester}</span>
          </div>
          <StatusChip status={classroom.status} />

          {/* Actions */}
          <div className="flex items-center gap-1.5 border-l pl-4">
            {classroom.invite_code && (
              <>
                <button
                  type="button"
                  onClick={() => handleCopy(classroom.invite_code!, classroom.id, "code")}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"
                  title="Copy Code"
                >
                  {copiedId === classroom.id && copiedType === "code" ? (
                    <Check className="h-3.5 w-3.5 text-success animate-scale-in" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(getInviteLink(classroom.invite_code!), classroom.id, "link")}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"
                  title="Copy Invite Link"
                >
                  {copiedId === classroom.id && copiedType === "link" ? (
                    <Check className="h-3.5 w-3.5 text-success animate-scale-in" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleShare(classroom)}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all"
                  title="Share Invite"
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {classroom.status === "active" && (
              isLive ? (
                <button
                  type="button"
                  onClick={() => navigate(`/live/${classroom.id}`)}
                  className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded text-success hover:text-emerald-700 transition-all flex items-center gap-1 animate-pulse"
                  title="Join Active Session"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span className="text-xs font-bold">Join Live</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onStartLiveSession(classroom.id)}
                  className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-all flex items-center gap-1"
                  title="Start Live Session"
                >
                  <Play className="h-4 w-4" />
                  <span className="text-xs font-semibold">Go Live</span>
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => onEdit(classroom)}
              className="p-1.5 hover:bg-muted rounded text-primary hover:text-primary-hover transition-all"
              title="Edit Classroom"
            >
              <Edit className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ps-card space-y-4 p-5 text-left flex flex-col justify-between relative">
      {classroom.status === "active" && (
        <div className="absolute top-4 right-4 z-10">
          {isLive ? (
            <button
              type="button"
              onClick={() => navigate(`/live/${classroom.id}`)}
              className="h-8 px-3 text-xs font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 animate-pulse text-white rounded-lg shadow-md border-0"
              title="Join Active Session"
            >
              <Play className="h-3.5 w-3.5 fill-current text-white" />
              Join Live
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onStartLiveSession(classroom.id)}
              className="h-8 px-3 text-xs font-bold flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md border-0"
              title="Start Live Session"
            >
              <Play className="h-3.5 w-3.5 fill-current text-white" />
              Go Live
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-3 pr-24">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold text-foreground truncate flex items-center gap-2">
              {classroom.name}
              {isLive && (
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {classroom.course}
            </p>
          </div>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground h-10 pr-24">
          {classroom.description || "No description provided."}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground border-t pt-3">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {classroom.max_students} max students
          </span>
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            {classroom.schedule?.length ?? 0} sessions/week
          </span>
        </div>

        <div className="flex items-center justify-between border-t pt-3 pb-1">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              Batch: {classroom.batch} (Sem {classroom.semester})
            </span>
            {classroom.invite_code && (
              <span className="text-xs font-mono font-semibold text-primary mt-0.5 animate-pulse-subtle">
                Code: {classroom.invite_code}
              </span>
            )}
          </div>
          {!isLive && <StatusChip status={classroom.status} />}
        </div>
      </div>

      {/* Grid view actions footer */}
      <div className="flex items-center justify-between border-t pt-3 mt-1.5 gap-2">
        {classroom.invite_code ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleCopy(classroom.invite_code!, classroom.id, "code")}
              className="btn-outline h-7 px-2 text-[10px] font-semibold flex items-center gap-1 hover:bg-muted"
              title="Copy Invite Code"
            >
              {copiedId === classroom.id && copiedType === "code" ? (
                <>
                  <Check className="h-3 w-3 text-success animate-scale-in" />
                  Copied Code
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy Code
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleCopy(getInviteLink(classroom.invite_code!), classroom.id, "link")}
              className="btn-outline h-7 px-2 text-[10px] font-semibold flex items-center gap-1 hover:bg-muted"
              title="Copy Invite Link"
            >
              {copiedId === classroom.id && copiedType === "link" ? (
                <>
                  <Check className="h-3 w-3 text-success animate-scale-in" />
                  Copied Link
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy Link
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleShare(classroom)}
              className="btn-outline h-7 w-7 p-0 flex items-center justify-center hover:bg-muted"
              title="Share Invite"
            >
              <Share2 className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground italic">Code generated upon approval</span>
        )}
        <button
          type="button"
          onClick={() => onEdit(classroom)}
          className="btn-outline h-7 px-2.5 text-[10px] font-semibold flex items-center gap-1 ml-auto text-primary hover:bg-primary/5 hover:border-primary/30"
        >
          <Edit className="h-3 w-3" />
          Edit
        </button>
      </div>
    </div>
  );
}
