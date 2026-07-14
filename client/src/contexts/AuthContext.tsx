import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { User, UserRole } from "@/types";

/* ── Context Shape ── */

interface AuthState {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ── Provider ── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    role: null,
    isLoading: true,
    error: null,
  });

  /**
   * Fetch the user's role and profile from the `users` table.
   */
  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[Auth] Failed to fetch user profile:", error.message);
      return null;
    }

    return data as User;
  }, []);

  /**
   * Handle session change — fetch profile and update state.
   */
  const handleSession = useCallback(
    async (session: Session | null) => {
      if (!session?.user) {
        setState({
          session: null,
          user: null,
          role: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      const profile = await fetchUserProfile(session.user.id);

      setState({
        session,
        user: profile,
        role: profile?.role ?? null,
        isLoading: false,
        error: profile ? null : "Failed to load user profile",
      });
    },
    [fetchUserProfile]
  );

  /* ── Bootstrap: check existing session ── */
  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await handleSession(session);
    };

    initAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, [handleSession]);

  /* ── Sign In ── */
  const signIn = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
      }
    } catch (err: any) {
      console.error("[Auth] Sign in error:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || "An unexpected error occurred during sign in.",
      }));
    }
  }, []);

  /* ── Sign Up ── */
  const signUp = useCallback(async (email: string, password: string, role: UserRole) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            role,
          },
        },
      });

      if (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
        return { success: false, error: error.message };
      }

      if (data?.user) {
        // Create profile in the public users table (upsert is safe with trigger)
        const { error: profileError } = await supabase
          .from("users")
          .upsert({
            id: data.user.id,
            email,
            role,
          });

        if (profileError) {
          console.warn("[Auth] Failed to upsert profile into users table:", profileError.message);
        }

        // Initialize empty corresponding sub-profile based on role (upsert is safe with trigger)
        const profileName = email.split("@")[0];
        if (role === "student") {
          await supabase.from("student_profiles").upsert({ user_id: data.user.id, name: profileName });
        } else if (role === "college") {
          await supabase.from("college_profiles").upsert({ user_id: data.user.id, name: profileName });
        } else if (role === "trainer") {
          await supabase.from("trainer_profiles").upsert({ user_id: data.user.id, name: profileName });
        }
      }

      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: true };
    } catch (err: any) {
      console.error("[Auth] Sign up error:", err);
      const errMsg = err.message || "An unexpected error occurred during sign up.";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errMsg,
      }));
      return { success: false, error: errMsg };
    }
  }, []);

  /* ── Sign Out ── */
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      session: null,
      user: null,
      role: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ── Hook ── */

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
