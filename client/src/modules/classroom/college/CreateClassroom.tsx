import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/PageHeader";
import { Plus, Trash, ArrowLeft, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface ScheduleItem {
  day: string;
  start_time: string;
  end_time: string;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function CreateClassroom() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Basic Form States
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");
  const [semester, setSemester] = useState("");
  const [description, setDescription] = useState("");
  const [maxStudents, setMaxStudents] = useState(50);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // College-specific config states
  const [deptList, setDeptList] = useState<string[]>([]);
  const [batchList, setBatchList] = useState<string[]>([]);
  const [semList, setSemList] = useState<string[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    async function fetchCollegeData() {
      if (!user?.id) return;
      setIsLoadingProfile(true);
      try {
        const { data: profile, error: profileErr } = await supabase
          .from("college_profiles")
          .select("name, departments, batches, semesters")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileErr) {
          console.error("Error fetching college profile:", profileErr);
        }

        if (profile) {
          setDeptList(profile.departments || []);
          setBatchList(profile.batches || []);
          setSemList(profile.semesters || []);

          if (profile.name) {
            const { data: students, error: studentsErr } = await supabase
              .from("student_profiles")
              .select("department")
              .eq("college", profile.name);

            if (studentsErr) {
              console.error("Error fetching student counts:", studentsErr);
            } else if (students) {
              const counts: Record<string, number> = {};
              students.forEach((s: any) => {
                if (s.department) {
                  counts[s.department] = (counts[s.department] || 0) + 1;
                }
              });
              setStudentCounts(counts);
            }
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching college details:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    fetchCollegeData();
  }, [user?.id]);

  // Settings states
  const [recordingEnabled, setRecordingEnabled] = useState(true);
  const [allowStudentChat, setAllowStudentChat] = useState(true);
  const [allowScreenShare, setAllowScreenShare] = useState(true);
  const [visibility, setVisibility] = useState<"public" | "private">("private");

  // Schedule states
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [tempDay, setTempDay] = useState("Monday");
  const [tempStartTime, setTempStartTime] = useState("09:00");
  const [tempEndTime, setTempEndTime] = useState("10:00");

  const [errorMsg, setErrorMsg] = useState("");

  // Add schedule item
  const handleAddSchedule = () => {
    if (schedule.some((s) => s.day === tempDay && s.start_time === tempStartTime)) {
      return; // prevent exact duplicates
    }
    setSchedule([...schedule, { day: tempDay, start_time: tempStartTime, end_time: tempEndTime }]);
  };

  // Remove schedule item
  const handleRemoveSchedule = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  // Mutation to submit the classroom request
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/classrooms", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["college-classrooms"] });
      navigate("/college/classrooms");
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || "Failed to submit classroom request.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name || !department || !course || !batch || !semester || !startDate || !endDate) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }

    const payload = {
      name,
      department,
      course,
      batch,
      semester,
      description,
      max_students: Number(maxStudents),
      start_date: startDate,
      end_date: endDate,
      schedule,
      settings: {
        recording_enabled: recordingEnabled,
        allow_student_chat: allowStudentChat,
        allow_screen_share: allowScreenShare,
        visibility,
      },
    };

    mutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/college/classrooms")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader
          title="Request Smart Classroom"
          description="Create a new classroom request to be approved and assigned a trainer."
        />
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Section 1: Basic Information ── */}
        <div className="ps-card p-6 space-y-4">
          <h3 className="font-display font-semibold text-foreground text-base border-b pb-2">
            Basic Details
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Classroom Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Advanced Java Programming"
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Course *</label>
              <input
                type="text"
                required
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. B.Tech Computer Science"
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
             <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Department *</label>
              <select
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={isLoadingProfile}
              >
                <option value="">
                  {isLoadingProfile ? "Loading departments..." : "Select department..."}
                </option>
                {deptList.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept} ({studentCounts[dept] || 0})
                  </option>
                ))}
              </select>
              {!isLoadingProfile && deptList.length === 0 && (
                <p className="text-xs text-amber-500 mt-1">
                  No departments configured. Contact your admin or update settings.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Batch *</label>
                <select
                  required
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={isLoadingProfile}
                >
                  <option value="">
                    {isLoadingProfile ? "Loading..." : "Select batch..."}
                  </option>
                  {batchList.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                {!isLoadingProfile && batchList.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">No batches configured.</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Semester *</label>
                <select
                  required
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={isLoadingProfile}
                >
                  <option value="">
                    {isLoadingProfile ? "Loading..." : "Select semester..."}
                  </option>
                  {semList.map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
                {!isLoadingProfile && semList.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">No semesters configured.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief overview of the syllabus or classroom goals..."
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
        </div>

        {/* ── Section 2: Dates, Limits & Visibility ── */}
        <div className="ps-card p-6 space-y-4">
          <h3 className="font-display font-semibold text-foreground text-base border-b pb-2">
            Schedule & Enrollment Details
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Max Students *</label>
              <input
                type="number"
                required
                min={5}
                max={200}
                value={maxStudents}
                onChange={(e) => setMaxStudents(Number(e.target.value))}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Weekly Schedule Planner */}
          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium text-foreground block">Weekly Session Times</label>
            <div className="flex flex-col sm:flex-row gap-3 items-end bg-muted/30 p-3 rounded-lg border border-border">
              <div className="space-y-1 flex-1">
                <span className="text-xs text-muted-foreground">Select Day</span>
                <select
                  value={tempDay}
                  onChange={(e) => setTempDay(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Start Time</span>
                <input
                  type="time"
                  value={tempStartTime}
                  onChange={(e) => setTempStartTime(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">End Time</span>
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

            {/* List of Added Slots */}
            {schedule.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {schedule.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-sm"
                  >
                    <span>
                      <strong>{item.day}</strong>: {item.start_time} - {item.end_time}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSchedule(index)}
                      className="text-error hover:bg-error/5 p-1 rounded-md transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Section 3: Smart Settings ── */}
        <div className="ps-card p-6 space-y-4">
          <h3 className="font-display font-semibold text-foreground text-base border-b pb-2">
            Classroom Controls & Settings
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground block">
                  Automatic Recording
                </label>
                <span className="text-xs text-muted-foreground">
                  Record all live classes automatically when the session starts.
                </span>
              </div>
              <input
                type="checkbox"
                checked={recordingEnabled}
                onChange={(e) => setRecordingEnabled(e.target.checked)}
                className="h-4 w-4 text-primary border-input rounded focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground block">
                  Allow Student Chat
                </label>
                <span className="text-xs text-muted-foreground">
                  Allow students to type messages in the in-class live chat.
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowStudentChat}
                onChange={(e) => setAllowStudentChat(e.target.checked)}
                className="h-4 w-4 text-primary border-input rounded focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground block">
                  Allow Student Screen Share
                </label>
                <span className="text-xs text-muted-foreground">
                  Allow student accounts to present their screen to the classroom.
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowScreenShare}
                onChange={(e) => setAllowScreenShare(e.target.checked)}
                className="h-4 w-4 text-primary border-input rounded focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <div>
                <label className="text-sm font-medium text-foreground block">
                  Classroom Visibility
                </label>
                <span className="text-xs text-muted-foreground">
                  Public classes are discoverable, Private classes require invitation.
                </span>
              </div>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as "public" | "private")}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/college/classrooms")}
            className="btn-outline h-10 px-6"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn-primary h-10 px-6 flex items-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting Request...
              </>
            ) : (
              "Submit Classroom Request"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
