/** Shared server-side types */

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: "student" | "college" | "trainer" | "admin";
}

/** Extend Express Request to include authenticated user */
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
