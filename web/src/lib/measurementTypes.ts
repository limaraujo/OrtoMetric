import api from "./api";

export type MeasurementBaseType = "angulo" | "distancia";

export type MeasurementBaseUnitMeasure = "mm" | "cm" | "dm" | "°";

export type SeverityInterval = {
    id: string;
    label: string;
    min: number;
    max: number;
    color: string;
};

export type MeasurementTypeItem = {
    id: string;
    name: string;
    baseType: MeasurementBaseType;
    unitMeasure: MeasurementBaseUnitMeasure;
    cid: string;
    desc: string;
    createdAt: string;
    severities: SeverityInterval[];
};

type ActiveMeasurementTypeResponse = {
    activeTypeId: string | null;
};

type MeasurementTypeApiItem = {
    id: string;
    name: string;
    baseType: MeasurementBaseType;
    unitMeasure?: MeasurementBaseUnitMeasure;
    unit?: MeasurementBaseUnitMeasure;
    cid?: string;
    desc?: string;
    createdAt?: string;
    severities?: SeverityInterval[];
};

export const defaultMeasurementTypes: MeasurementTypeItem[] = [
    {
        id: "default-cobb-angle",
        name: "Ângulo",
        baseType: "angulo",
        cid: "",
        unitMeasure: "°",
        desc: "Medição padrão para escoliose vertebral.",
        createdAt: "predefinido",
        severities: [],
    },
    {
        id: "default-interpedicular-distance",
        name: "Distância interpedicular",
        baseType: "distancia",
        cid: "",
        unitMeasure: "mm",
        desc: "Distância entre os pedículos vertebrais.",
        createdAt: "predefinido",
        severities: [],
    },
];

export function generateMeasurementTypeId(): string {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `custom-${Date.now()}-${Math.random()}`;
}

function fallbackUnitForBaseType(baseType: MeasurementBaseType): MeasurementBaseUnitMeasure {
    return baseType === "angulo" ? "°" : "mm";
}

function normalizeMeasurementTypeItem(item: MeasurementTypeApiItem): MeasurementTypeItem {
    return {
        id: item.id,
        name: item.name,
        baseType: item.baseType,
        unitMeasure: item.unitMeasure ?? item.unit ?? fallbackUnitForBaseType(item.baseType),
        cid: item.cid ?? "",
        desc: item.desc ?? "",
        createdAt: item.createdAt ?? "predefinido",
        severities: item.severities ?? [],
    };
}

export async function loadAllMeasurementTypes(): Promise<MeasurementTypeItem[]> {
    const { data } = await api.get<MeasurementTypeApiItem[]>("/measurement-types");
    if (!Array.isArray(data)) {
        return [...defaultMeasurementTypes];
    }

    return data.map(normalizeMeasurementTypeItem);
}

export async function saveAllMeasurementTypes(all: MeasurementTypeItem[]): Promise<MeasurementTypeItem[]> {
    const payloadTypes = all.map((item) => ({
        ...item,
        unit: item.unitMeasure,
    }));

    const { data } = await api.put<MeasurementTypeApiItem[]>("/measurement-types/sync", {
        types: payloadTypes,
    });
    if (!Array.isArray(data)) {
        return all;
    }

    return data.map(normalizeMeasurementTypeItem);
}

export function isDefaultMeasurementType(id: string): boolean {
    return defaultMeasurementTypes.some((d) => d.id === id);
}

export async function loadActiveMeasurementTypeId(): Promise<string | null> {
    const { data } = await api.get<ActiveMeasurementTypeResponse>("/measurement-types/active");
    return typeof data?.activeTypeId === "string" ? data.activeTypeId : null;
}

export async function saveActiveMeasurementTypeId(typeId: string | null): Promise<void> {
    await api.put("/measurement-types/active", { activeTypeId: typeId });
}
