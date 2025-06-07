import { useState, useEffect } from "react";
import { BilibiliHistory } from "@/lib/db/schema";

export function useHistory() {
  const [history, setHistory] = useState<BilibiliHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/history");
      if (!response.ok) throw new Error("获取历史记录失败");

      const data = await response.json();
      setHistory(data.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  const addHistory = async (videoData: {
    videoId: string;
    title: string;
    author: string;
    duration?: number;
    watchProgress?: number;
  }) => {
    try {
      const response = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(videoData),
      });

      if (!response.ok) throw new Error("添加历史记录失败");

      // 重新获取历史记录
      await fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "添加失败");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return {
    history,
    loading,
    error,
    fetchHistory,
    addHistory,
  };
}
