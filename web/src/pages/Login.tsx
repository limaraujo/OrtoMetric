
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

type LoginResponse = {
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
};

type AuthMode = "login" | "register";

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await api.post("/auth/register", {
          username,
          email,
          password,
        });
      }

      const { data } = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      sessionStorage.setItem("access_token", data.access_token);
      sessionStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch {
      if (mode === "register") {
        setError("Nao foi possivel cadastrar. Verifique os dados e tente novamente.");
      } else {
        setError("Nao foi possivel fazer login. Verifique suas credenciais.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
  };

  const submitLabel = isSubmitting
    ? "Processando..."
    : mode === "login"
      ? "Entrar"
      : "Criar conta";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute -top-28 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-5rem] h-[22rem] w-[22rem] rounded-full bg-emerald-300/20 blur-3xl" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8 sm:px-8">
        <section className="w-full rounded-3xl border border-white/20 bg-slate-900/70 p-4 shadow-2xl shadow-cyan-950/40 backdrop-blur md:p-6 lg:p-8">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 sm:p-8">
            <div className="mb-7">
              <div className="mb-4 inline-flex rounded-xl border border-white/15 bg-white/5 p-1 text-sm">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={`rounded-lg px-4 py-2 font-semibold transition ${mode === "login"
                    ? "bg-cyan-400 text-slate-900"
                    : "text-slate-300 hover:bg-white/10"
                    }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className={`rounded-lg px-4 py-2 font-semibold transition ${mode === "register"
                    ? "bg-cyan-400 text-slate-900"
                    : "text-slate-300 hover:bg-white/10"
                    }`}
                >
                  Cadastro
                </button>
              </div>

              <h2 className="text-3xl font-black tracking-tight text-white">
                {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {mode === "login"
                  ? "Acesse para continuar suas medicoes."
                  : "Cadastre-se e comece a usar a plataforma agora."}
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === "register" && (
                <div>
                  <label htmlFor="username" className="mb-1 block text-sm font-semibold text-slate-200">
                    Usuario
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                    className="block w-full rounded-xl border border-white/20 bg-white/5 px-3 py-3 text-slate-100 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                    placeholder="Digite seu usuario"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-200">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="block w-full rounded-xl border border-white/20 bg-white/5 px-3 py-3 text-slate-100 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                  placeholder="Digite seu email"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-200">
                  Senha
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="block w-full rounded-xl border border-white/20 bg-white/5 px-3 py-3 text-slate-100 placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
                  placeholder="Digite sua senha"
                />
              </div>

              {error && (
                <p className="rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-emerald-300 px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-900 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitLabel}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}