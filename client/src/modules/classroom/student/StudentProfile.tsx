import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/PageHeader";
import { User, Mail, Building2, BookOpen, GraduationCap, Phone } from "lucide-react";

/**
 * Student Profile page — displays and allows editing of student profile information.
 * Connected to Supabase student_profiles table.
 */
export default function StudentProfile() {
  const { user } = useAuth();

  // TODO: Fetch student profile via TanStack Query
  // const { data: profile } = useStudentProfile();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Profile"
        description="View and manage your profile information."
        actions={
          <button className="btn-outline text-sm">
            Edit Profile
          </button>
        }
      />

      <div className="mx-auto max-w-2xl">
        {/* ── Avatar & Name ── */}
        <div className="ps-card flex flex-col items-center p-8 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
            {user?.email?.charAt(0).toUpperCase() ?? "S"}
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-foreground">
            {user?.email?.split("@")[0] ?? "Student"}
          </h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary font-display">
            <GraduationCap className="h-3.5 w-3.5" />
            Student
          </span>
        </div>

        {/* ── Profile Details ── */}
        <div className="ps-card mt-4 divide-y divide-border">
          <ProfileRow icon={User} label="Full Name" value="—" />
          <ProfileRow icon={Mail} label="Email" value={user?.email ?? "—"} />
          <ProfileRow icon={Building2} label="College" value="—" />
          <ProfileRow icon={BookOpen} label="Department" value="—" />
          <ProfileRow icon={GraduationCap} label="Batch / Semester" value="—" />
          <ProfileRow icon={Phone} label="Phone" value="—" />
        </div>
      </div>
    </div>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
