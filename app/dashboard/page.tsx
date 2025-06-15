"use client";

import { HistoryItem } from "@/components/HistoryItem";
import { useRef, useState } from "react";
import { HistoryItem as HistoryItemType } from "@/utils/types";
import { useDebounce } from "use-debounce";
import { useEffect } from "react";

// 分页相关接口
interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface HistoryResponse {
  history: HistoryItemType[];
  pagination: PaginationInfo;
}

export default function DashboardPage() {
  const [history, setHistory] = useState<HistoryItemType[]>([]);
  const [keyword, setKeyword] = useState("");
  const [authorKeyword, setAuthorKeyword] = useState("");
  const [debouncedKeyword] = useDebounce(keyword, 500);
  const [debouncedAuthorKeyword] = useDebounce(authorKeyword, 500);
  const [date, setDate] = useState("");
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingRef = useRef<boolean>(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(100); // 每页100条记录
  const [totalCount, setTotalCount] = useState(0);

  // 获取历史记录的函数
  const getHistory = async (
    page: number = 1,
    append: boolean = false
  ): Promise<{ items: HistoryItemType[]; hasMore: boolean }> => {
    try {
      const response = await fetch(
        `/api/history?page=${page}&pageSize=${pageSize}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: HistoryResponse = await response.json();

      setTotalCount(data.pagination.totalCount);
      return {
        items: data.history,
        hasMore: data.pagination.hasNextPage,
      };
    } catch (error) {
      console.error("获取历史记录失败:", error);
      throw error;
    }
  };

  // 当debouncedKeyword或debouncedAuthorKeyword变化时重新加载数据
  useEffect(() => {
    setCurrentPage(1);
    loadHistory(false);
  }, [debouncedKeyword, debouncedAuthorKeyword, date]);

  const loadHistory = async (isAppend: boolean = false) => {
    if (isLoadingRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      isLoadingRef.current = true;

      const pageToLoad = isAppend ? currentPage + 1 : 1;
      const { items, hasMore } = await getHistory(pageToLoad, isAppend);

      if (isAppend) {
        setHistory((prev) => [...prev, ...items]);
        setCurrentPage(pageToLoad);
      } else {
        setHistory(items);
        setCurrentPage(1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      setHasMore(hasMore);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  // 加载更多数据
  const loadMore = () => {
    if (hasMore && !isLoading) {
      loadHistory(true);
    }
  };

  // 监听滚动到底部，自动加载更多
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoading]);

  const getLoadMoreText = () => {
    if (history.length === 0) {
      return keyword.trim() ? "没有找到匹配的历史记录" : "暂无历史记录";
    }

    if (isLoading) {
      return "加载中...";
    }

    if (hasMore) {
      return `向下滚动加载更多 (已加载 ${history.length}/${totalCount} 条记录)`;
    }

    return `已加载全部 ${history.length} 条记录`;
  };

  return (
    <div>
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {history.map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              onDelete={() => {
                // 从列表中移除被删除的项
                setHistory((prev) => prev.filter((h) => h.id !== item.id));
                setTotalCount((prev) => prev - 1);
              }}
            />
          ))}
        </div>
        <div ref={loadMoreRef} className="text-center my-8 text-gray-500">
          {getLoadMoreText()}
        </div>
      </div>
    </div>
  );
}
