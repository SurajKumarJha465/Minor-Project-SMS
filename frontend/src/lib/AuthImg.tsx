import { useEffect, useState } from "react";
import { authHeader } from "@/lib/auth";

// Plain <img src="https://<ngrok-url>/..."> can't carry custom headers, so it
// hits ngrok's free-tier browser-warning interstitial and renders that HTML
// page's favicon/broken-image instead of the actual photo — even though a
// fetch() to the same URL with ngrok-skip-browser-warning works fine.
// This component fetches the image with that header, turns it into a blob
// URL, and uses that as the img src instead.
// Hook variant for consumers that need a plain src string (e.g. shadcn's
// <AvatarImage src=... />) rather than a standalone <img>.
export function useAuthImgSrc(src?: string): string | undefined {
  const [blobUrl, setBlobUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!src) {
      setBlobUrl(undefined);
      return;
    }
    let cancelled = false;
    let objectUrl: string | undefined;

    fetch(src, { headers: { ...authHeader() } })
      .then((res) => (res.ok ? res.blob() : Promise.reject(res)))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setBlobUrl(undefined);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return blobUrl;
}

export default function AuthImg({
  src,
  alt,
  className,
}: {
  src?: string;
  alt?: string;
  className?: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!src) {
      setBlobUrl(undefined);
      return;
    }
    let cancelled = false;
    let objectUrl: string | undefined;

    fetch(src, { headers: { ...authHeader() } })
      .then((res) => (res.ok ? res.blob() : Promise.reject(res)))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setBlobUrl(undefined);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!blobUrl) return null;
  return <img src={blobUrl} alt={alt} className={className} />;
}