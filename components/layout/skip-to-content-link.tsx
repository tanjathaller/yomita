export function SkipToContentLink() {
  return (
    <a
      href="#main-content"
      className="bg-background text-foreground focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:shadow-md"
    >
      Zum Inhalt springen
    </a>
  );
}
