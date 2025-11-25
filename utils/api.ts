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
    let errorMessage = `HTTP ${res.status} ${res.statusText}`;

    // Try to parse JSON error details
    try {
      const errorJson = JSON.parse(text);
      if (errorJson.detail) {
        if (typeof errorJson.detail === "string") {
          errorMessage += ` - ${errorJson.detail}`;
        } else if (errorJson.detail.error === "rate_limited") {
          const resetTime = errorJson.detail.reset_time || errorJson.detail.reset_epoch;
          const resource = errorJson.detail.resource || "API";
          errorMessage = `Rate limit exceeded (${resource}). `;
          if (resetTime) {
            errorMessage += `Reset time: ${resetTime}. `;
          }
          errorMessage += "Please wait 5-10 minutes before trying again.";
        } else {
          errorMessage += ` - ${JSON.stringify(errorJson.detail)}`;
        }
      } else {
        errorMessage += ` - ${text}`;
      }
    } catch {
      // Not JSON, use raw text
      errorMessage += ` - ${text}`;
    }

    throw new Error(errorMessage);
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

export async function runPreview(userId: number = 1): Promise<{
  items?: unknown[];
  harmful_count?: number;
  safe_count?: number;
  unknown_count?: number;
  inserted?: number;
  skipped?: number;
}> {
  // Backend expects POST with user_id query parameter
  // Ensure userId is a valid number
  const validUserId = Number(userId) || 1;
  const params = new URLSearchParams({ user_id: String(validUserId) });
  const url = `/v1/analysis/preview?${params.toString()}`;
  console.log("🔍 Calling preview API:", `${BASE_URL}${url}`, "with user_id:", validUserId);
  try {
    const result = await request<{
      items?: unknown[];
      harmful_count?: number;
      safe_count?: number;
      unknown_count?: number;
      inserted?: number;
      skipped?: number;
    }>(url, {
      method: "POST",
    });
    console.log("✅ Preview API success:", result);
    return result;
  } catch (error) {
    console.error("❌ Preview API error:", error);
    throw error;
  }
}

export async function getTwitterUser(userId: number = 1) {
  const params = new URLSearchParams({ user_id: String(userId) });
  try {
    const response = await request<{
      data?: { id: string; name: string; username: string; profile_image_url?: string };
      rate_limited?: boolean;
      resource?: string;
      reset?: string;
      limit?: string;
      remaining?: string;
    }>(`/v1/x/me?${params.toString()}`);

    console.log("📡 getTwitterUser API response:", JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error("❌ getTwitterUser API error:", error);
    throw error;
  }
}

export async function getPosts(userId: number, params?: Record<string, string | number | undefined>) {
  // user_id is required by the backend
  const allParams = {
    user_id: userId,
    ...params,
  };
  const qs = "?" +
    Object.entries(allParams)
      .filter(([, v]) => v !== undefined && String(v) !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
  return await request<{ items: unknown[] }>(`/v1/analysis/posts${qs}`);
}


