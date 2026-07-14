import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Eye, EyeOff, Sun, Moon, LogIn, UserPlus, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

export default function LoginPage() {
  const { signIn, signUp, user, role, isLoading, error } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // Already authenticated — redirect to dashboard
  if (user && role) {
    const dashboards = {
      student: "/student",
      college: "/college",
      trainer: "/trainer",
      admin: "/admin",
    };
    return <Navigate to={dashboards[role]} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    if (isSignUp) {
      const result = await signUp(email, password, selectedRole);
      if (result.success) {
        setSignUpSuccess(true);
        setIsSignUp(false); // Return to login to sign in
      }
    } else {
      await signIn(email, password);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-ai-cyan/10 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-[80px]" />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-border-card bg-card/80 backdrop-blur-sm transition-all hover:bg-muted"
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? (
          <Sun className="h-4 w-4 text-yellow-500" />
        ) : (
          <Moon className="h-4 w-4 text-slate-600" />
        )}
      </button>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md animate-scale-in px-4">
        <div className="glass-card p-8 shadow-elevated">
          {/* Logo / Branding */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-hero-gradient shadow-ai-glow">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              ProSculpt<span className="text-gradient">.ai</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignUp ? "Create a new account" : "Sign in to your account"}
            </p>
          </div>

          {/* Success message */}
          {signUpSuccess && (
            <div className="mb-4 rounded-lg border border-success/20 bg-success/5 px-4 py-3 text-sm text-success animate-fade-in text-center">
              Registration successful! You can now sign in with your credentials.
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-lg border border-error/20 bg-error/5 px-4 py-3 text-sm text-error animate-fade-in">
              {error === "{}"
                ? "Network connection error. Please verify you are connected to the internet and DNS resolution is working."
                : (typeof error === "string" ? error : (error as any).message || JSON.stringify(error))
              }
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector (only on SignUp) */}
            {isSignUp && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-sm font-medium text-foreground">
                  Register as
                </label>
                <div className="flex gap-1.5 rounded-lg bg-muted p-1">
                  {(["student", "trainer", "college"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={cn(
                        "flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-all",
                        selectedRole === r
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="btn-primary w-full justify-center text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {isSignUp ? "Registering…" : "Signing in…"}
                </>
              ) : (
                <>
                  {isSignUp ? (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Sign Up
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Signup */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setSignUpSuccess(false);
              }}
              className="text-sm font-medium text-primary hover:underline"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </button>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Powered by{" "}
            <span className="font-display font-semibold text-primary">
              ProSculpt<span className="text-ai-cyan">.ai</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
