import { useState } from "react";
import { imageUrl } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SauceImage({
  src,
  alt,
  width = 600,
  className,
}: {
  src?: string;
  alt: string;
  width?: number;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const url = imageUrl(src, width);

  return (
    <div className={cn("relative overflow-hidden bg-[#120e0c]", className)}>
      {!loaded && !failed && <div className="shimmer absolute inset-0" />}
      {failed || !url ? (
        <div className="grid h-full w-full place-items-center text-3xl" aria-hidden>
          🌶️
        </div>
      ) : (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-contain transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
        />
      )}
    </div>
  );
}
