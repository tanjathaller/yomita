import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-muted/20 flex min-h-screen flex-col">
      <header className="bg-background border-b border-border px-4 py-3 sm:px-6">
        <span className="text-foreground font-semibold tracking-tight">Admin</span>
      </header>
      <div className="flex-1 px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
