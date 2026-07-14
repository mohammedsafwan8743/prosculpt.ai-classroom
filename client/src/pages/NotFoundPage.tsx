import { useNavigate } from "react-router-dom";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center text-center animate-fade-in">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-warning/10">
          <FileQuestion className="h-10 w-10 text-warning" />
        </div>
        <h1 className="font-display text-6xl font-bold text-gradient">404</h1>
        <h2 className="mt-2 font-display text-xl font-semibold text-foreground">
          Page Not Found
        </h2>
        <p className="mt-3 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-outline text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          <button
            onClick={() => navigate("/")}
            className="btn-primary text-sm"
          >
            <Home className="h-4 w-4" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
