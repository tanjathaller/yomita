export default function AdminHomePage() {
  return (
    <div className="mx-auto max-w-xl space-y-3 text-sm">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground leading-relaxed">
        Die Bearbeitung von <code className="text-foreground">SiteContent</code> folgt in einer
        späteren Phase (siehe{" "}
        <span className="text-foreground font-medium">build-plan.md</span>, Phasen 5–6).
      </p>
    </div>
  );
}
