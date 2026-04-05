import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { MeasurementTypeItem, SeverityInterval } from '../../../lib/measurementTypes'
import type { DistanceCalibration, Measurement } from '../types/measurement'
import { isCobb, isDistance } from '../types/measurement'

export type PatientIdentification = {
    fullName: string;
    birthDate: string;
    age?: number;
    sex?: "male" | "famale" | "other";
    document?: string;
}

export type Exam = {
    type?: string;
    region?: string;
    motivation?: string;
}

export type DoctorIdentification = {
    fullName?: string;
    CRM?: string;
    specialty?: string;
}

export type MeasurementPdfFieldSelection = {
    include: boolean
    includeValue: boolean
    includeTimestamp: boolean
    includeCid: boolean
    includeDescription: boolean
    includeSeverity: boolean
    includeDetails: boolean
    details: string
}

export type PdfReportOptions = {
    title: string
    author: string
    patient: PatientIdentification
    exam: Exam
    doctor: DoctorIdentification
    includeImage: boolean
    includeSummary: boolean
    includeScale: boolean
    fieldsByMeasurementId: Record<string, MeasurementPdfFieldSelection>
}

type PdfReportInput = {
    imageName: string | null
    imageDataUrl: string | null
    measurements: Measurement[]
    types: MeasurementTypeItem[]
    distanceCalibration: DistanceCalibration | null
    options: PdfReportOptions
}

const DEFAULT_FIELDS: MeasurementPdfFieldSelection = {
    include: true,
    includeValue: true,
    includeTimestamp: true,
    includeCid: true,
    includeDescription: true,
    includeSeverity: true,
    includeDetails: true,
    details: '',
}

function sanitizeFileName(value: string) {
    return value
        .trim()
        .replace(/\.[a-zA-Z0-9]+$/, '')
        .replace(/[^a-zA-Z0-9-_]+/g, '_')
        .replace(/^_+|_+$/g, '')
}

function findSeverity(angle: number, severities: SeverityInterval[]): SeverityInterval | null {
    const matched = severities.find((severity) => angle >= severity.min && angle <= severity.max)
    return matched ?? null
}

function getMeasurementValue(
    measurement: Measurement,
    type: MeasurementTypeItem | null,
    distanceCalibration: DistanceCalibration | null,
) {
    if (isCobb(measurement)) {
        return `${measurement.angle.toFixed(1)} ${type?.unitMeasure ?? '°'}`
    }

    if (isDistance(measurement)) {
        const value = distanceCalibration
            ? measurement.distance / distanceCalibration.pixelsPerUnit
            : measurement.distance
        const unit = distanceCalibration?.unit ?? 'px'
        return `${value.toFixed(1)} ${unit}`
    }

    return '-'
}

function getImageFormat(dataUrl: string) {
    const match = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/)
    const mimeType = (match?.[1] ?? '').toLowerCase()

    if (mimeType === 'jpeg' || mimeType === 'jpg') {
        return 'JPEG'
    }

    return 'PNG'
}

function loadImageDimensions(dataUrl: string) {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
        image.onerror = () => reject(new Error('Nao foi possivel carregar a imagem para o PDF.'))
        image.src = dataUrl
    })
}

export function createDefaultPdfFieldSelection(): MeasurementPdfFieldSelection {
    return { ...DEFAULT_FIELDS }
}

export function syncPdfFieldSelections(
    measurements: Measurement[],
    current: Record<string, MeasurementPdfFieldSelection>,
) {
    const next: Record<string, MeasurementPdfFieldSelection> = {}

    measurements.forEach((measurement) => {
        next[measurement.id] = current[measurement.id]
            ? { ...current[measurement.id] }
            : createDefaultPdfFieldSelection()
    })

    return next
}

export async function generateAndDownloadImagePdfReport({
    imageName,
    imageDataUrl,
    measurements,
    types,
    distanceCalibration,
    options,
}: PdfReportInput) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const typesById = new Map(types.map((type) => [type.id, type]))

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const marginX = 12
    const contentWidth = pageWidth - marginX * 2
    const bottomLimit = pageHeight - 12

    const ensureSpace = (requiredHeight: number, y: number) => {
        if (y + requiredHeight <= bottomLimit) return y
        doc.addPage()
        return 12
    }

    const writeWrapped = (text: string, y: number, fontSize = 10) => {
        doc.setFontSize(fontSize)
        const lines = doc.splitTextToSize(text, contentWidth)
        let cursorY = y

        lines.forEach((line: string) => {
            cursorY = ensureSpace(6, cursorY)
            doc.text(line, marginX, cursorY)
            cursorY += 5
        })

        return cursorY
    }

    let y = 14
    const generatedAt = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    const includedMeasurements = measurements.filter((measurement) => {
        const selection = options.fieldsByMeasurementId[measurement.id] ?? DEFAULT_FIELDS
        return selection.include
    })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    y = ensureSpace(8, y)
    doc.text(options.title.trim() || 'Relatorio de Medicoes', marginX, y)
    y += 8

    doc.setFont('helvetica', 'normal')
    y = writeWrapped(`Data de geracao: ${generatedAt}`, y)
    y = writeWrapped(`Imagem: ${imageName ?? 'Nao informada'}`, y)

    if (options.author.trim()) {
        y = writeWrapped(`Responsavel: ${options.author.trim()}`, y)
    }

    if (options.includeSummary) {
        y += 2
        doc.setFont('helvetica', 'bold')
        y = writeWrapped('Resumo', y, 12)
        doc.setFont('helvetica', 'normal')
        y = writeWrapped(`Total de medicoes no projeto: ${measurements.length}`, y)
        y = writeWrapped(`Medicoes incluídas no PDF: ${includedMeasurements.length}`, y)
    }

    if (options.includeImage && imageDataUrl) {
        y += 2
        doc.setFont('helvetica', 'bold')
        y = writeWrapped('Imagem analisada', y, 12)
        doc.setFont('helvetica', 'normal')

        try {
            const dimensions = await loadImageDimensions(imageDataUrl)
            const maxWidth = contentWidth
            const maxHeight = 85
            const scale = Math.min(maxWidth / dimensions.width, maxHeight / dimensions.height)
            const targetWidth = dimensions.width * scale
            const targetHeight = dimensions.height * scale

            y = ensureSpace(targetHeight + 4, y)
            doc.addImage(
                imageDataUrl,
                getImageFormat(imageDataUrl),
                marginX,
                y,
                targetWidth,
                targetHeight,
                undefined,
                'FAST',
            )
            y += targetHeight + 4
        } catch {
            y = writeWrapped('Imagem indisponivel para renderizacao no PDF.', y)
        }
    }

    y += 2
    doc.setFont('helvetica', 'bold')
    y = writeWrapped('Medicoes', y, 12)
    doc.setFont('helvetica', 'normal')

    if (includedMeasurements.length === 0) {
        y = writeWrapped('Nenhuma medicao selecionada para o PDF.', y)
    }

    includedMeasurements.forEach((measurement, index) => {
        const type = typesById.get(measurement.measurementTypeId) ?? null
        const selection = options.fieldsByMeasurementId[measurement.id] ?? DEFAULT_FIELDS

        y += 1
        y = ensureSpace(8, y)
        doc.setDrawColor(220, 220, 220)
        doc.line(marginX, y, marginX + contentWidth, y)
        y += 4

        doc.setFont('helvetica', 'bold')
        y = writeWrapped(`#${index + 1} ${type?.name ?? 'Medicao'}`, y, 11)
        doc.setFont('helvetica', 'normal')

        if (selection.includeValue) {
            y = writeWrapped(`Valor: ${getMeasurementValue(measurement, type, distanceCalibration)}`, y)
        }

        if (selection.includeTimestamp) {
            const measuredAt = format(measurement.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
            y = writeWrapped(`Data da medicao: ${measuredAt}`, y)
        }

        if (selection.includeCid && type?.cid) {
            y = writeWrapped(`CID: ${type.cid}`, y)
        }

        if (selection.includeDescription && type?.desc) {
            y = writeWrapped(`Descricao: ${type.desc}`, y)
        }

        if (selection.includeSeverity && isCobb(measurement)) {
            const severity = type ? findSeverity(measurement.angle, type.severities) : null
            if (severity) {
                y = writeWrapped(`Classificacao: ${severity.label}`, y)
            }
        }

        if (selection.includeDetails && selection.details.trim()) {
            y = writeWrapped(`Detalhes adicionais: ${selection.details.trim()}`, y)
        }
    })

    if (options.includeScale && distanceCalibration) {
        y += 2
        doc.setFont('helvetica', 'bold')
        y = writeWrapped('Escala ativa', y, 12)
        doc.setFont('helvetica', 'normal')
        y = writeWrapped(`1 ${distanceCalibration.unit} = ${distanceCalibration.pixelsPerUnit.toFixed(3)} px`, y)
    }

    const baseName = sanitizeFileName(imageName ?? '')
    const fallbackName = `relatorio_medicoes_${format(new Date(), 'yyyyMMdd_HHmm')}`
    doc.save(`${baseName || fallbackName}.pdf`)
}