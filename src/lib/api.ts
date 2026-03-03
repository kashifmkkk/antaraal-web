type RuntimeEnv = {
  protocol: string;
  hostname: string;
  port: string;
};

const resolveRuntime = (): RuntimeEnv => {
  const portFromEnv = (import.meta.env.VITE_API_PORT as string | undefined)?.trim();
  const port = portFromEnv && portFromEnv.length > 0 ? portFromEnv : "4000";

  if (typeof window === "undefined") {
    return { protocol: "http:", hostname: "localhost", port };
  }

  const protocol = window.location.protocol === "https:" ? "https:" : "http:";
  const hostname = window.location.hostname || "localhost";

  return { protocol, hostname, port };
};

const buildDefaultBase = ({ protocol, hostname, port }: RuntimeEnv) => {
  return `${protocol}//${hostname}:${port}`;
};

const normalizeBase = (rawBase: string | undefined, runtime: RuntimeEnv) => {
  if (!rawBase) {
    return buildDefaultBase(runtime);
  }

  const cleaned = rawBase.trim();
  if (cleaned.length === 0) {
    return buildDefaultBase(runtime);
  }

  const withoutTrailingSlash = cleaned.replace(/\/$/, "");

  if (/^https?:\/\//i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }

  if (withoutTrailingSlash.startsWith("//")) {
    return `${runtime.protocol}${withoutTrailingSlash}`;
  }

  if (/^:\d+$/.test(withoutTrailingSlash)) {
    return `${runtime.protocol}//${runtime.hostname}${withoutTrailingSlash}`;
  }

  if (/^\d+$/.test(withoutTrailingSlash)) {
    return `${runtime.protocol}//${runtime.hostname}:${withoutTrailingSlash}`;
  }

  if (withoutTrailingSlash.startsWith("/")) {
    return `${runtime.protocol}//${runtime.hostname}:${runtime.port}${withoutTrailingSlash}`;
  }

  if (/^[\w.-]+:\d+$/.test(withoutTrailingSlash)) {
    return `${runtime.protocol}//${withoutTrailingSlash}`;
  }

  try {
    const base = typeof window === "undefined" ? "http://localhost" : `${runtime.protocol}//${runtime.hostname}:${runtime.port}`;
    const normalized = new URL(withoutTrailingSlash, base);
    return `${normalized.protocol}//${normalized.host}${normalized.pathname.replace(/\/$/, "")}`;
  } catch (error) {
    console.warn("Failed to normalize VITE_API_BASE, falling back to default", error);
    return buildDefaultBase(runtime);
  }
};

const runtime = resolveRuntime();
const baseUrl = normalizeBase(import.meta.env.VITE_API_BASE as string | undefined, runtime);

export const apiBase = baseUrl;

export function apiUrl(path: string) {
  if (!path.startsWith("/")) {
    return `${baseUrl}/${path}`;
  }
  return `${baseUrl}${path}`;
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});

  if (!headers.has('Authorization')) {
    // Check for both user token and admin token
    const token = typeof window === 'undefined' ? null : 
      localStorage.getItem('token') || localStorage.getItem('skyway_admin_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Set Content-Type for JSON requests
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(apiUrl(path), { ...init, headers });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(errorText || res.statusText || "Request failed");
  }
  return res.json() as Promise<T>;
}
