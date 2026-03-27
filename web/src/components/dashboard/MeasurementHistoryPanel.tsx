import { TrendChart } from './TrendChart'
import type { MeasurementRecord } from './types'

type Props = {
    records: MeasurementRecord[]
    expandedRecordId: string | null
    onToggleRecord: (recordId: string) => void
}

export function MeasurementHistoryPanel({ records, expandedRecordId, onToggleRecord }: Props) {
    return (
        <section className="clinical-card !rounded-2xl !p-5">
            <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-black">Historico de medicoes</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Linha do tempo com resultados e detalhamento expandivel</p>
                </div>
                <div className="flex gap-2" role="group" aria-label="Filtrar periodo">
                    <button type="button" className="rounded-full border border-primary/40 bg-primary/20 px-3 py-1 text-xs font-semibold text-primary-foreground">30 dias</button>
                    <button type="button" className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary/70">90 dias</button>
                    <button type="button" className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary/70">6 meses</button>
                </div>
            </header>

            <div className="overflow-hidden rounded-xl border border-border" role="table" aria-label="Tabela de historico de medicoes">
                <div className="grid grid-cols-[1fr_1.2fr_0.8fr_auto] gap-2 bg-secondary/50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground max-md:grid-cols-1" role="row">
                    <span>Data</span>
                    <span>Tipo</span>
                    <span>Resultado</span>
                    <span>Acao</span>
                </div>

                {records.map((record) => {
                    const expanded = expandedRecordId === record.id
                    return (
                        <div key={record.id} className={expanded ? 'border-t border-border bg-secondary/20' : 'border-t border-border bg-card'}>
                            <div className="grid grid-cols-[1fr_1.2fr_0.8fr_auto] items-center gap-2 px-3 py-2 max-md:grid-cols-1" role="row">
                                <span>{record.date}</span>
                                <span>{record.type}</span>
                                <strong>{record.result}</strong>
                                <button type="button" className="clinical-button clinical-button-ghost !px-3 !py-1 text-xs" onClick={() => onToggleRecord(record.id)}>
                                    {expanded ? 'Recolher' : 'Expandir'}
                                </button>
                            </div>
                            {expanded && <p className="px-3 pb-3 text-sm text-muted-foreground">{record.details}</p>}
                        </div>
                    )
                })}
            </div>

            <TrendChart />
        </section>
    )
}
