import { BASE_URL } from "@/constants/config";

type HttpMethod = "GET" | "POST";

async function request<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown; headers?: Record<string, string> } = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }
  // Try JSON first; fall back to empty as unknown
  try {
    return (await res.json()) as T;
  } catch {
    return undefined as unknown as T;
  }
}

export function getOAuthStartUrl(userId: string) {
  const params = new URLSearchParams({ user_id: userId });
  return `${BASE_URL}/v1/oauth/x/start?${params.toString()}`;
}

export async function runPreview(): Promise<{ inserted?: number; skipped?: number }> {
  // Backend expects POST; no body required for now
  return await request<{ inserted?: number; skipped?: number }>("/v1/analysis/preview", {
    method: "POST",
  });
}

export async function getPosts(params?: Record<string, string | number | undefined>) {
  const qs = params
    ? "?" +
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  return await request<{ items: unknown[] }>(`/v1/analysis/posts${qs}`);
}


