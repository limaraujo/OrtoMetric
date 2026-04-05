import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { MeasurementTypeListPanelProps } from "../../types/doctorWorkspace";
import { BASE_TYPE_LABELS } from "./constants";

export function MeasurementTypeListPanel({
  types,
  isLoadingTypes,
  isPersistingSelection,
  selectedId,
  onSelect,
  onOpenMeasure,
  onStartEdit,
  onDelete,
}: MeasurementTypeListPanelProps) {
  const handleCardSelect = (typeId: string, isSelected: boolean) => {
    onSelect(isSelected ? null : typeId);
  };

  return (
    <div className="panel-scrollbar rounded-2xl border border-border bg-card/70 p-5 md:p-7 flex-1 min-h-0 overflow-y-auto" aria-busy={isPersistingSelection}>
      <h2 className="mb-4 text-base font-semibold">
        Tipos cadastrados
        <span className="ml-2 text-sm font-normal text-muted-foreground">({types.length})</span>
      </h2>

      {isPersistingSelection && (
        <p className="mb-3 text-xs text-muted-foreground" aria-live="polite">
          Sincronizando tipo ativo...
        </p>
      )}

      {isLoadingTypes && (
        <p className="py-6 text-center text-sm text-muted-foreground">Carregando tipos...</p>
      )}

      {!isLoadingTypes && types.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum tipo cadastrado.</p>
      ) : (
        <div className="space-y-3">
          {types.map((typeItem) => {
            const isSelected = selectedId === typeItem.id;
            const isPredefined = typeItem.createdAt === "predefinido";

            return (
              <div
                key={typeItem.id}
                onClick={() => handleCardSelect(typeItem.id, isSelected)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardSelect(typeItem.id, isSelected);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`Selecionar tipo ${typeItem.name}`}
                className={`cursor-pointer rounded-xl border p-4 transition ${isSelected
                  ? "border-primary/50 bg-primary/10"
                  : "border-border bg-secondary/20 hover:border-primary/30 hover:bg-secondary/40"
                  }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{typeItem.name}</p>
                    {typeItem.desc && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{typeItem.desc}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                    {BASE_TYPE_LABELS[typeItem.baseType]}
                  </span>
                </div>

                {typeItem.severities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {typeItem.severities.map((severity) => (
                      <span
                        key={severity.id}
                        className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: severity.color }}
                      >
                        {severity.label}
                      </span>
                    ))}
                  </div>
                )}

                {isSelected && (
                  <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                    {typeItem.cid && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">CID</span>
                        <span className="font-medium">{typeItem.cid}</span>
                      </div>
                    )}
                    {typeItem.unitMeasure && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Unidade</span>
                        <span className="font-medium">{typeItem.unitMeasure}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Origem</span>
                      <span className="font-medium">{typeItem.createdAt}</span>
                    </div>
                    {typeItem.severities.length > 0 && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Intervalos: </span>
                        {typeItem.severities
                          .map((severity) => `${severity.label}: ${severity.min}–${severity.max} ${typeItem.unitMeasure}`)
                          .join(" · ")}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenMeasure(typeItem.id);
                        }}
                        className="clinical-button clinical-button-primary flex-1 text-xs"
                      >
                        Abrir medição
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartEdit(typeItem.id);
                        }}
                        className="clinical-button clinical-button-ghost px-3"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(typeItem.id);
                        }}
                        className="clinical-button clinical-button-ghost px-3 text-destructive hover:text-red-400"
                        title={isPredefined ? "Restaurar padrão" : "Remover"}
                      >
                        {isPredefined ? (
                          <RotateCcw className="h-3.5 w-3.5" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
