import { useCallback, useEffect, useState } from "react";
import { getPosts } from "@/utils/api";

export interface AnalyzedPost {
  id: number;
  user_id?: number;
  source?: string; // "x" for Twitter
  post_id: string;
  author_id: string;
  text: string;
  label: "safe" | "harmful" | "unknown" | string;
  score?: number; // Confidence score (0.0 to 1.0)
  lang?: string;
  post_created_at?: string; // When the post was created on Twitter
  created_at?: string; // When the analysis was performed
}

export function usePosts(userId?: number) {
  const [items, setItems] = useState<AnalyzedPost[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setError("User ID is required");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Fetch ALL posts - show everything from backend, ordered by newest first
      const res = await getPosts(userId, { limit: 200, offset: 0 });
      // Support both {items: [], total: 0} and a plain array just in case
      const list = Array.isArray((res as any)?.items)
        ? ((res as any).items as AnalyzedPost[])
        : (res as unknown as AnalyzedPost[]);
      
      // Show ALL posts, sorted by created_at (newest first)
      const allPosts = (list || []).sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // Newest first
      });
      
      setItems(allPosts);
      setTotal((res as any)?.total ?? allPosts.length);
    } catch (e: any) {
      setError(e?.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // initial load, safe to ignore
    void refresh();
  }, [refresh]);

  return { items, total, loading, error, refresh };
}


