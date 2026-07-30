// Lightweight client-side auth helpers for the demo Student Management System.
// The login screen stores the signed-in role here; logout clears it and
// returns the user to the login page. This is a mock auth layer (no backend).

export type Role = "admin" | "hod" | "teacher" | "student";

const KEY = "ssms-auth";

export interface Session {
  role: Role;
  email: string;
  token: string;
}

/** Authorization header for backend calls, empty when not signed in. */
export function authHeader(): Record<string, string> {
  const session = getSession();
  return session?.token ? { Authorization: `Bearer ${session.token}` } : {};
}

export function setSession(session: Session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/** Clears the session and sends the user back to the login page. */
export function logout() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.location.href = "/login";
}
