import { ApiClientError, readApiError } from "./errors";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? 30000);
  const isFormData = options.body instanceof FormData;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
      signal: controller.signal,
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new ApiClientError(readApiError(payload), response.status, payload);
    }
    return payload as T;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiClientError("No se pudo conectar con el servidor.", 0);
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
