// Lightweight client-side auth helpers for the Student Management System.
// The login screen stores the signed-in session (role, email, JWT) here after
// a real /api/auth/login (and, when required, /api/auth/2fa/verify) round
// trip; logout clears it and returns the user to the login page. The token
// held here is issued and verified by the backend (see api/auth.py) — this
// module only persists it client-side and attaches it to outgoing requests.

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