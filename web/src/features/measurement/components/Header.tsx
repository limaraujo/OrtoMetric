
export function Header() {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border/70 bg-card/85 backdrop-blur-md shadow-sm shadow-black/30">
      <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-between">

        <div className="flex flex-col items-start">
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Ortometric
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Plataforma de Medicoes Radiologicas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary-foreground">
            v1.0
          </span>
        </div>
      </div>
    </header>
  );
}