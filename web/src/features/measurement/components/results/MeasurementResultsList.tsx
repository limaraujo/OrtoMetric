import { Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MeasurementTypeItem, SeverityInterval } from '../../../../lib/measurementTypes';
import type { DistanceCalibration, Measurement } from '../../types/measurement';
import { isCobb, isDistance } from '../../types/measurement';

type MeasurementResultsListProps = {
  measurements: Measurement[];
  typesById: Map<string, MeasurementTypeItem>;
  distanceCalibration: DistanceCalibration | null;
  onDeleteMeasurement: (measurementId: string) => void;
};

function findSeverity(angle: number, severities: SeverityInterval[]): SeverityInterval | null {
  const matched = severities.find((s) => angle >= s.min && angle <= s.max);
  return matched ?? null;
}

export function MeasurementResultsList({
  measurements,
  typesById,
  distanceCalibration,
  onDeleteMeasurement,
}: MeasurementResultsListProps) {
  return (
    <div className="flex-1 space-y-3 overflow-y-auto pr-1 min-h-0">
      {measurements.map((m, index) => {
        const measurementType = typesById.get(m.measurementTypeId) ?? null;

        if (isCobb(m)) {
          const severity = measurementType ? findSeverity(m.angle, measurementType.severities) : null;

          return (
            <div
              key={m.id}
              className="rounded-lg border border-border bg-secondary/40 p-3 transition hover:border-primary/35"
            >
              <span className="text-sm font-medium">
                {measurementType?.name ?? 'Angulo de Cobb'} #{index + 1}:
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-primary">{m.angle.toFixed(1)}</span>
                <span className="text-lg text-muted-foreground">{measurementType?.unitMeasure || '°'}</span>
              </div>

              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => onDeleteMeasurement(m.id)}
                  className="clinical-button clinical-button-ghost px-2 py-1 text-muted-foreground hover:text-destructive"
                  title="Excluir medicao"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {severity && (
                <div className="mt-2">
                  <span
                    className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: severity.color }}
                  >
                    {severity.label}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{format(m.timestamp, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}</span>
              </div>
            </div>
          );
        }

        if (isDistance(m)) {
          const displayDistance = distanceCalibration ? m.distance / distanceCalibration.pixelsPerUnit : m.distance;
          const displayUnit = distanceCalibration?.unit ?? 'px';

          return (
            <div
              key={m.id}
              className="rounded-lg border border-border bg-secondary/40 p-3 transition hover:border-primary/35"
            >
              <span className="text-sm font-medium">
                {measurementType?.name ?? 'Distancia'} #{index + 1}:
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-primary">{displayDistance.toFixed(1)}</span>
                <span className="text-lg text-muted-foreground">{displayUnit}</span>
              </div>

              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => onDeleteMeasurement(m.id)}
                  className="clinical-button clinical-button-ghost px-2 py-1 text-muted-foreground hover:text-destructive"
                  title="Excluir medicao"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{format(m.timestamp, "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}</span>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
