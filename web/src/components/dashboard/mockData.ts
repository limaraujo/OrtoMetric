import type { MeasurementRecord, ParameterState, Patient } from './types'

export const defaultParameters: ParameterState = {
    threshold: 0.75,
    calibration: 1.0,
    mode: 'Padrao',
    autoNormalize: true,
}

export const mockPatients: Patient[] = [
    {
        id: 'ORTO-1001',
        name: 'Helena Costa',
        age: 38,
        gender: 'Feminino',
        status: 'Ativo',
        notes: 'Paciente em fase de correcoes posturais com boa aderencia ao protocolo.',
        lastMeasurement: '2026-03-20',
        metrics: {
            posturalAsymmetry: '2.3 deg',
            mainAngle: '19.1 deg',
            variation: '-1.4 deg',
        },
    },
    {
        id: 'ORTO-1002',
        name: 'Bruno Azevedo',
        age: 29,
        gender: 'Masculino',
        status: 'Em acompanhamento',
        notes: 'Evolucao lenta. Reavaliar parametros de medicao para consistencia.',
        lastMeasurement: '2026-03-18',
        metrics: {
            posturalAsymmetry: '3.8 deg',
            mainAngle: '24.6 deg',
            variation: '+0.3 deg',
        },
    },
    {
        id: 'ORTO-1003',
        name: 'Camila Nunes',
        age: 44,
        gender: 'Feminino',
        status: 'Sem medicao recente',
        notes: 'Agendar nova captura para comparativo trimestral.',
        lastMeasurement: '2026-01-27',
        metrics: {
            posturalAsymmetry: '1.9 deg',
            mainAngle: '17.4 deg',
            variation: '-0.5 deg',
        },
    },
]

export const mockHistory: MeasurementRecord[] = [
    {
        id: 'M-9901',
        date: '2026-03-20',
        type: 'Coluna lombar',
        result: '19.1 deg',
        details: 'Reducao de 1.4 deg em relacao a ultima avaliacao. Melhor alinhamento lateral.',
    },
    {
        id: 'M-9888',
        date: '2026-03-10',
        type: 'Pelvis',
        result: '7.2 mm',
        details: 'Variacao dentro da faixa esperada. Sem assimetrias relevantes.',
    },
    {
        id: 'M-9852',
        date: '2026-02-28',
        type: 'Escapular',
        result: '2.9 deg',
        details: 'Leve elevacao de ombro direito. Recomendada manutencao da rotina terapeutica.',
    },
    {
        id: 'M-9820',
        date: '2026-02-15',
        type: 'Goniometria cervical',
        result: '31.0 deg',
        details: 'Amplitude preservada. Pequena oscilacao sem impacto clinico.',
    },
]
