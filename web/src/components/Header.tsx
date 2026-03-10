
export function Header() {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-transparent bg-card/80 backdrop-blur-sm shadow-sm">
      <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-between">

        <div className="flex flex-col items-start">
          <h1 className="text-2xl font-bold text-foreground">
            OrtoMensure
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Ferramenta de Medições Radiológicas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
            v1.0
          </span>
        </div>
      </div>
    </header>
  );
}