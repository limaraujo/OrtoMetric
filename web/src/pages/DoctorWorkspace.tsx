import { useEffect, useState } from "react";
import { ActivitySquare, ListPlus, LogOut, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import api from "../lib/api";

type MenuKey = "measure" | "profile" | "measurementTypes";

type MeasurementBaseType = "angulo" | "distancia";

type MeasurementTypeItem = {
    id: string;
    name: string;
    baseType: MeasurementBaseType;
    createdAt: string;
};

type SessionUser = {
    id: number;
    username: string;
    email: string;
};

const MEASUREMENT_TYPES_STORAGE_KEY = "measurement_types";

const defaultMeasurementTypes: MeasurementTypeItem[] = [
    {
        id: "default-cobb-angle",
        name: "Angulo de Cobb",
        baseType: "angulo",
        createdAt: "predefinido",
    },
    {
        id: "default-interpedicular-distance",
        name: "Distancia interpedicular",
        baseType: "distancia",
        createdAt: "predefinido",
    },
];

const menuItems: Array<{ key: MenuKey; label: string; subtitle: string }> = [
    {
        key: "measure",
        label: "Medição",
        subtitle: "Abrir ambiente de medição",
    },
    {
        key: "profile",
        label: "Dados pessoais",
        subtitle: "Atualizar usuário e email",
    },
    {
        key: "measurementTypes",
        label: "Tipos de medição",
        subtitle: "Tabela e cadastro clínico",
    },
];

const readStoredMeasurementTypes = (): MeasurementTypeItem[] => {
    const raw = localStorage.getItem(MEASUREMENT_TYPES_STORAGE_KEY);
    if (!raw) {
        return defaultMeasurementTypes;
    }

    try {
        const parsed = JSON.parse(raw) as MeasurementTypeItem[];
        if (!Array.isArray(parsed)) {
            return defaultMeasurementTypes;
        }

        const validItems = parsed.filter((item) => {
            if (!item || typeof item !== "object") {
                return false;
            }

            const baseTypeIsValid = item.baseType === "angulo" || item.baseType === "distancia";
            return typeof item.id === "string"
                && typeof item.name === "string"
                && item.name.trim().length > 1
                && typeof item.createdAt === "string"
                && baseTypeIsValid;
        });

        return validItems.length > 0 ? validItems : defaultMeasurementTypes;
    } catch {
        return defaultMeasurementTypes;
    }
};

export default function DoctorWorkspace() {
    const navigate = useNavigate();

    const [activeMenu, setActiveMenu] = useState<MenuKey>("measurementTypes");

    const [profileForm, setProfileForm] = useState({ username: "", email: "" });
    const [profileMessage, setProfileMessage] = useState("");
    const [profileError, setProfileError] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const [measurementTypes, setMeasurementTypes] = useState<MeasurementTypeItem[]>(readStoredMeasurementTypes);
    const [selectedMeasurementType, setSelectedMeasurementType] = useState<MeasurementTypeItem | null>(null);
    const [newMeasurementTypeName, setNewMeasurementTypeName] = useState("");
    const [newMeasurementBaseType, setNewMeasurementBaseType] = useState<MeasurementBaseType>("angulo");
    const [measurementTypeMessage, setMeasurementTypeMessage] = useState("");
    const [measurementTypeError, setMeasurementTypeError] = useState("");

    useEffect(() => {
        const token = sessionStorage.getItem("access_token");
        if (!token) {
            navigate("/login");
            return;
        }

        const sessionUserRaw = sessionStorage.getItem("user");
        if (sessionUserRaw) {
            try {
                const parsed = JSON.parse(sessionUserRaw) as SessionUser;
                setProfileForm({ username: parsed.username ?? "", email: parsed.email ?? "" });
            } catch {
                setProfileForm({ username: "", email: "" });
            }
        }

        const loadProfile = async () => {
            try {
                const { data } = await api.get<SessionUser>("/auth/profile");
                setProfileForm({ username: data.username, email: data.email });
                sessionStorage.setItem(
                    "user",
                    JSON.stringify({ id: data.id, username: data.username, email: data.email }),
                );
            } catch {
                // keep sessionStorage fallback
            }
        };

        void loadProfile();
    }, [navigate]);

    const handleProfileSave = async () => {
        setProfileError("");
        setProfileMessage("");

        const username = profileForm.username.trim();
        const email = profileForm.email.trim();

        if (username.length < 3) {
            setProfileError("O usuário deve ter pelo menos 3 caracteres.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setProfileError("Informe um email válido.");
            return;
        }

        setIsSavingProfile(true);

        try {
            const { data } = await api.put<SessionUser>("/auth/profile", { username, email });

            sessionStorage.setItem(
                "user",
                JSON.stringify({ id: data.id, username: data.username, email: data.email }),
            );

            setProfileForm({ username: data.username, email: data.email });
            setProfileMessage("Dados pessoais atualizados com sucesso.");
        } catch {
            setProfileError("Não foi possível atualizar os dados pessoais.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        navigate("/login");
    };

    const handleAddMeasurementType = () => {
        setMeasurementTypeMessage("");
        setMeasurementTypeError("");

        const normalizedName = newMeasurementTypeName.trim();
        if (normalizedName.length < 3) {
            setMeasurementTypeError("Informe um nome com pelo menos 3 caracteres.");
            return;
        }

        const alreadyExists = measurementTypes.some(
            (item) => item.name.toLowerCase() === normalizedName.toLowerCase(),
        );

        if (alreadyExists) {
            setMeasurementTypeError("Esse tipo de medição já existe na tabela.");
            return;
        }

        const createdType: MeasurementTypeItem = {
            id: typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `custom-${Date.now()}`,
            name: normalizedName,
            baseType: newMeasurementBaseType,
            createdAt: new Date().toLocaleDateString("pt-BR"),
        };

        const nextTypes = [...measurementTypes, createdType];
        setMeasurementTypes(nextTypes);
        setSelectedMeasurementType(createdType);
        localStorage.setItem(MEASUREMENT_TYPES_STORAGE_KEY, JSON.stringify(nextTypes));

        setNewMeasurementTypeName("");
        setNewMeasurementBaseType("angulo");
        setMeasurementTypeMessage("Tipo de medição adicionado com sucesso.");
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <main className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-4 p-4 md:flex-row md:gap-6">
                <aside className="w-full shrink-0 rounded-2xl border border-border bg-card/75 p-3 md:w-72">
                    <div className="mb-4 flex items-center justify-between px-2">
                        <p className="text-sm font-semibold text-foreground">Painel do médico</p>
                        <button
                            onClick={handleLogout}
                            className="clinical-button clinical-button-ghost px-2 py-1 text-xs"
                            type="button"
                        >
                            <LogOut className="h-4 w-4" />
                            Sair
                        </button>
                    </div>

                    <nav className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1">
                        {menuItems.map((item) => {
                            const isActive = activeMenu === item.key;
                            return (
                                <button
                                    key={item.key}
                                    onClick={() => setActiveMenu(item.key)}
                                    type="button"
                                    className={`rounded-xl border px-3 py-3 text-left transition ${isActive
                                        ? "border-primary/50 bg-primary/20"
                                        : "border-border bg-secondary/30 hover:border-primary/30 hover:bg-secondary/50"
                                        }`}
                                >
                                    <p className="text-sm font-semibold">{item.label}</p>
                                    <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                <section className="min-h-[70vh] flex-1 rounded-2xl border border-border bg-card/70 p-5 md:p-7">
                    {activeMenu === "measure" && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <ActivitySquare className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-bold">Página de medição</h2>
                            </div>

                            <p className="max-w-2xl text-sm text-muted-foreground">
                                Use a área de medição para carregar a radiografia, marcar os pontos e gerar os ângulos de Cobb.
                            </p>

                            <button
                                onClick={() => navigate("/measure")}
                                type="button"
                                className="clinical-button clinical-button-primary"
                            >
                                Ir para medição
                            </button>
                        </div>
                    )}

                    {activeMenu === "profile" && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <UserRound className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-bold">Dados pessoais</h2>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Atualize seus dados de acesso para manter o cadastro do médico sempre correto.
                            </p>

                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2">
                                    <span className="text-sm font-medium">Usuário</span>
                                    <input
                                        type="text"
                                        value={profileForm.username}
                                        onChange={(e) => setProfileForm((prev) => ({ ...prev, username: e.target.value }))}
                                        className="clinical-input"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-sm font-medium">Email</span>
                                    <input
                                        type="email"
                                        value={profileForm.email}
                                        onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                                        className="clinical-input"
                                    />
                                </label>
                            </div>

                            {profileError && (
                                <p className="rounded-lg border border-destructive/35 bg-destructive/15 px-3 py-2 text-sm text-red-200">
                                    {profileError}
                                </p>
                            )}

                            {profileMessage && (
                                <p className="rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 text-sm">
                                    {profileMessage}
                                </p>
                            )}

                            <button
                                onClick={handleProfileSave}
                                type="button"
                                disabled={isSavingProfile}
                                className="clinical-button clinical-button-primary"
                            >
                                {isSavingProfile ? "Salvando..." : "Salvar dados pessoais"}
                            </button>
                        </div>
                    )}

                    {activeMenu === "measurementTypes" && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <ListPlus className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-bold">Tipos de medição</h2>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Visualize os tipos predefinidos e cadastre novos tipos usando um tipo base clínico.
                            </p>

                            <div className="overflow-x-auto rounded-xl border border-border bg-secondary/20">
                                <table className="w-full min-w-[540px] border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-secondary/35 text-left">
                                            <th className="px-4 py-3 font-semibold">Tipo de medição</th>
                                            <th className="px-4 py-3 font-semibold">Tipo base</th>
                                            <th className="px-4 py-3 font-semibold">Origem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {measurementTypes.map((item) => (
                                            <tr
                                                key={item.id}
                                                onClick={() => setSelectedMeasurementType(item)}
                                                className={`cursor-pointer border-b border-border/50 last:border-0 ${selectedMeasurementType?.id === item.id
                                                        ? "bg-primary/15"
                                                        : "hover:bg-secondary/45"
                                                    }`}
                                            >
                                                <td className="px-4 py-3">{item.name}</td>
                                                <td className="px-4 py-3 capitalize">{item.baseType}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{item.createdAt}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {selectedMeasurementType && (
                                <div className="space-y-3 rounded-xl border border-primary/35 bg-primary/10 p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base font-semibold">Painel do tipo selecionado</h3>
                                        <span className="rounded-full border border-primary/45 px-2 py-1 text-xs capitalize">
                                            {selectedMeasurementType.baseType}
                                        </span>
                                    </div>
                                    <p className="text-sm">
                                        <strong>Nome:</strong> {selectedMeasurementType.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Origem:</strong> {selectedMeasurementType.createdAt}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/measure")}
                                        className="clinical-button clinical-button-primary"
                                    >
                                        Abrir medição para este tipo
                                    </button>
                                </div>
                            )}

                            <div className="space-y-4 rounded-xl border border-border bg-secondary/25 p-4">
                                <h3 className="text-base font-semibold">Novo tipo de medição</h3>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="space-y-2">
                                        <span className="text-sm font-medium">Nome do tipo</span>
                                        <input
                                            type="text"
                                            value={newMeasurementTypeName}
                                            onChange={(e) => setNewMeasurementTypeName(e.target.value)}
                                            placeholder="Ex.: Angulo toracolombar"
                                            className="clinical-input"
                                        />
                                    </label>

                                    <label className="space-y-2">
                                        <span className="text-sm font-medium">Tipo base</span>
                                        <select
                                            value={newMeasurementBaseType}
                                            onChange={(e) => setNewMeasurementBaseType(e.target.value as MeasurementBaseType)}
                                            className="clinical-input"
                                        >
                                            <option value="angulo">Angulo</option>
                                            <option value="distancia">Distancia</option>
                                        </select>
                                    </label>
                                </div>

                                {measurementTypeError && (
                                    <p className="rounded-lg border border-destructive/35 bg-destructive/15 px-3 py-2 text-sm text-red-200">
                                        {measurementTypeError}
                                    </p>
                                )}

                                {measurementTypeMessage && (
                                    <p className="rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 text-sm">
                                        {measurementTypeMessage}
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={handleAddMeasurementType}
                                    className="clinical-button clinical-button-primary"
                                >
                                    Adicionar tipo de medição
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
