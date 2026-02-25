const BASE_URL = import.meta.env.VITE_API_URL ?? "";

function getToken(): string | null {
  return localStorage.getItem("bmcgen_auth_token");
}

function authHeaders(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export interface ApiError {
  error: string;
  message?: string;
  status: number;
}

async function request<T>(
  path: string,
  opts: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: { ...authHeaders(), ...(opts.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const err: ApiError = {
      error: body.error ?? body.message ?? res.statusText,
      message: body.message,
      status: res.status,
    };
    throw err;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  stream: async (
    path: string,
    body: unknown,
    callbacks: {
      onDelta?: (chunk: string, full: string) => void;
      onCanvasUpdate?: (data: { markdown: string; valid: boolean }) => void;
      onDone?: (full: string) => void;
      onError?: (err: Error) => void;
    },
    signal?: AbortSignal,
  ) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullResponse = "";
    let currentEvent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop()!;

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.substring(7).trim();
        } else if (line.startsWith("data: ") && currentEvent) {
          try {
            const data = JSON.parse(line.substring(6));
            switch (currentEvent) {
              case "delta":
                fullResponse += data.content;
                callbacks.onDelta?.(data.content, fullResponse);
                break;
              case "canvas_update":
                callbacks.onCanvasUpdate?.(data);
                break;
              case "done":
                callbacks.onDone?.(fullResponse);
                break;
              case "error":
                callbacks.onError?.(new Error(data.message));
                break;
            }
          } catch {
            // skip malformed SSE
          }
          currentEvent = "";
        }
      }
    }

    return fullResponse;
  },
};
