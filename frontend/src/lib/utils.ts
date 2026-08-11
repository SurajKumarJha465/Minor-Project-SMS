import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * downloadFile — fetches a file (e.g. a server-generated PDF report) from an
 * authenticated backend endpoint and triggers a browser download. Replaces
 * the old downloadMockPdf() client-side placeholder generator now that the
 * backend issues real reports (see api/reports.py).
 *
 * Throws on a non-OK response so callers can show an error toast instead of
 * silently "downloading" an HTML error page.
 */
export async function downloadFile(url: string, headers: HeadersInit, fallbackFilename: string) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.detail || "";
    } catch {
      // response wasn't JSON — ignore, use the generic message below
    }
    throw new Error(detail || `Download failed (${res.status})`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || fallbackFilename;

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}