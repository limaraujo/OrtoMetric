import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import api, { setAccessToken, setCsrfAccessToken, setCsrfRefreshToken } from "../../lib/api";
import { AuthForm } from "./AuthForm";
import type { AuthFormData, AuthMode, LoginResponse } from "./types";

export default function AuthContainer() {
  const [mode, setMode] = useState<AuthMode>("login");

  const [form, setForm] = useState<AuthFormData>({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AuthFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleChange = (field: keyof AuthFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof AuthFormData, string>> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (mode === "register" && form.username.trim().length < 3) {
      nextErrors.username = "Usuario deve ter ao menos 3 caracteres.";
    }

    if (!emailRegex.test(form.email)) {
      nextErrors.email = "Email invalido.";
    }

    if (form.password.length < 8) {
      nextErrors.password = "Senha deve ter ao menos 8 caracteres.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const parseApiError = (err: unknown, isRegisterMode: boolean) => {
    if (!isAxiosError(err)) {
      return "Erro inesperado. Tente novamente.";
    }

    if (!err.response) {
      return "Nao foi possivel conectar ao servidor. Verifique se a API esta online.";
    }

    const status = err.response.status;
    const data = err.response.data as { error?: unknown } | undefined;

    if (status === 401) {
      return "Email ou senha invalidos.";
    }

    if (status === 400) {
      if (Array.isArray(data?.error)) {
        return "Dados invalidos. Revise os campos informados.";
      }
      if (typeof data?.error === "string") {
        return data.error;
      }
      return isRegisterMode
        ? "Nao foi possivel cadastrar com os dados informados."
        : "Nao foi possivel fazer login com os dados informados.";
    }

    if (status >= 500) {
      return "Servidor indisponivel no momento. Tente novamente em instantes.";
    }

    return "Erro na autenticacao. Tente novamente.";
  };

  const handleSubmit = async () => {
    setError("");
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await api.post("/auth/register", form);
      }

      const loginResponse = await api.post<LoginResponse>("/auth/login", {
        email: form.email,
        password: form.password,
      });

      const accessToken = loginResponse.data?.accessToken;
      setAccessToken(typeof accessToken === "string" ? accessToken : null);

      const csrfAccessToken = loginResponse.data?.csrfAccessToken;
      setCsrfAccessToken(typeof csrfAccessToken === "string" ? csrfAccessToken : null);

      const csrfRefreshToken = loginResponse.data?.csrfRefreshToken;
      setCsrfRefreshToken(typeof csrfRefreshToken === "string" ? csrfRefreshToken : null);

      navigate("/dashboard");
    } catch (err) {
      setError(parseApiError(err, mode === "register"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_top,hsl(var(--primary)/0.34),transparent_40%),radial-gradient(circle_at_bottom_right,hsl(var(--primary)/0.22),transparent_35%)]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
        <AuthForm
          mode={mode}
          form={form}
          error={error}
          fieldErrors={fieldErrors}
          isSubmitting={isSubmitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onSwitchMode={setMode}
        />
      </main>
    </div>
  );
}
