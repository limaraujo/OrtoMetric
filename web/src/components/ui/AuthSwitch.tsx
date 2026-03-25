import type { AuthMode } from "../../types/auth";

export function AuthSwitch({ onSwitch }: {
    onSwitch: (mode: AuthMode) => void;
}) {
    const isLogin = sessionStorage.getItem("mode") === "login" || !sessionStorage.getItem("mode");

    return (
        <div className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1 text-sm">
            <button
                type="button"
                onClick={() => {
                    onSwitch("login");
                    sessionStorage.setItem("mode", "login");
                }}
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
                onClick={() => {
                    onSwitch("register");
                    sessionStorage.setItem("mode", "register");
                }}
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