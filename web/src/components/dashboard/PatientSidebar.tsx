import type { Patient, PatientStatus } from './types'
import InputField from '../ui/InputField'

type Props = {
    query: string
    onQueryChange: (value: string) => void
    statusFilter: 'Todos' | PatientStatus
    onStatusFilterChange: (status: 'Todos' | PatientStatus) => void
    patients: Patient[]
    selectedPatientId: string
    onSelectPatient: (patientId: string) => void
}

function getStatusClass(status: PatientStatus) {
    if (status === 'Ativo') return 'rounded-full border border-primary/40 bg-primary/20 px-2 py-0.5 text-[11px] font-semibold text-primary-foreground'
    if (status === 'Em acompanhamento') return 'rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-blue-200'
    return 'rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground'
}

export function PatientSidebar(props: Props) {
    const {
        query,
        onQueryChange,
        statusFilter,
        onStatusFilterChange,
        patients,
        selectedPatientId,
        onSelectPatient,
    } = props

    return (
        <aside className="clinical-card !rounded-2xl !bg-card/80 !p-4 backdrop-blur-md lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-hidden">
            <div className="mb-3">
                <h1 className="text-2xl font-black tracking-tight text-foreground">Ortometric</h1>
                <p className="mt-1 text-xs text-muted-foreground">Gestao clinica de pacientes</p>
            </div>

            <div className="grid gap-3">
                <InputField
                    id="dashboard-patient-search"
                    label="Buscar pacientes"
                    value={query}
                    onChange={onQueryChange}
                    required={false}
                    placeholder="Buscar por nome, ID ou status"
                    containerClassName="grid gap-1"
                    labelClassName="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    inputClassName="clinical-input !bg-input/80"
                />

                <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar pacientes por status">
                    {(['Todos', 'Ativo', 'Em acompanhamento', 'Sem medicao recente'] as const).map((status) => (
                        <button
                            key={status}
                            type="button"
                            className={statusFilter === status
                                ? 'rounded-full border border-primary/40 bg-primary/20 px-3 py-1 text-xs font-semibold text-primary-foreground'
                                : 'rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary'}
                            onClick={() => onStatusFilterChange(status)}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <button type="button" className="clinical-button clinical-button-primary w-full justify-center">+ Novo paciente</button>
            </div>

            <ul className="mt-4 grid gap-2 overflow-auto pr-1" aria-label="Lista de pacientes">
                {patients.map((patient) => (
                    <li key={patient.id}>
                        <button
                            type="button"
                            className={selectedPatientId === patient.id
                                ? 'w-full rounded-xl border border-primary/50 bg-primary/15 p-3 text-left shadow-md shadow-primary/20 transition'
                                : 'w-full rounded-xl border border-border bg-card/70 p-3 text-left transition hover:border-primary/35 hover:bg-card'}
                            onClick={() => onSelectPatient(patient.id)}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <strong>{patient.name}</strong>
                                <span className={getStatusClass(patient.status)}>{patient.status}</span>
                            </div>
                            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                                <span>{patient.age} anos</span>
                                <span>{patient.id}</span>
                            </div>
                            <small className="mt-2 block text-xs text-muted-foreground">Ultima medicao: {patient.lastMeasurement}</small>
                        </button>
                    </li>
                ))}

                {patients.length === 0 && (
                    <li className="rounded-lg border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
                        Nenhum paciente encontrado com os filtros atuais.
                    </li>
                )}
            </ul>
        </aside>
    )
}
