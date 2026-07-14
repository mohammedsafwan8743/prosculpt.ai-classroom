import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { KeyRound, Link2, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";

type JoinMethod = "code" | "link";

/**
 * Join Classroom page — allows students to join via classroom code or invite link.
 * Calls POST /api/classrooms/join-by-code with the invite code.
 */
export default function JoinClassroom() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<JoinMethod>("code");
  const [classroomCode, setClassroomCode] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinedClassroom, setJoinedClassroom] = useState<{ name: string; course: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);
    setErrorMsg("");

    try {
      // Extract code from invite link if using link method
      let code = classroomCode.trim();
      if (method === "link") {
        // Try to extract code from URL like /join/PSA-XXXX or ?code=PSA-XXXX
        const linkValue = inviteLink.trim();
        const urlMatch = linkValue.match(/([A-Z0-9]+-[A-Z0-9]+)/i);
        code = urlMatch ? urlMatch[1] : linkValue;
      }

      const res = await api.post("/classrooms/join-by-code", { code });
      setJoinedClassroom(res.data.classroom);
      setJoinSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to join classroom. Please check the code and try again.";
      setErrorMsg(msg);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Join Classroom"
        description="Enter a classroom code or paste an invite link to join."
      />

      <div className="mx-auto max-w-lg">
        <div className="ps-card p-6">
          {/* ── Method Toggle ── */}
          <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => {
                setMethod("code");
                setJoinSuccess(false);
                setErrorMsg("");
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                method === "code"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <KeyRound className="h-4 w-4" />
              Classroom Code
            </button>
            <button
              onClick={() => {
                setMethod("link");
                setJoinSuccess(false);
                setErrorMsg("");
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                method === "link"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Link2 className="h-4 w-4" />
              Invite Link
            </button>
          </div>

          {/* ── Success State ── */}
          {joinSuccess ? (
            <div className="flex flex-col items-center py-8 text-center animate-scale-in">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Successfully Joined!
              </h3>
              {joinedClassroom && (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  You've been added to <strong className="text-foreground">{joinedClassroom.name}</strong> ({joinedClassroom.course}).
                </p>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setJoinSuccess(false);
                    setClassroomCode("");
                    setInviteLink("");
                    setJoinedClassroom(null);
                  }}
                  className="btn-outline text-sm"
                >
                  Join Another
                </button>
                <button
                  onClick={() => navigate("/student/classrooms")}
                  className="btn-primary text-sm"
                >
                  Go to My Classrooms
                </button>
              </div>
            </div>
          ) : (
            /* ── Join Form ── */
            <form onSubmit={handleJoin} className="space-y-5">
              {errorMsg && (
                <div className="rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
                  {errorMsg}
                </div>
              )}

              {method === "code" ? (
                <div className="space-y-1.5">
                  <label
                    htmlFor="classroom-code"
                    className="block text-sm font-medium text-foreground"
                  >
                    Classroom Code
                  </label>
                  <input
                    id="classroom-code"
                    type="text"
                    value={classroomCode}
                    onChange={(e) => setClassroomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. PSA-7K9M"
                    required
                    maxLength={20}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-center text-lg font-mono tracking-wider text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get the code from your college or trainer.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label
                    htmlFor="invite-link"
                    className="block text-sm font-medium text-foreground"
                  >
                    Invite Link
                  </label>
                  <input
                    id="invite-link"
                    type="url"
                    value={inviteLink}
                    onChange={(e) => setInviteLink(e.target.value)}
                    placeholder="https://prosculpt.ai/join/..."
                    required
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the invite link shared with you.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isJoining || (method === "code" ? !classroomCode : !inviteLink)}
                className="btn-primary w-full justify-center text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isJoining ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Joining…
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4" />
                    Join Classroom
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
