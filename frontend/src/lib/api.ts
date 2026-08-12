import { getSession, logout } from "@/lib/auth";

const API_BASE =
  (import.meta as any).env?.VITE_RECOGNITION_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
  auth?: boolean; // default true
};

function buildHeaders(extra?: Record<string, string>, auth: boolean = true): Headers {
  const h = new Headers(extra ?? {});
  // Bypass ngrok's free-tier browser-warning interstitial, which otherwise
  // intercepts real requests (but not OPTIONS preflights) and returns HTML
  // with no CORS headers, causing the browser to block the response.
  h.set("ngrok-skip-browser-warning", "true");
  if (auth) {
    const token = getSession()?.token;
    if (token) h.set("Authorization", `Bearer ${token}`);
  }
  return h;
}

async function parseError(res: Response): Promise<ApiError> {
  let detail: string | undefined;
  try {
    const body = await res.json();
    detail = body?.detail ?? body?.message;
  } catch {
    // ignore parse failure
  }

  const msg = detail || `Request failed (${res.status})`;
  return new ApiError(msg, res.status, detail);
}

async function handleAuthFailure(res: Response) {
  if (res.status === 401) {
    // token expired/invalid -> clear + redirect
    logout();
    throw new ApiError("Session expired. Please login again.", 401);
  }
  if (res.status === 403) {
    throw new ApiError("You are not authorized for this action.", 403);
  }
}

export async function apiFetch(path: string, opts: RequestOptions = {}) {
  const { auth = true, headers, ...rest } = opts;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: buildHeaders(headers, auth),
  });

  if (res.status === 401 || res.status === 403) {
    await handleAuthFailure(res);
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  return res;
}

export async function apiJson<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await apiFetch(path, opts);
  return (await res.json()) as T;
}

export async function apiFormJson<T>(
  path: string,
  form: FormData,
  opts: Omit<RequestOptions, "body" | "method"> = {},
): Promise<T> {
  return apiJson<T>(path, {
    method: "POST",
    body: form,
    ...opts,
  });
}