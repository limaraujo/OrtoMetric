import type { AuthForm } from "../types/auth";
import InputField from "./ui/InputField";
import { AuthSwitch } from "./ui/AuthSwitch";


export function AuthForm(props: AuthForm) {
  const { mode, form, error, fieldErrors, isSubmitting, onChange, onSubmit, onSwitchMode } = props;

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="w-full rounded-3xl border border-border bg-card/90 p-6 shadow-2xl shadow-primary/20 backdrop-blur">
      <div className="mb-6">
        <h2 className="mb-2 text-3xl font-black tracking-tight text-foreground">
          {mode === "login" ? "Bem-vindo" : "Crie sua conta"}
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {mode === "login"
            ? "Faça login para continuar"
            : "Cadastre-se para começar"}
        </p>
        <AuthSwitch mode={mode} onSwitch={onSwitchMode} />
      </div>

      <div className="space-y-4">
        {mode === "register" && (
          <InputField
            id="username"
            label="Usuário"
            value={form.username}
            onChange={(v) => onChange("username", v)}
            error={fieldErrors.username}
          />
        )}

        <InputField
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => onChange("email", v)}
          error={fieldErrors.email}
        />

        <InputField
          id="password"
          label="Senha"
          type="password"
          value={form.password}
          onChange={(v) => onChange("password", v)}
          error={fieldErrors.password}
        />

        {error && (
          <p className="rounded-lg border border-destructive/35 bg-destructive/15 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <button
          disabled={isSubmitting}
          className="clinical-button clinical-button-primary mt-2 w-full justify-center py-3 text-sm font-black uppercase tracking-wide"
        >
          {isSubmitting ? "Processando..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
      </div>
    </form>
  );
}