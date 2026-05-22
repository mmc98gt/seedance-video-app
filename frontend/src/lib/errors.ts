import type { ApiErrorPayload } from "@/types/api.types";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export function readApiError(payload: ApiErrorPayload | unknown): string {
  if (payload && typeof payload === "object") {
    const candidate = payload as ApiErrorPayload;
    if (typeof candidate.detail === "string") return candidate.detail;
    if (Array.isArray(candidate.detail)) {
      return candidate.detail.map((item) => item.msg ?? JSON.stringify(item)).join("; ");
    }
    if (candidate.error) return candidate.error;
    if (candidate.message) return candidate.message;
  }
  return "Error inesperado.";
}

export function toUserMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 0) return "No se pudo conectar con el servidor.";
    return error.message || "La generación ha fallado. Inténtalo de nuevo.";
  }
  if (error instanceof Error) return error.message;
  return "La generación ha fallado. Inténtalo de nuevo.";
}
