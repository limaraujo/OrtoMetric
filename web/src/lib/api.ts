import axios from "axios";

function resolveDefaultApiBaseUrl(): string {
    if (typeof window === "undefined") return "http://localhost:5000";
    return `${window.location.protocol}//${window.location.hostname}:5000`;
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? resolveDefaultApiBaseUrl(),
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

let refreshPromise: Promise<void> | null = null;

function readCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const value = document.cookie
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith(`${name}=`));
    if (!value) return null;
    return decodeURIComponent(value.substring(name.length + 1));
}

function isWriteMethod(method?: string): boolean {
    const normalized = (method ?? "get").toLowerCase();
    return normalized !== "get" && normalized !== "head" && normalized !== "options";
}

function resolveCsrfToken(url?: string): string | null {
    if ((url ?? "").includes("/auth/refresh")) {
        return readCookie("csrf_refresh_token");
    }
    return readCookie("csrf_access_token");
}

async function ensureSingleRefresh(): Promise<void> {
    if (!refreshPromise) {
        refreshPromise = api
            .post("/auth/refresh", {})
            .then(() => undefined)
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
}

api.interceptors.request.use((config) => {
    if (isWriteMethod(config.method)) {
        const csrfToken = resolveCsrfToken(config.url);
        if (csrfToken) {
            config.headers["X-CSRF-TOKEN"] = csrfToken;
        }
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
        const status = error?.response?.status;
        const url = String(originalRequest?.url ?? "");

        if (
            status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !url.includes("/auth/login") &&
            !url.includes("/auth/refresh")
        ) {
            originalRequest._retry = true;
            try {
                await ensureSingleRefresh();
                return api(originalRequest);
            } catch {
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    },
);

export default api;