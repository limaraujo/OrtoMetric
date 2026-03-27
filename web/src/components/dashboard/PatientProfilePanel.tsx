import type { Patient } from './types'

type Props = {
  patient: Patient
}

export function PatientProfilePanel({ patient }: Props) {
  return (
    <article className="clinical-card !rounded-2xl !p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-foreground">{patient.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {patient.gender} • {patient.age} anos • {patient.id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="clinical-button clinical-button-ghost">Editar paciente</button>
          <button type="button" className="clinical-button border border-destructive/35 bg-destructive/10 text-red-200 hover:bg-destructive/20">
            Excluir paciente
          </button>
        </div>
      </header>

      <div className="mb-4 rounded-xl border border-border/70 bg-secondary/30 p-3">
        <strong className="block text-sm font-semibold">Notas clinicas</strong>
        <p className="mt-1 text-sm text-muted-foreground">{patient.notes}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-background/70 p-3">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assimetria postural</span>
          <strong className="mt-1 block text-lg text-foreground">{patient.metrics.posturalAsymmetry}</strong>
        </div>
        <div className="rounded-xl border border-border/70 bg-background/70 p-3">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Angulo principal</span>
          <strong className="mt-1 block text-lg text-foreground">{patient.metrics.mainAngle}</strong>
        </div>
        <div className="rounded-xl border border-border/70 bg-background/70 p-3">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Variacao recente</span>
          <strong className="mt-1 block text-lg text-foreground">{patient.metrics.variation}</strong>
        </div>
      </div>
    </article>
  )
}
