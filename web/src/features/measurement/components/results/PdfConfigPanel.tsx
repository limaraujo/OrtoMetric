import type { MeasurementTypeItem } from '../../../../lib/measurementTypes';
import type { Measurement } from '../../types/measurement';
import {
  createDefaultPdfFieldSelection,
  type DoctorIdentification,
  type Exam,
  type MeasurementPdfFieldSelection,
  type PatientIdentification,
} from '../../lib/reportApi';

type PdfConfigPanelProps = {
  pdfTitle: string;
  onPdfTitleChange: (value: string) => void;
  pdfAuthor: string;
  onPdfAuthorChange: (value: string) => void;
  patient: PatientIdentification;
  onPatientChange: (next: PatientIdentification) => void;
  exam: Exam;
  onExamChange: (next: Exam) => void;
  doctor: DoctorIdentification;
  onDoctorChange: (next: DoctorIdentification) => void;
  conclusions: string;
  onConclusionsChange: (value: string) => void;
  includeImage: boolean;
  onIncludeImageChange: (value: boolean) => void;
  includeSummary: boolean;
  onIncludeSummaryChange: (value: boolean) => void;
  includeScale: boolean;
  onIncludeScaleChange: (value: boolean) => void;
  measurements: Measurement[];
  typesById: Map<string, MeasurementTypeItem>;
  fieldsByMeasurementId: Record<string, MeasurementPdfFieldSelection>;
  onUpdateMeasurementPdfSelection: (measurementId: string, patch: Partial<MeasurementPdfFieldSelection>) => void;
  selectedForPdfCount: number;
  isExportingPdf: boolean;
  onExportPdf: () => void;
};

export function PdfConfigPanel({
  pdfTitle,
  onPdfTitleChange,
  pdfAuthor,
  onPdfAuthorChange,
  patient,
  onPatientChange,
  exam,
  onExamChange,
  doctor,
  onDoctorChange,
  conclusions,
  onConclusionsChange,
  includeImage,
  onIncludeImageChange,
  includeSummary,
  onIncludeSummaryChange,
  includeScale,
  onIncludeScaleChange,
  measurements,
  typesById,
  fieldsByMeasurementId,
  onUpdateMeasurementPdfSelection,
  selectedForPdfCount,
  isExportingPdf,
  onExportPdf,
}: PdfConfigPanelProps) {
  return (
    <div className="rounded-lg border border-border bg-secondary/25 p-2 space-y-2 overflow-y-auto pr-1 min-h-0">
      <div className="text-xs font-semibold text-foreground">Configurar PDF</div>

      <label className="space-y-1 block">
        <span className="text-[11px] text-muted-foreground">Titulo</span>
        <input
          type="text"
          value={pdfTitle}
          onChange={(e) => onPdfTitleChange(e.target.value)}
          className="clinical-input h-8 py-1 text-xs w-full"
        />
      </label>

      <label className="space-y-1 block">
        <span className="text-[11px] text-muted-foreground">Responsavel</span>
        <input
          type="text"
          value={pdfAuthor}
          onChange={(e) => onPdfAuthorChange(e.target.value)}
          placeholder="Opcional"
          className="clinical-input h-8 py-1 text-xs w-full"
        />
      </label>

      <div className="text-xs font-semibold text-foreground">Informacoes do Paciente</div>

      <label className="space-y-1 block">
        <span className="text-[11px] text-muted-foreground">Nome</span>
        <input
          type="text"
          value={patient.fullName}
          onChange={(e) => onPatientChange({ ...patient, fullName: e.target.value })}
          className="clinical-input h-8 py-1 text-xs w-full"
        />
      </label>

      <label className="space-y-1 block">
        <span className="text-[11px] text-muted-foreground">Data de nascimento</span>
        <input
          type="text"
          value={patient.birthDate}
          onChange={(e) => onPatientChange({ ...patient, birthDate: e.target.value })}
          className="clinical-input h-8 py-1 text-xs w-full"
        />
      </label>

      <label className="space-y-1 block">
        <span className="text-[11px] text-muted-foreground">Sexo</span>
        <select
          className="clinical-input h-8 py-1 text-xs w-full"
          value={patient.sex || ''}
          onChange={(e) =>
            onPatientChange({
              ...patient,
              sex: (e.target.value || undefined) as PatientIdentification['sex'],
            })
          }
        >
          <option value="">Selecione</option>
          <option value="male">Masculino</option>
          <option value="female">Feminino</option>
          <option value="other">Outro</option>
        </select>
      </label>

      <label className="space-y-1 block">
        <span className="text-[11px] text-muted-foreground">Documento</span>
        <input
          type="text"
          value={patient.document || ''}
          onChange={(e) => onPatientChange({ ...patient, document: e.target.value })}
          className="clinical-input h-8 py-1 text-xs w-full"
        />
      </label>

      <div className="text-xs font-semibold text-foreground">Identificacao do exame</div>

      <label className="space-y-1 block">
        <span className="text-[11px] text-muted-foreground">Tipo</span>
        <input
          type="text"
          value={exam.type || ''}
          onChange={(e) => onExamChange({ ...exam, type: e.target.value })}
          className="clinical-input h-8 py-1 text-xs w-full"
        />
      </label>

      <label className="space-y-1 block">
        <span className="text-[11px] text-muted-foreground">Regiao anatomica</span>
        <input
          type="text"
          value={exam.region || ''}
          onChange={(e) => onExamChange({ ...exam, region: e.target.value })}
          className="clinical-input h-8 py-1 text-xs w-full"
        />
      </label>

      <label className="space-y-1 block">
        <span className="text-[11px] text-muted-foreground">Motivacao</span>
        <input
          type="text"
          value={exam.motivation || ''}
          onChange={(e) => onExamChange({ ...exam, motivation: e.target.value })}
          className="clinical-input h-8 py-1 text-xs w-full"
        />
      </label>

      <label className="space-y-1 block">
        <span className="text-[11px] text-muted-foreground">Conclusoes</span>
        <textarea
          value={conclusions}
          onChange={(e) => onConclusionsChange(e.target.value)}
          placeholder="Opcional"
          className="clinical-input py-1 text-xs w-full min-h-20 resize-none"
        />
      </label>

      <div className="text-xs font-semibold text-foreground">Informacoes do responsavel</div>

      <label className="space-y-1 block">
        <span className="text-[11px] text-muted-foreground">Nome</span>
        <input
          type="text"
          value={doctor.fullName || ''}
          onChange={(e) => onDoctorChange({ ...doctor, fullName: e.target.value })}
          className="clinical-input h-8 py-1 text-xs w-full"
        />
      </label>

      <label className="space-y-1 block">
        <span className="text-[11px] text-muted-foreground">CRM</span>
        <input
          type="text"
          value={doctor.CRM || ''}
          onChange={(e) => onDoctorChange({ ...doctor, CRM: e.target.value })}
          className="clinical-input h-8 py-1 text-xs w-full"
        />
      </label>

      <label className="space-y-1 block">
        <span className="text-[11px] text-muted-foreground">Especialidade</span>
        <input
          type="text"
          value={doctor.specialty || ''}
          onChange={(e) => onDoctorChange({ ...doctor, specialty: e.target.value })}
          className="clinical-input h-8 py-1 text-xs w-full"
        />
      </label>

      <div className="grid grid-cols-1 gap-1 text-xs">
        <label className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Incluir imagem</span>
          <input
            type="checkbox"
            checked={includeImage}
            onChange={(e) => onIncludeImageChange(e.target.checked)}
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Incluir resumo</span>
          <input
            type="checkbox"
            checked={includeSummary}
            onChange={(e) => onIncludeSummaryChange(e.target.checked)}
          />
        </label>
        <label className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Incluir escala</span>
          <input
            type="checkbox"
            checked={includeScale}
            onChange={(e) => onIncludeScaleChange(e.target.checked)}
          />
        </label>
      </div>

      <div className="rounded-md border border-border/70 bg-card/70 p-2">
        <div className="mb-2 flex items-center justify-between text-[11px]">
          <span className="font-medium text-foreground">Campos por medicao</span>
          <span className="text-muted-foreground">{selectedForPdfCount}/{measurements.length}</span>
        </div>

        <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
          {measurements.map((measurement, index) => {
            const measurementType = typesById.get(measurement.measurementTypeId) ?? null;
            const fields = fieldsByMeasurementId[measurement.id] ?? createDefaultPdfFieldSelection();

            return (
              <div key={measurement.id} className="rounded border border-border/60 bg-secondary/25 p-2 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-foreground truncate">
                    {measurementType?.name ?? 'Medicao'} #{index + 1}
                  </span>
                  <input
                    type="checkbox"
                    checked={fields.include}
                    onChange={(e) =>
                      onUpdateMeasurementPdfSelection(measurement.id, { include: e.target.checked })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                  <label className="flex items-center justify-between gap-2 text-muted-foreground">
                    Valor
                    <input
                      type="checkbox"
                      checked={fields.includeValue}
                      onChange={(e) =>
                        onUpdateMeasurementPdfSelection(measurement.id, { includeValue: e.target.checked })
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 text-muted-foreground">
                    Data
                    <input
                      type="checkbox"
                      checked={fields.includeTimestamp}
                      onChange={(e) =>
                        onUpdateMeasurementPdfSelection(measurement.id, { includeTimestamp: e.target.checked })
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 text-muted-foreground">
                    CID
                    <input
                      type="checkbox"
                      checked={fields.includeCid}
                      onChange={(e) =>
                        onUpdateMeasurementPdfSelection(measurement.id, { includeCid: e.target.checked })
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 text-muted-foreground">
                    Descricao
                    <input
                      type="checkbox"
                      checked={fields.includeDescription}
                      onChange={(e) =>
                        onUpdateMeasurementPdfSelection(measurement.id, { includeDescription: e.target.checked })
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 text-muted-foreground">
                    Gravidade
                    <input
                      type="checkbox"
                      checked={fields.includeSeverity}
                      onChange={(e) =>
                        onUpdateMeasurementPdfSelection(measurement.id, { includeSeverity: e.target.checked })
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 text-muted-foreground">
                    Detalhes
                    <input
                      type="checkbox"
                      checked={fields.includeDetails}
                      onChange={(e) =>
                        onUpdateMeasurementPdfSelection(measurement.id, { includeDetails: e.target.checked })
                      }
                    />
                  </label>
                </div>

                <textarea
                  value={fields.details}
                  onChange={(e) =>
                    onUpdateMeasurementPdfSelection(measurement.id, { details: e.target.value })
                  }
                  rows={2}
                  placeholder="Detalhes livres desta medicao..."
                  className="clinical-input w-full py-1 text-[11px]"
                />
              </div>
            );
          })}

          {measurements.length === 0 && (
            <p className="text-[11px] text-muted-foreground">Sem medicoes para configurar.</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onExportPdf}
        disabled={isExportingPdf}
        className="clinical-button clinical-button-primary w-full justify-center"
      >
        {isExportingPdf ? 'Gerando PDF...' : 'Exportar PDF'}
      </button>
    </div>
  );
}
