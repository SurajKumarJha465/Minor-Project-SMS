"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SafeAvatarImageProps {
  src: string | null | undefined;
  alt?: string;
  fallback: string;
  className?: string;
  imageClassName?: string;
  onError?: () => void;
}

/**
 * A wrapper around AvatarImage that gracefully handles external image URLs.
 * Radix UI's AvatarImage hides the image on any load error, showing only the fallback.
 * This component adds crossOrigin support and an onError callback so callers
 * can react to broken URLs (e.g. show a validation message).
 */
export function SafeAvatarImage({
  src,
  alt = "",
  fallback,
  className,
  imageClassName,
  onError,
}: SafeAvatarImageProps) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const handleError = React.useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const effectiveSrc = src && src.trim() ? src.trim() : undefined;

  return (
    <Avatar className={className}>
      {effectiveSrc && !hasError ? (
        <AvatarImage
          src={effectiveSrc}
          alt={alt}
          crossOrigin="anonymous"
          className={imageClassName}
          onError={handleError}
        />
      ) : null}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}

/**
 * Validate that a string looks like a reachable image URL.
 * Returns an error message string if invalid, or null if valid.
 */
export function validateImageUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null; // empty is allowed (clears photo)

  try {
    const parsed = new URL(trimmed);
    if (!parsed.protocol.startsWith("http")) {
      return "URL must start with http:// or https://";
    }
  } catch {
    return "Please enter a valid URL";
  }

  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".avif"];
  const lower = trimmed.toLowerCase();
  const hasImageExt = imageExtensions.some((ext) => lower.endsWith(ext));
  const hasImageInPath = lower.includes("/image") || lower.includes("img");

  // Allow URLs without extension if they look like image hosting/CDN links
  // (e.g. Unsplash, Cloudinary, Supabase storage, etc.)
  if (!hasImageExt && !hasImageInPath && !parsed.hostname.includes("googleusercontent") && !parsed.hostname.includes("cloudinary") && !parsed.hostname.includes("unsplash")) {
    return "URL does not appear to be an image. Please use a direct image link.";
  }

  return null;
}
