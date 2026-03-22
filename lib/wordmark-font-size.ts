/**
 * Schriftgröße an die **Inhaltsbreite** des umgebenden Containers (`100cqi`).
 * Parent braucht `@container`.
 */
export function wordmarkFontSizeCss(name: string): string {
  const n = Math.max(name.replace(/\s/g, "").length || 1, 3);
  const trackingEm = 0.065;
  const widthFactor = n * 0.745 + trackingEm * Math.max(n - 1, 0);
  const f = widthFactor.toFixed(3);
  return `clamp(3.5rem, calc((100cqi - 0.05rem) / ${f}), 18rem)`;
}
