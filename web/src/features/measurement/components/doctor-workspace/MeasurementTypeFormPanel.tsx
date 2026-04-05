import { Info, Plus } from "lucide-react";
import type {
  MeasurementBaseType,
  MeasurementBaseUnitMeasure,
} from "../../../../lib/measurementTypes";
import type { MeasurementTypeFormPanelProps } from "../../types/doctorWorkspace";
import { BASE_TYPE_LABELS } from "./constants";
import { SeverityRow } from "./SeverityRow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "../../../../components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../../components/ui/tooltip";

export function MeasurementTypeFormPanel({
  formRef,
  editingId,
  form,
  formError,
  formSuccess,
  setForm,
  onSeverityChange,
  onAddSeverity,
  onRemoveSeverity,
  onSave,
  onCancel,
}: MeasurementTypeFormPanelProps) {
  const unitOptions: MeasurementBaseUnitMeasure[] =
    form.baseType === "angulo" ? ["°"] : ["mm", "cm", "dm"];

  return (
    <TooltipProvider>
      <div
        ref={formRef}
        className="space-y-5 rounded-2xl border border-border bg-card/70 p-5 md:p-7 flex-1 min-h-0 overflow-y-auto"
      >
        <h2 className="text-base font-semibold">
          {editingId ? "Editando tipo de medição" : "Novo tipo de medição"}
        </h2>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Nome do tipo</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Ex.: Ângulo de Cobb"
            className="clinical-input"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-3">

          <div className="space-y-2">
            <span className="text-sm font-medium">Tipo base</span>
            <ToggleGroup
              type="single"
              value={form.baseType}
              onValueChange={(value: string) => {
                if (!value) return;
                const nextBaseType = value as MeasurementBaseType;

                setForm((prev) => {
                  const nextUnit = nextBaseType === "angulo"
                    ? "°"
                    : prev.unitMeasure === "°"
                      ? "mm"
                      : prev.unitMeasure;

                  return {
                    ...prev,
                    baseType: nextBaseType,
                    unitMeasure: nextUnit,
                  };
                });
              }}
              className="w-full rounded-xl border border-border bg-secondary/20 p-1"
            >
              {(["angulo", "distancia"] as MeasurementBaseType[]).map((baseType) => (
                <ToggleGroupItem key={baseType} value={baseType} className="flex-1">
                  {BASE_TYPE_LABELS[baseType]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <label className="block space-y-2">
            <span className="flex items-center gap-1 text-sm font-medium">
              Unidade de exibição
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground"
                    aria-label="Ajuda sobre unidade"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Distância: mm, cm, dm. Ângulo: apenas °.
                </TooltipContent>
              </Tooltip>
            </span>

            <Select
              value={form.unitMeasure}
              onValueChange={(value: string) =>
                setForm((prev) => ({
                  ...prev,
                  unitMeasure: value as MeasurementBaseUnitMeasure,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {unitOptions.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">CID associado (opcional)</span>
            <input
              type="text"
              value={form.cid}
              onChange={(e) => setForm((prev) => ({ ...prev, cid: e.target.value.toUpperCase() }))}
              placeholder="Ex.: M41.1"
              className="clinical-input"
            />
          </label>

        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Descrição clínica (opcional)</span>
          <textarea
            value={form.desc}
            onChange={(e) => setForm((prev) => ({ ...prev, desc: e.target.value }))}
            placeholder="Notas sobre a indicação clínica deste tipo..."
            rows={2}
            className="clinical-input resize-none"
          />
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Intervalos de gravidade</span>
            {form.severities.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {form.severities.length} intervalo{form.severities.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {form.severities.length > 0 && (
            <div className="space-y-2">
              {form.severities.map((sev, idx) => (
                <SeverityRow
                  key={sev.id}
                  sev={sev}
                  index={idx}
                  onChange={onSeverityChange}
                  onRemove={onRemoveSeverity}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onAddSeverity}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Adicionar intervalo
          </button>
        </div>

        {formError && (
          <p className="rounded-lg border border-destructive/35 bg-destructive/15 px-3 py-2 text-sm text-red-200">
            {formError}
          </p>
        )}
        {formSuccess && (
          <p className="rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 text-sm">
            {formSuccess}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSave}
            className="clinical-button clinical-button-primary flex-1"
          >
            {editingId ? "Salvar alterações" : "Adicionar tipo de medição"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={onCancel}
              className="clinical-button clinical-button-ghost px-4"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
