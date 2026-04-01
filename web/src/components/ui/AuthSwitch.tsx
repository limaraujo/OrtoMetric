import type { AuthMode } from "../../features/auth/types";

export function AuthSwitch({ mode, onSwitch }: {
    mode: AuthMode;
    onSwitch: (mode: AuthMode) => void;
}) {
    const isLogin = mode === "login";

    return (
        <div className="inline-flex rounded-xl border border-border bg-secondary/40 p-1 text-sm">
            <button
                type="button"
                onClick={() => onSwitch("login")}
                className={`rounded-lg px-4 py-2 font-semibold transition ${isLogin
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
            >
                Entrar
            </button>
            <button
                type="button"
                onClick={() => onSwitch("register")}
                className={`rounded-lg px-4 py-2 font-semibold transition ${!isLogin
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
            >
                Cadastro
            </button>
        </div>
    );
}