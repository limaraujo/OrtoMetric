import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import {
    defaultMeasurementTypes,
    generateMeasurementTypeId,
    isDefaultMeasurementType,
    loadAllMeasurementTypes,
    saveAllMeasurementTypes,
    type MeasurementTypeItem,
    type SeverityInterval,
} from "../lib/measurementTypes";
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

export function useDoctorWorkspace() {
    const navigate = useNavigate();

    const [types, setTypes] = useState<MeasurementTypeItem[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(true);

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
                const loaded = await loadAllMeasurementTypes();
                setTypes(loaded);
            } catch {
                navigate("/login");
            }
            setIsLoadingTypes(false);
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
        } catch {
            setFormError("Falha ao sincronizar com o servidor. Tente novamente.");
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
        } catch {
            setFormError("Falha ao sincronizar com o servidor. Tente novamente.");
            return;
        }

        if (!isDefault && selectedId === id) setSelectedId(null);
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
        selectedId,
        editingId,
        form,
        formError,
        formSuccess,
        setForm,
        setSelectedId,
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
