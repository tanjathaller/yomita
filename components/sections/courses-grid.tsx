"use client";

import { useEffect, useRef } from "react";

type CoursesGridProps = {
  className?: string;
  children: React.ReactNode;
};

export function CoursesGrid({ className, children }: CoursesGridProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function equalize() {
      if (!el) return;
      // While any accordion is open: don't touch heights (prevents sibling stretch)
      if (el.querySelector("details[open]")) return;
      const isLg = window.innerWidth >= 1024;
      const items = Array.from(el.children) as HTMLElement[];
      items.forEach((item) => {
        item.style.minHeight = "";
      });
      if (!isLg) return;
      for (let i = 0; i < items.length; i += 2) {
        const a = items[i];
        const b = items[i + 1];
        if (!b) break;
        const maxH = Math.max(a.offsetHeight, b.offsetHeight);
        if (maxH > 0) {
          a.style.minHeight = `${maxH}px`;
          b.style.minHeight = `${maxH}px`;
        }
      }
    }

    equalize();

    let resizeTimer: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(equalize, 100);
    }
    window.addEventListener("resize", onResize);

    // Re-equalize whenever a details element closes (capture phase catches nested details)
    el.addEventListener("toggle", equalize, true);

    return () => {
      window.removeEventListener("resize", onResize);
      el.removeEventListener("toggle", equalize, true);
      clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
