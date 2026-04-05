import type { Dispatch, RefObject, SetStateAction } from "react";
import type {
    MeasurementBaseType,
    MeasurementBaseUnitMeasure,
    MeasurementTypeItem,
    SeverityInterval,
} from "../../../lib/measurementTypes";

export type DoctorWorkspaceFormState = {
    name: string;
    baseType: MeasurementBaseType;
    cid: string;
    unitMeasure: MeasurementBaseUnitMeasure;
    desc: string;
    severities: SeverityInterval[];
};

export type MeasurementTypeFormPanelProps = {
    formRef: RefObject<HTMLDivElement | null>;
    editingId: string | null;
    form: DoctorWorkspaceFormState;
    formError: string;
    formSuccess: string;
    setForm: Dispatch<SetStateAction<DoctorWorkspaceFormState>>;
    onSeverityChange: (index: number, updated: SeverityInterval) => void;
    onAddSeverity: () => void;
    onRemoveSeverity: (id: string) => void;
    onSave: () => void;
    onCancel: () => void;
};

export type MeasurementTypeListPanelProps = {
    types: MeasurementTypeItem[];
    isLoadingTypes: boolean;
    isPersistingSelection: boolean;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onOpenMeasure: (typeId: string) => void;
    onStartEdit: (id: string) => void;
    onDelete: (id: string) => void;
};

export type SeverityRowProps = {
    sev: SeverityInterval;
    index: number;
    onChange: (index: number, updated: SeverityInterval) => void;
    onRemove: (id: string) => void;
};