import type { SiteResponsiveImage } from "@/types/site-content";

import { resolveImageUrl } from "@/lib/resolve-image-url";
import { cn } from "@/lib/utils";

type ResponsiveSiteImageProps = {
  image: SiteResponsiveImage;
  /** z. B. `absolute inset-0 h-full w-full object-cover …` */
  imgClassName: string;
  pictureClassName?: string;
  priority?: boolean;
};

/**
 * Lädt nur die passende Quelle (Mobil &lt; lg vs. Desktop ≥ lg) per &lt;picture&gt;.
 */
export function ResponsiveSiteImage({
  image,
  imgClassName,
  pictureClassName,
  priority = false,
}: ResponsiveSiteImageProps) {
  const mobileSrc = resolveImageUrl(image.mobile.url);
  const desktopSrc = resolveImageUrl(image.desktop.url);

  return (
    <picture className={pictureClassName}>
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
