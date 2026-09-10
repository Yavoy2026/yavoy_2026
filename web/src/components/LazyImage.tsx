import { useState } from "react";
import { cn } from "@/lib/utils";

/** In-memory cache of already-loaded image URLs — prevents re-fade on scroll back. */
const loadedCache = new Set<string>();

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Загружать немедленно (для hero-изображений первого экрана). */
  eager?: boolean;
}

/**
 * Изображение с нативной ленивой загрузкой, асинхронным декодированием,
 * плавным появлением и кэшем в памяти браузера.
 */
export function LazyImage({ src, alt, className, eager = false }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState<boolean>(() => loadedCache.has(src));

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={() => {
        loadedCache.add(src);
        setIsLoaded(true);
      }}
      className={cn(
        "bg-secondary/60",
        isLoaded ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
