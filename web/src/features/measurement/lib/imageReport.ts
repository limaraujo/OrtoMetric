import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { MeasurementTypeItem } from '../../../lib/measurementTypes'
import type { DistanceCalibration, Measurement } from '../types/measurement'
import { isCobb, isDistance } from '../types/measurement'

type ImageReportInput = {
    imageName: string | null
    measurements: Measurement[]
    types: MeasurementTypeItem[]
    distanceCalibration: DistanceCalibration | null
    generatedAt?: Date
}

function sanitizeFileName(value: string) {
    return value
        .trim()
        .replace(/\.[a-zA-Z0-9]+$/, '')
        .replace(/[^a-zA-Z0-9-_]+/g, '_')
        .replace(/^_+|_+$/g, '')
}

export function buildImageReport({
    imageName,
    measurements,
    types,
    distanceCalibration,
    generatedAt = new Date(),
}: ImageReportInput) {
    const typesById = new Map(types.map((type) => [type.id, type]))
    const generatedAtText = format(generatedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

    const lines: string[] = [
        'RELATORIO DE MEDICOES - ORTOMETRIC',
        '',
        `Data de geracao: ${generatedAtText}`,
        `Imagem: ${imageName ?? 'Nao informada'}`,
        `Total de medicoes: ${measurements.length}`,
        '',
        'DETALHAMENTO',
        '-----------',
    ]

    if (measurements.length === 0) {
        lines.push('Nenhuma medicao registrada.')
    }

    measurements.forEach((measurement, index) => {
        const type = typesById.get(measurement.measurementTypeId)
        const measuredAtText = format(measurement.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

        lines.push('')
        lines.push(`#${index + 1} - ${type?.name ?? 'Medicao'}`)

        if (isCobb(measurement)) {
            lines.push(`Valor: ${measurement.angle.toFixed(1)} ${type?.unitMeasure ?? '°'}`)
        }

        if (isDistance(measurement)) {
            const value = distanceCalibration
                ? measurement.distance / distanceCalibration.pixelsPerUnit
                : measurement.distance
            const unit = distanceCalibration?.unit ?? 'px'
            lines.push(`Valor: ${value.toFixed(1)} ${unit}`)
        }

        lines.push(`Data da medicao: ${measuredAtText}`)
    })

    if (distanceCalibration) {
        lines.push('')
        lines.push('ESCALA ATIVA')
        lines.push('-----------')
        lines.push(`1 ${distanceCalibration.unit} = ${distanceCalibration.pixelsPerUnit.toFixed(3)} px`)
    }

    return lines.join('\n')
}

export function downloadReport(content: string, imageName: string | null) {
    const safeName = sanitizeFileName(imageName ?? '')
    const fallbackName = `relatorio_medicoes_${format(new Date(), 'yyyyMMdd_HHmm')}`
    const fileName = `${safeName || fallbackName}.txt`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

export function generateAndDownloadImageReport(input: ImageReportInput) {
    const report = buildImageReport(input)
    downloadReport(report, input.imageName)
}