import api from '../../../lib/api';
import type { MeasurementTypeItem } from '../../../lib/measurementTypes';
import type { DistanceCalibration, Measurement } from '../types/measurement';
export type PatientIdentification = {
    fullName: string;
    birthDate: string;
    age?: number;
    sex?: 'male' | 'female' | 'other';
    document?: string;
};

export type Exam = {
    type?: string;
    region?: string;
    motivation?: string;
    conclusions?: string;
};

export type DoctorIdentification = {
    fullName?: string;
    CRM?: string;
    specialty?: string;
};

export type MeasurementPdfFieldSelection = {
    include: boolean;
    includeValue: boolean;
    includeTimestamp: boolean;
    includeCid: boolean;
    includeDescription: boolean;
    includeSeverity: boolean;
    includeDetails: boolean;
    details: string;
};

export type PdfReportOptions = {
    title: string;
    author: string;
    patient: PatientIdentification;
    exam: Exam;
    doctor: DoctorIdentification;
    conclusions?: string;
    includeImage: boolean;
    includeSummary: boolean;
    includeScale: boolean;
    fieldsByMeasurementId: Record<string, MeasurementPdfFieldSelection>;
};


type ReportBasePayload = {
    imageName: string | null;
    measurements: Measurement[];
    types: MeasurementTypeItem[];
    distanceCalibration: DistanceCalibration | null;
};

type PdfRequestPayload = ReportBasePayload & {
    imageDataUrl: string | null;
    options: PdfReportOptions;
};

function resolveDownloadFileName(contentDisposition: string | undefined, fallbackFileName: string): string {
    if (!contentDisposition) return fallbackFileName;

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
        try {
            return decodeURIComponent(utf8Match[1]);
        } catch {
            return utf8Match[1];
        }
    }

    const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    return basicMatch?.[1] ?? fallbackFileName;
}

function triggerBlobDownload(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

export async function exportTxtReport(payload: ReportBasePayload) {
    const response = await api.post('/reports/txt', payload, {
        responseType: 'blob',
    });

    const fileName = resolveDownloadFileName(
        response.headers['content-disposition'] as string | undefined,
        'relatorio_medicoes.txt',
    );
    triggerBlobDownload(response.data as Blob, fileName);
}

export async function exportPdfReport(payload: PdfRequestPayload) {
    const response = await api.post('/reports/pdf', payload, {
        responseType: 'blob',
    });

    const fileName = resolveDownloadFileName(
        response.headers['content-disposition'] as string | undefined,
        'relatorio_medicoes.pdf',
    );
    triggerBlobDownload(response.data as Blob, fileName);
}

export function createDefaultPdfFieldSelection(): MeasurementPdfFieldSelection {
    return {
        include: true,
        includeValue: true,
        includeTimestamp: true,
        includeCid: true,
        includeDescription: true,
        includeSeverity: true,
        includeDetails: true,
        details: '',
    };
}

export function syncPdfFieldSelections(
    measurements: Measurement[],
    current: Record<string, MeasurementPdfFieldSelection>,
) {
    const next: Record<string, MeasurementPdfFieldSelection> = {};

    measurements.forEach((measurement) => {
        next[measurement.id] = current[measurement.id]
            ? { ...current[measurement.id] }
            : createDefaultPdfFieldSelection();
    });

    return next;
}
