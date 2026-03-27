export type PatientStatus = 'Ativo' | 'Em acompanhamento' | 'Sem medicao recente'

export type Patient = {
    id: string
    name: string
    age: number
    gender: 'Feminino' | 'Masculino'
    status: PatientStatus
    notes: string
    lastMeasurement: string
    metrics: {
        posturalAsymmetry: string
        mainAngle: string
        variation: string
    }
}

export type ParameterState = {
    threshold: number
    calibration: number
    mode: 'Padrao' | 'Alta precisao' | 'Rapida'
    autoNormalize: boolean
}

export type MeasurementRecord = {
    id: string
    date: string
    type: string
    result: string
    details: string
}
