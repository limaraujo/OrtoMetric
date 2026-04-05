import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import api from "../../../lib/api";
import {
    defaultMeasurementTypes,
    generateMeasurementTypeId,
    isDefaultMeasurementType,
    loadActiveMeasurementTypeId,
    loadAllMeasurementTypes,
    saveActiveMeasurementTypeId,
    saveAllMeasurementTypes,
    type MeasurementTypeItem,
    type SeverityInterval,
} from "../../../lib/measurementTypes";
import { SEVERITY_COLORS } from "../components/doctor-workspace/constants";
import type { DoctorWorkspaceFormState } from "../types/doctorWorkspace";

const emptyForm = (): DoctorWorkspaceFormState => ({
    name: "",
    baseType: "angulo",
    cid: "",
    unitMeasure: "°",
    desc: "",
    severities: [],
});

function generateId(): string {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `custom-${Date.now()}-${Math.random()}`;
}

function humanizeValidationMessage(rawMessage: string): string {
    const message = rawMessage.trim();

    if (message.includes("severity intervals cannot overlap")) {
        return "Os intervalos de gravidade não podem se sobrepor. Ajuste os valores mínimo e máximo.";
    }

    if (message.includes("min must be less than max")) {
        return "Em cada intervalo de gravidade, o valor mínimo deve ser menor que o máximo.";
    }

    if (message.includes("severity id") && message.includes("aparece mais de uma vez")) {
        return "Existem intervalos de gravidade duplicados. Use identificadores únicos para cada intervalo.";
    }

    if (message.includes("baseType inválido")) {
        return "O tipo base informado não é válido para medição.";
    }

    if (message.includes("MeasurementType aparece mais de uma vez")) {
        return "Há tipos de medição duplicados. Revise IDs e nomes para evitar repetição.";
    }

    if (message.includes("String should have at least 1 character")) {
        return "Os nomes dos intervalos devem ter ao menos um caracter"
    }

    return message;
}

function humanizeValidationPath(rawPath: string): string {
    const normalized = rawPath.trim().toLowerCase();

    if (normalized.includes("severities")) {
        return "Intervalos de gravidade";
    }

    if (normalized.includes("name")) {
        return "Nome do tipo";
    }

    if (normalized.includes("basetype")) {
        return "Tipo base";
    }

    if (normalized.includes("cid")) {
        return "CID";
    }

    return "Dados do tipo de medição";
}

function resolveSyncErrorMessage(error: unknown): string {
    if (!isAxiosError(error)) {
        return "Falha ao sincronizar com o servidor. Tente novamente.";
    }

    const fallback = "Falha ao sincronizar com o servidor. Tente novamente.";
    const payload = error.response?.data as { error?: unknown } | undefined;
    const details = payload?.error;

    if (typeof details === "string" && details.trim().length > 0) {
        return humanizeValidationMessage(details);
    }

    if (Array.isArray(details) && details.length > 0) {
        const first = details[0] as { msg?: unknown; loc?: unknown } | undefined;
        const firstMsg = typeof first?.msg === "string" ? first.msg : "";
        const firstLoc = Array.isArray(first?.loc)
            ? first.loc.filter((part): part is string => typeof part === "string").join(" > ")
            : "";

        if (firstMsg && firstLoc) {
            return `${humanizeValidationPath(firstLoc)}: ${humanizeValidationMessage(firstMsg)}`;
        }

        if (firstMsg) {
            return humanizeValidationMessage(firstMsg);
        }
    }

    return fallback;
}

export function useDoctorWorkspace() {
    const navigate = useNavigate();

    const [types, setTypes] = useState<MeasurementTypeItem[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(true);
    const [isPersistingSelection, setIsPersistingSelection] = useState(false);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<DoctorWorkspaceFormState>(emptyForm());
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");

    const formRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const verifyAndLoad = async () => {
            setIsLoadingTypes(true);

            try {
                await api.get("/auth/me");

                const [loaded, activeId] = await Promise.all([
                    loadAllMeasurementTypes(),
                    loadActiveMeasurementTypeId(),
                ]);

                setTypes(loaded);
                setSelectedId(activeId);
            } catch {
                navigate("/login");
            } finally {
                setIsLoadingTypes(false);
            }
        };

        void verifyAndLoad();
    }, [navigate]);

    function resetForm() {
        setForm(emptyForm());
        setEditingId(null);
        setFormError("");
        setFormSuccess("");
    }

    function startEdit(id: string) {
        const item = types.find((typeItem) => typeItem.id === id);
        if (!item) return;

        setEditingId(id);
        setForm({
            name: item.name,
            baseType: item.baseType,
            cid: item.cid,
            unitMeasure: item.unitMeasure,
            desc: item.desc,
            severities: item.severities.map((severity) => ({ ...severity })),
        });
        setFormError("");
        setFormSuccess("");
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function handleSeverityChange(index: number, updated: SeverityInterval) {
        setForm((prev) => {
            const next = [...prev.severities];
            next[index] = updated;
            return { ...prev, severities: next };
        });
    }

    function addSeverity() {
        setForm((prev) => ({
            ...prev,
            severities: [
                ...prev.severities,
                {
                    id: generateId(),
                    label: "",
                    min: 0,
                    max: 0,
                    color: SEVERITY_COLORS[prev.severities.length % SEVERITY_COLORS.length],
                },
            ],
        }));
    }

    function removeSeverity(id: string) {
        setForm((prev) => ({
            ...prev,
            severities: prev.severities.filter((severity) => severity.id !== id),
        }));
    }

    async function handleSelectType(typeId: string | null) {
        const previousSelection = selectedId;
        const nextSelection = selectedId === typeId ? null : typeId;

        setSelectedId(nextSelection);
        setFormError("");
        setIsPersistingSelection(true);

        try {
            await saveActiveMeasurementTypeId(nextSelection);
        } catch {
            setSelectedId(previousSelection);
            setFormError("Falha ao persistir o tipo ativo no servidor. Tente novamente.");
        } finally {
            setIsPersistingSelection(false);
        }
    }

    async function handleSave() {
        setFormError("");
        setFormSuccess("");

        const name = form.name.trim();
        if (name.length < 2) {
            setFormError("Informe um nome com pelo menos 2 caracteres.");
            return;
        }

        const duplicate = types.find(
            (typeItem) =>
                typeItem.name.toLowerCase() === name.toLowerCase() && typeItem.id !== editingId,
        );
        if (duplicate) {
            setFormError("Já existe um tipo com esse nome.");
            return;
        }

        let nextTypes: MeasurementTypeItem[];

        if (editingId) {
            nextTypes = types.map((typeItem) =>
                typeItem.id === editingId
                    ? {
                        ...typeItem,
                        name,
                        baseType: form.baseType,
                        cid: form.cid.trim().toUpperCase(),
                        unitMeasure: form.unitMeasure,
                        desc: form.desc,
                        severities: form.severities,
                    }
                    : typeItem,
            );
        } else {
            const newType: MeasurementTypeItem = {
                id: generateMeasurementTypeId(),
                name,
                baseType: form.baseType,
                cid: form.cid.trim().toUpperCase(),
                unitMeasure: form.unitMeasure,
                desc: form.desc,
                createdAt: new Date().toLocaleDateString("pt-BR"),
                severities: form.severities,
            };
            nextTypes = [...types, newType];
        }

        try {
            const synced = await saveAllMeasurementTypes(nextTypes);
            setTypes(synced);
            resetForm();
            setFormSuccess(
                editingId
                    ? "Tipo de medição atualizado com sucesso."
                    : "Tipo de medição adicionado com sucesso.",
            );
        } catch (error) {
            setFormError(resolveSyncErrorMessage(error));
        }
    }

    async function handleDelete(id: string) {
        let nextTypes: MeasurementTypeItem[];

        const isDefault = isDefaultMeasurementType(id);
        if (isDefault) {
            const original = defaultMeasurementTypes.find((defaultType) => defaultType.id === id);
            if (!original) return;
            nextTypes = types.map((typeItem) => (typeItem.id === id ? original : typeItem));
        } else {
            nextTypes = types.filter((typeItem) => typeItem.id !== id);
        }

        try {
            const synced = await saveAllMeasurementTypes(nextTypes);
            setTypes(synced);
        } catch (error) {
            setFormError(resolveSyncErrorMessage(error));
            return;
        }

        if (!isDefault && selectedId === id) {
            setSelectedId(null);
            try {
                await saveActiveMeasurementTypeId(null);
            } catch {
                setSelectedId(id);
                setFormError("Falha ao atualizar o tipo ativo no servidor. Tente novamente.");
            }
        }
        if (editingId === id) resetForm();
    }

    async function handleLogout() {
        try {
            await api.post("/auth/logout", {});
        } catch {
            // Navega para login mesmo se a sessão já estiver inválida no servidor.
        }
        navigate("/login");
    }

    function goToMeasure(typeId?: string | null) {
        const targetId = typeId ?? selectedId;
        navigate(targetId ? `/measure?type=${encodeURIComponent(targetId)}` : "/measure");
    }

    return {
        formRef,
        types,
        isLoadingTypes,
        isPersistingSelection,
        selectedId,
        editingId,
        form,
        formError,
        formSuccess,
        setForm,
        handleSelectType,
        resetForm,
        startEdit,
        handleSeverityChange,
        addSeverity,
        removeSeverity,
        handleSave,
        handleDelete,
        handleLogout,
        goToMeasure,
    };
}
