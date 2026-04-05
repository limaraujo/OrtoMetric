import axios from "axios";

const ACCESS_TOKEN_STORAGE_KEY = "ortometric_access_token";

const apiBaseUrl = import.meta.env.VITE_API_URL;

if (!apiBaseUrl) {
    throw new Error("VITE_API_URL is required");
}

function normalizeLocalApiUrl(rawUrl: string): string {
    if (typeof window === "undefined") return rawUrl;

    const localHosts = new Set(["localhost", "127.0.0.1"]);

    try {
        const parsed = new URL(rawUrl);
        const pageHost = window.location.hostname;

        // Evita mismatch comum em dev: frontend em 127.0.0.1 e API em localhost (ou vice-versa).
        if (localHosts.has(pageHost) && localHosts.has(parsed.hostname) && pageHost !== parsed.hostname) {
            parsed.hostname = pageHost;
            return parsed.toString();
        }

        return rawUrl;
    } catch {
        return rawUrl;
    }
}

const api = axios.create({
    baseURL: normalizeLocalApiUrl(apiBaseUrl),
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export function setAccessToken(token: string | null): void {
    if (typeof window === "undefined") return;

    if (!token) {
        window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
        return;
    }

    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    const token = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    return token && token.trim().length > 0 ? token : null;
}

export function clearAccessToken(): void {
    setAccessToken(null);
}

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
            .then((response) => {
                const maybeAccessToken = response?.data?.accessToken;
                if (typeof maybeAccessToken === "string" && maybeAccessToken.trim().length > 0) {
                    setAccessToken(maybeAccessToken);
                }
                return undefined;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
}

api.interceptors.request.use((config) => {
    const bearerToken = getAccessToken();
    if (bearerToken) {
        config.headers.Authorization = `Bearer ${bearerToken}`;
    }

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
                clearAccessToken();
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    },
);

export default api;