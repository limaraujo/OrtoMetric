export function TrendChart() {
    return (
        <div className="rounded-xl border border-border bg-secondary/30 p-3" aria-label="Grafico simplificado de tendencia">
            <svg viewBox="0 0 320 90" role="img" aria-hidden="true">
                <defs>
                    <linearGradient id="line-blue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d="M16 65 C 52 48, 70 54, 95 45 C 127 34, 151 40, 177 30 C 204 19, 232 28, 258 18 C 277 10, 293 13, 304 8" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
                <path d="M16 65 C 52 48, 70 54, 95 45 C 127 34, 151 40, 177 30 C 204 19, 232 28, 258 18 C 277 10, 293 13, 304 8 L304 90 L16 90 Z" fill="url(#line-blue)" />
            </svg>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
                <span>Periodo: 90 dias</span>
                <span>Evolucao geral: melhora gradual</span>
            </div>
        </div>
    )
}
