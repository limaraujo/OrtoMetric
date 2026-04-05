import { useEffect, useMemo, useState } from 'react';
import { FileDown, Ruler, Settings2 } from 'lucide-react';
import type { DistanceCalibration, Measurement } from '../types/measurement';
import type { MeasurementTypeItem } from '../../../lib/measurementTypes';
import {
  createDefaultPdfFieldSelection,
  exportPdfReport,
  exportTxtReport,
  syncPdfFieldSelections,
  type DoctorIdentification,
  type Exam,
  type MeasurementPdfFieldSelection,
  type PatientIdentification,
} from '../lib/reportApi';
import {
  MeasurementResultsList,
} from './results/MeasurementResultsList';
import { PdfConfigPanel } from './results/PdfConfigPanel';

type ResultsSidebarProps = {
  imageName: string | null;
  imageDataUrl: string | null;
  onRequestAnnotatedImage: () => Promise<string | null>;
  measurements: Measurement[];
  types: MeasurementTypeItem[];
  distanceCalibration: DistanceCalibration | null;
  onDeleteMeasurement: (measurementId: string) => void;
};

export function ResultsSidebar({
  imageName,
  imageDataUrl,
  onRequestAnnotatedImage,
  measurements,
  types,
  distanceCalibration,
  onDeleteMeasurement,
}: ResultsSidebarProps) {
  const typesById = new Map(types.map((t) => [t.id, t]));
  const [isPdfConfigOpen, setIsPdfConfigOpen] = useState(false);
  const [pdfTitle, setPdfTitle] = useState('Relatorio de Medicoes');
  const [pdfAuthor, setPdfAuthor] = useState('');
  const [patient, setPatient] = useState<PatientIdentification>({
    fullName: '',
    birthDate: '',
  });
  const [exam, setExam] = useState<Exam>({});
  const [doctor, setDoctor] = useState<DoctorIdentification>({});
  const [includeImage, setIncludeImage] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeScale, setIncludeScale] = useState(true);
  const [conclusions, setConclusions] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [fieldsByMeasurementId, setFieldsByMeasurementId] =
    useState<Record<string, MeasurementPdfFieldSelection>>({});

  useEffect(() => {
    setFieldsByMeasurementId((current) => syncPdfFieldSelections(measurements, current));
  }, [measurements]);

  const selectedForPdfCount = useMemo(
    () => measurements.filter((measurement) => (fieldsByMeasurementId[measurement.id]?.include ?? true)).length,
    [fieldsByMeasurementId, measurements],
  );

  const updateMeasurementPdfSelection = (
    measurementId: string,
    patch: Partial<MeasurementPdfFieldSelection>,
  ) => {
    setFieldsByMeasurementId((current) => ({
      ...current,
      [measurementId]: {
        ...(current[measurementId] ?? createDefaultPdfFieldSelection()),
        ...patch,
      },
    }));
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);

    try {
      const annotatedImageDataUrl = includeImage ? await onRequestAnnotatedImage() : null;

      await exportPdfReport({
        imageName,
        imageDataUrl: annotatedImageDataUrl ?? imageDataUrl,
        measurements,
        types,
        distanceCalibration,
        options: {
          title: pdfTitle,
          author: pdfAuthor,
          patient,
          exam,
          doctor,
          conclusions,
          includeImage,
          includeSummary,
          includeScale,
          fieldsByMeasurementId,
        },
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="w-72 shrink-0 flex flex-col min-h-0">
      <div className="clinical-card flex flex-col flex-1 min-h-0 space-y-4">
        <div className="flex items-center gap-2">
          <Ruler className='w-5 h-5 text-primary' />
          <h2 className="text-lg font-semibold text-foreground">Resultados</h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              void exportTxtReport({
                imageName,
                measurements,
                types,
                distanceCalibration,
              });
            }}
            className="clinical-button clinical-button-ghost w-full justify-center px-2"
          >
            <FileDown className="h-4 w-4" />
            TXT
          </button>

          <button
            type="button"
            onClick={() => setIsPdfConfigOpen((current) => !current)}
            className="clinical-button clinical-button-ghost w-full justify-center px-2"
          >
            <Settings2 className="h-4 w-4" />
            PDF
          </button>
        </div>

        {isPdfConfigOpen && (
          <PdfConfigPanel
            pdfTitle={pdfTitle}
            onPdfTitleChange={setPdfTitle}
            pdfAuthor={pdfAuthor}
            onPdfAuthorChange={setPdfAuthor}
            patient={patient}
            onPatientChange={setPatient}
            exam={exam}
            onExamChange={setExam}
            doctor={doctor}
            onDoctorChange={setDoctor}
            conclusions={conclusions}
            onConclusionsChange={setConclusions}
            includeImage={includeImage}
            onIncludeImageChange={setIncludeImage}
            includeSummary={includeSummary}
            onIncludeSummaryChange={setIncludeSummary}
            includeScale={includeScale}
            onIncludeScaleChange={setIncludeScale}
            measurements={measurements}
            typesById={typesById}
            fieldsByMeasurementId={fieldsByMeasurementId}
            onUpdateMeasurementPdfSelection={updateMeasurementPdfSelection}
            selectedForPdfCount={selectedForPdfCount}
            isExportingPdf={isExportingPdf}
            onExportPdf={() => {
              void handleExportPdf();
            }}
          />
        )}

        <MeasurementResultsList
          measurements={measurements}
          typesById={typesById}
          distanceCalibration={distanceCalibration}
          onDeleteMeasurement={onDeleteMeasurement}
        />

        {measurements.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma medição registrada.</p>
        )}
      </div>
    </div>
  );
}