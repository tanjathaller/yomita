import type { SiteResponsiveImage } from "@/types/site-content";

import { resolveImageUrl } from "@/lib/resolve-image-url";
import { cn } from "@/lib/utils";

type ResponsiveSiteImageProps = {
  image: SiteResponsiveImage;
  /** z. B. `absolute inset-0 h-full w-full object-cover …` */
  imgClassName: string;
  pictureClassName?: string;
  priority?: boolean;
  /**
   * Wenn true: auf allen Viewports die Mobile-URL; nur wenn diese leer ist → Desktop-URL.
   * Nützlich für schmale Desktop-Layouts (z. B. eine einzelne Aktuelles-Card).
   */
  preferMobileIfSet?: boolean;
};

/**
 * Lädt die passende Quelle per &lt;picture&gt; (Mobil &lt; lg vs. Desktop ≥ lg),
 * sofern nicht {@link preferMobileIfSet} gesetzt ist.
 */
export function ResponsiveSiteImage({
  image,
  imgClassName,
  pictureClassName,
  priority = false,
  preferMobileIfSet = false,
}: ResponsiveSiteImageProps) {
  const mobileSrc = resolveImageUrl(image.mobile.url);
  const desktopSrc = resolveImageUrl(image.desktop.url);

  if (preferMobileIfSet) {
    const mobileUrl = image.mobile.url.trim();
    const src = mobileUrl ? mobileSrc : desktopSrc;
    return (
      <picture key={src} className={pictureClassName}>
        <img
          src={src}
          alt={image.alt}
          className={cn(imgClassName)}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
        />
      </picture>
    );
  }

  return (
    <picture key={`${mobileSrc}\u001f${desktopSrc}`} className={pictureClassName}>
      <source media="(min-width: 1024px)" srcSet={desktopSrc} />
      <img
        src={mobileSrc}
        alt={image.alt}
        className={cn(imgClassName)}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
      />
    </picture>
  );
}
