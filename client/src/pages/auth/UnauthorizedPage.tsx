import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const dashboards = {
    student: "/student",
    college: "/college",
    trainer: "/trainer",
    admin: "/admin",
  };

  const handleGoBack = () => {
    if (role) {
      navigate(dashboards[role], { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center text-center animate-fade-in">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-error/10">
          <ShieldAlert className="h-10 w-10 text-error" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Access Denied
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          You don't have permission to access this page.
          <br />
          Please contact your administrator if you believe this is a mistake.
        </p>
        <button onClick={handleGoBack} className="btn-primary mt-8">
          <ArrowLeft className="h-4 w-4" />
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
