import type { AuthMode } from "../../types/auth";

export function AuthSwitch({ mode, onSwitch }: {
    mode: AuthMode;
    onSwitch: (mode: AuthMode) => void;
}) {
    const isLogin = mode === "login";

    return (
        <div className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1 text-sm">
            <button
                type="button"
                onClick={() => onSwitch("login")}
                className={`rounded-lg px-4 py-2 font-semibold transition ${
                    isLogin
                        ? "bg-cyan-400 text-slate-900"
                        : "text-slate-300 hover:bg-white/10"
                }`}
            >
                Entrar
            </button>
            <button
                type="button"
                onClick={() => onSwitch("register")}
                className={`rounded-lg px-4 py-2 font-semibold transition ${
                    !isLogin
                        ? "bg-cyan-400 text-slate-900"
                        : "text-slate-300 hover:bg-white/10"
                }`}
            >
                Cadastro
            </button>
        </div>
    );
}