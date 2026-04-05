export function Footer() {
    return (
        <footer className="h-12 border-t border-border bg-card/50 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">
                OrtoMetric © {new Date().getFullYear()} - Ferramenta de medições radiológicas
            </p>
        </footer>
    )
}