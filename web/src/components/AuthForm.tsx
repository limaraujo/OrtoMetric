import type { AuthForm } from "../types/auth";
import InputField from "./ui/InputField";
import { AuthSwitch } from "./ui/AuthSwitch";


export function AuthForm(props: AuthForm) {
    const { mode, form, error, isSubmitting, onChange, onSubmit, onSwitchMode } = props;

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="w-full rounded-3xl border border-white/20 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/40 backdrop-blur">
            <div className="mb-6">
                <h2 className="text-3xl font-black tracking-tight text-white mb-2">
                    {mode === "login" ? "Bem-vindo" : "Crie sua conta"}
                </h2>
                <p className="text-sm text-slate-300 mb-4">
                    {mode === "login"
                        ? "Faça login para continuar"
                        : "Cadastre-se para começar"}
                </p>
                <AuthSwitch onSwitch={onSwitchMode} />
            </div>

            <div className="space-y-4">
                {mode === "register" && (
                    <InputField
                        label="Usuário"
                        value={form.username}
                        onChange={(v) => onChange("username", v)}
                    />
                )}

                <InputField
                    label="Email"
                    value={form.email}
                    onChange={(v) => onChange("email", v)}
                />

                <InputField
                    label="Senha"
                    type="password"
                    value={form.password}
                    onChange={(v) => onChange("password", v)}
                />

                {error && (
                    <p className="rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
                        {error}
                    </p>
                )}

                <button
                    disabled={isSubmitting}
                    className="mt-2 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-900 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isSubmitting ? "Processando..." : mode === "login" ? "Entrar" : "Criar conta"}
                </button>
            </div>
        </form>
    );
}