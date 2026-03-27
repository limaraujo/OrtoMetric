import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Header } from '../components/Header'
import api from '../lib/api'

type Patient = {
    id: number
    name: string
    dob: string
    sex: 'M' | 'F' | 'O' | 'P'
    email: string
    phone: string
    address: string
}

type MeasurementType = {
    id: number
    name: string
    unit: string
}

type DiagnosisCode = {
    id: number
    code: string
    system: string
    description: string | null
}

export default function DoctorDashboardPage() {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const [patientQuery, setPatientQuery] = useState('')
    const [patients, setPatients] = useState<Patient[]>([])
    const [patientForm, setPatientForm] = useState({
        name: '',
        dob: '',
        sex: 'M' as Patient['sex'],
        email: '',
        phone: '',
        address: '',
    })

    const [measurementTypes, setMeasurementTypes] = useState<MeasurementType[]>([])
    const [measurementForm, setMeasurementForm] = useState({ name: '', unit: '' })

    const [diagnosisCodes, setDiagnosisCodes] = useState<DiagnosisCode[]>([])
    const [diagnosisForm, setDiagnosisForm] = useState({ code: '', system: '', description: '' })

    const fetchAll = async (query = '') => {
        const [patientsRes, mtRes, dcRes] = await Promise.all([
            api.get<Patient[]>('/registry/patients', { params: query ? { q: query } : undefined }),
            api.get<MeasurementType[]>('/registry/measurement-types'),
            api.get<DiagnosisCode[]>('/registry/diagnosis-codes'),
        ])

        setPatients(patientsRes.data)
        setMeasurementTypes(mtRes.data)
        setDiagnosisCodes(dcRes.data)
    }

    useEffect(() => {
        const bootstrap = async () => {
            const token = sessionStorage.getItem('access_token')
            if (!token) {
                navigate('/login')
                return
            }

            try {
                await api.get('/auth/me')
                await fetchAll()
            } catch {
                sessionStorage.removeItem('access_token')
                sessionStorage.removeItem('user')
                navigate('/login')
            } finally {
                setIsLoading(false)
            }
        }

        void bootstrap()
    }, [navigate])

    const parseApiError = (err: unknown, fallback: string) => {
        if (!isAxiosError(err)) return fallback
        if (typeof err.response?.data?.error === 'string') {
            return err.response.data.error
        }
        return fallback
    }

    const handleSearchPatients = async () => {
        setError('')
        try {
            const { data } = await api.get<Patient[]>('/registry/patients', {
                params: patientQuery.trim() ? { q: patientQuery.trim() } : undefined,
            })
            setPatients(data)
        } catch (err) {
            setError(parseApiError(err, 'Nao foi possivel buscar pacientes.'))
        }
    }

    const handleCreatePatient = async () => {
        setError('')
        try {
            await api.post('/registry/patients', patientForm)
            setPatientForm({ name: '', dob: '', sex: 'M', email: '', phone: '', address: '' })
            await handleSearchPatients()
        } catch (err) {
            setError(parseApiError(err, 'Nao foi possivel cadastrar paciente.'))
        }
    }

    const handleCreateMeasurementType = async () => {
        setError('')
        try {
            await api.post('/registry/measurement-types', measurementForm)
            setMeasurementForm({ name: '', unit: '' })
            const { data } = await api.get<MeasurementType[]>('/registry/measurement-types')
            setMeasurementTypes(data)
        } catch (err) {
            setError(parseApiError(err, 'Nao foi possivel cadastrar measurement type.'))
        }
    }

    const handleCreateDiagnosisCode = async () => {
        setError('')
        try {
            await api.post('/registry/diagnosis-codes', diagnosisForm)
            setDiagnosisForm({ code: '', system: '', description: '' })
            const { data } = await api.get<DiagnosisCode[]>('/registry/diagnosis-codes')
            setDiagnosisCodes(data)
        } catch (err) {
            setError(parseApiError(err, 'Nao foi possivel cadastrar diagnosis code.'))
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Header />
                <main className="mx-auto max-w-screen-2xl px-4 py-8">
                    <p className="text-sm text-muted-foreground">Carregando dados...</p>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="pointer-events-none fixed inset-0 opacity-60 [background:radial-gradient(circle_at_top_left,hsl(var(--primary)/0.28),transparent_40%),radial-gradient(circle_at_bottom_right,hsl(var(--primary)/0.18),transparent_45%)]" />
            <Header />

            <main className="relative mx-auto grid max-w-screen-2xl gap-4 px-4 py-6 lg:grid-cols-3">
                <section className="clinical-card space-y-3">
                    <h2 className="text-xl font-black">Pacientes</h2>
                    <p className="text-sm text-muted-foreground">Buscar e cadastrar pacientes em uma unica area.</p>

                    <div className="flex gap-2">
                        <input
                            className="clinical-input"
                            placeholder="Buscar por nome, email ou telefone"
                            value={patientQuery}
                            onChange={(e) => setPatientQuery(e.target.value)}
                        />
                        <button className="clinical-button clinical-button-secondary" onClick={() => void handleSearchPatients()}>
                            Buscar
                        </button>
                    </div>

                    <div className="grid gap-2">
                        <input className="clinical-input" placeholder="Nome" value={patientForm.name} onChange={(e) => setPatientForm((prev) => ({ ...prev, name: e.target.value }))} />
                        <input className="clinical-input" type="date" value={patientForm.dob} onChange={(e) => setPatientForm((prev) => ({ ...prev, dob: e.target.value }))} />
                        <select className="clinical-input" value={patientForm.sex} onChange={(e) => setPatientForm((prev) => ({ ...prev, sex: e.target.value as Patient['sex'] }))}>
                            <option value="M">Masculino</option>
                            <option value="F">Feminino</option>
                            <option value="O">Outro</option>
                            <option value="P">Prefere nao informar</option>
                        </select>
                        <input className="clinical-input" type="email" placeholder="Email" value={patientForm.email} onChange={(e) => setPatientForm((prev) => ({ ...prev, email: e.target.value }))} />
                        <input className="clinical-input" placeholder="Telefone" value={patientForm.phone} onChange={(e) => setPatientForm((prev) => ({ ...prev, phone: e.target.value }))} />
                        <input className="clinical-input" placeholder="Endereco" value={patientForm.address} onChange={(e) => setPatientForm((prev) => ({ ...prev, address: e.target.value }))} />
                        <button className="clinical-button clinical-button-primary justify-center" onClick={() => void handleCreatePatient()}>
                            Cadastrar paciente
                        </button>
                    </div>

                    <div className="max-h-72 space-y-2 overflow-auto pr-1">
                        {patients.map((patient) => (
                            <article key={patient.id} className="rounded-lg border border-border bg-muted/40 p-2 text-sm">
                                <p className="font-semibold">{patient.name}</p>
                                <p className="text-muted-foreground">{patient.email}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="clinical-card space-y-3">
                    <h2 className="text-xl font-black">Measurement Types</h2>
                    <p className="text-sm text-muted-foreground">Cadastre os tipos de medicao disponiveis no sistema.</p>

                    <div className="grid gap-2">
                        <input className="clinical-input" placeholder="Nome" value={measurementForm.name} onChange={(e) => setMeasurementForm((prev) => ({ ...prev, name: e.target.value }))} />
                        <input className="clinical-input" placeholder="Unidade (ex: mm, grau)" value={measurementForm.unit} onChange={(e) => setMeasurementForm((prev) => ({ ...prev, unit: e.target.value }))} />
                        <button className="clinical-button clinical-button-primary justify-center" onClick={() => void handleCreateMeasurementType()}>
                            Cadastrar measurement type
                        </button>
                    </div>

                    <div className="max-h-72 space-y-2 overflow-auto pr-1">
                        {measurementTypes.map((item) => (
                            <article key={item.id} className="rounded-lg border border-border bg-muted/40 p-2 text-sm">
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-muted-foreground">Unidade: {item.unit}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="clinical-card space-y-3">
                    <h2 className="text-xl font-black">Diagnosis Codes</h2>
                    <p className="text-sm text-muted-foreground">Cadastre os codigos diagnosticos usados nos laudos.</p>

                    <div className="grid gap-2">
                        <input className="clinical-input" placeholder="Codigo" value={diagnosisForm.code} onChange={(e) => setDiagnosisForm((prev) => ({ ...prev, code: e.target.value }))} />
                        <input className="clinical-input" placeholder="Sistema (ex: CID-10)" value={diagnosisForm.system} onChange={(e) => setDiagnosisForm((prev) => ({ ...prev, system: e.target.value }))} />
                        <textarea className="clinical-input min-h-24" placeholder="Descricao" value={diagnosisForm.description} onChange={(e) => setDiagnosisForm((prev) => ({ ...prev, description: e.target.value }))} />
                        <button className="clinical-button clinical-button-primary justify-center" onClick={() => void handleCreateDiagnosisCode()}>
                            Cadastrar diagnosis code
                        </button>
                    </div>

                    <div className="max-h-72 space-y-2 overflow-auto pr-1">
                        {diagnosisCodes.map((item) => (
                            <article key={item.id} className="rounded-lg border border-border bg-muted/40 p-2 text-sm">
                                <p className="font-semibold">{item.code} - {item.system}</p>
                                <p className="text-muted-foreground">{item.description ?? 'Sem descricao'}</p>
                            </article>
                        ))}
                    </div>
                </section>
            </main>

            {error && (
                <div className="mx-auto mb-6 max-w-screen-2xl px-4">
                    <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-200">{error}</p>
                </div>
            )}
        </div>
    )
}
