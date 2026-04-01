import { X } from "lucide-react";
import type { SeverityRowProps } from "../../types/doctorWorkspace";

export function SeverityRow({ sev, index, onChange, onRemove }: SeverityRowProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={sev.color}
        onChange={(e) => onChange(index, { ...sev, color: e.target.value })}
        className="h-7 w-7 cursor-pointer rounded border border-border bg-transparent p-0"
        title="Cor do intervalo"
      />
      <input
        type="text"
        value={sev.label}
        placeholder="Rótulo (ex.: Leve)"
        onChange={(e) => onChange(index, { ...sev, label: e.target.value })}
        className="clinical-input flex-1"
      />
      <input
        type="number"
        value={sev.min}
        placeholder="Mín"
        step={0.1}
        onChange={(e) => onChange(index, { ...sev, min: parseFloat(e.target.value) || 0 })}
        className="clinical-input w-16 text-center"
      />
      <span className="text-xs text-muted-foreground">–</span>
      <input
        type="number"
        value={sev.max}
        placeholder="Máx"
        step={0.1}
        onChange={(e) => onChange(index, { ...sev, max: parseFloat(e.target.value) || 0 })}
        className="clinical-input w-16 text-center"
      />
      <button
        type="button"
        onClick={() => onRemove(sev.id)}
        className="clinical-button clinical-button-ghost px-2 py-1 text-muted-foreground hover:text-foreground"
        title="Remover intervalo"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
