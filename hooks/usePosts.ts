import { useCallback, useEffect, useState } from "react";
import { getPosts } from "@/utils/api";

export interface AnalyzedPost {
  id: number;
  post_id: string;
  author_id: string;
  text: string;
  label: "safe" | "harmful" | "unknown" | string;
  lang?: string;
  post_created_at?: string;
}

export function usePosts() {
  const [items, setItems] = useState<AnalyzedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getPosts({ limit: 10, offset: 0 });
      // Support both {items: []} and a plain array just in case
      const list = Array.isArray((res as any)?.items)
        ? ((res as any).items as AnalyzedPost[])
        : (res as unknown as AnalyzedPost[]);
      setItems(list || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // initial load, safe to ignore
    void refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}


