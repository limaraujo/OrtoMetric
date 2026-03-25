import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { AuthForm } from "../components/AuthForm";
import type { AuthMode, LoginResponse } from "../types/auth";

export default function AuthContainer() {
  const [mode, setMode] = useState<AuthMode>("login");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value } as typeof form));
  };

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await api.post("/auth/register", form);
      }

      const { data } = await api.post<LoginResponse>("/auth/login", {
        email: form.email,
        password: form.password,
      });

      sessionStorage.setItem("access_token", data.access_token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      navigate("/");
    } catch {
      setError("Ocorreu um erro. Verifique suas credenciais ou tente novamente mais tarde.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute -top-28 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-5rem] h-[22rem] w-[22rem] rounded-full bg-emerald-300/20 blur-3xl" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
        <AuthForm
          mode={mode}
          form={form}
          error={error}
          isSubmitting={isSubmitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onSwitchMode={setMode}
        />
      </main>
    </div>
  );
}