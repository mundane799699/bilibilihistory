"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { HistoryFilters } from "@/components/HistoryFilters";
import { HistoryItem } from "@/components/HistoryItem";
import { HistoryPagination } from "@/components/HistoryPagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { HistoryItem as HistoryItemType } from "@/utils/types";

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

interface DateRangeValue {
  fromDate?: string;
  toDate?: string;
}

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 20;

function parsePositiveInteger(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return undefined;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : undefined;
}

function parseLocalDate(value?: string | null) {
  if (!value) return undefined;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date;
}

function getDateRange(
  rawFromDate: string | null,
  rawToDate: string | null
): DateRangeValue {
  const parsedFrom = parseLocalDate(rawFromDate);
  const parsedTo = parseLocalDate(rawToDate);

  if (!parsedFrom && !parsedTo) return {};

  const fromDate = parsedFrom ? rawFromDate! : rawToDate!;
  const toDate = parsedTo ? rawToDate! : fromDate;

  if (fromDate > toDate) return {};
  return { fromDate, toDate };
}

function toUnixDateBounds(fromDate?: string, toDate?: string) {
  const startDate = parseLocalDate(fromDate);
  if (!startDate) return {};

  const endDate = parseLocalDate(toDate) ?? startDate;
  const exclusiveEndDate = new Date(endDate);
  exclusiveEndDate.setDate(exclusiveEndDate.getDate() + 1);

  return {
    startAt: Math.floor(startDate.getTime() / 1000),
    endAt: Math.floor(exclusiveEndDate.getTime() / 1000),
  };
}

function buildDashboardUrl(params: URLSearchParams) {
  const query = params.toString();
  return query ? `/dashboard?${query}` : "/dashboard";
}

function HistoryGridSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          className="overflow-hidden rounded-lg border border-gray-200 bg-white"
          key={index}
        >
          <Skeleton className="h-40 w-full rounded-none" />
          <div className="space-y-3 p-3">
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const resultsTopRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  const rawPage = searchParams.get("page");
  const rawPageSize = searchParams.get("pageSize");
  const parsedPage = parsePositiveInteger(rawPage);
  const parsedPageSize = parsePositiveInteger(rawPageSize);
  const currentPage = parsedPage ?? 1;
  const pageSize = PAGE_SIZE_OPTIONS.includes(
    parsedPageSize as (typeof PAGE_SIZE_OPTIONS)[number]
  )
    ? parsedPageSize!
    : DEFAULT_PAGE_SIZE;
  const urlKeyword = (searchParams.get("q") ?? "").trim().slice(0, 100);
  const { fromDate, toDate } = useMemo(
    () => getDateRange(searchParams.get("from"), searchParams.get("to")),
    [searchParamsString]
  );

  const [keywordInput, setKeywordInput] = useState(urlKeyword);
  const [fromDateInput, setFromDateInput] = useState(fromDate);
  const [toDateInput, setToDateInput] = useState(toDate);
  const [history, setHistory] = useState<HistoryItemType[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: currentPage,
    pageSize,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const navigate = useCallback(
    (params: URLSearchParams, mode: "push" | "replace") => {
      const url = buildDashboardUrl(params);
      if (mode === "push") {
        router.push(url, { scroll: false });
      } else {
        router.replace(url, { scroll: false });
      }
    },
    [router]
  );

  const scrollToResults = useCallback(() => {
    window.requestAnimationFrame(() => {
      resultsTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, []);

  useEffect(() => {
    setKeywordInput(urlKeyword);
  }, [urlKeyword]);

  useEffect(() => {
    setFromDateInput(fromDate);
    setToDateInput(toDate);
  }, [fromDate, toDate]);

  // Canonicalize malformed or redundant URL state without adding history entries.
  useEffect(() => {
    const normalized = new URLSearchParams(searchParamsString);

    if (urlKeyword) normalized.set("q", urlKeyword);
    else normalized.delete("q");

    if (currentPage === 1) normalized.delete("page");
    else normalized.set("page", String(currentPage));

    if (pageSize === DEFAULT_PAGE_SIZE) normalized.delete("pageSize");
    else normalized.set("pageSize", String(pageSize));

    if (fromDate && toDate) {
      normalized.set("from", fromDate);
      normalized.set("to", toDate);
    } else {
      normalized.delete("from");
      normalized.delete("to");
    }

    if (normalized.toString() !== searchParamsString) {
      navigate(normalized, "replace");
    }
  }, [
    currentPage,
    fromDate,
    navigate,
    pageSize,
    searchParamsString,
    toDate,
    urlKeyword,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;

    async function fetchHistory() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          pageSize: String(pageSize),
        });

        if (urlKeyword) params.set("keyword", urlKeyword);

        const { startAt, endAt } = toUnixDateBounds(fromDate, toDate);
        if (startAt !== undefined) params.set("startAt", String(startAt));
        if (endAt !== undefined) params.set("endAt", String(endAt));

        const response = await fetch(`/api/history?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as HistoryResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error || `请求失败（${response.status}）`);
        }

        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        if (
          data.pagination.totalPages > 0 &&
          currentPage > data.pagination.totalPages
        ) {
          const correctedParams = new URLSearchParams(searchParamsString);
          const lastPage = data.pagination.totalPages;
          if (lastPage === 1) correctedParams.delete("page");
          else correctedParams.set("page", String(lastPage));
          navigate(correctedParams, "replace");
          return;
        }

        if (data.pagination.totalPages === 0 && currentPage !== 1) {
          const correctedParams = new URLSearchParams(searchParamsString);
          correctedParams.delete("page");
          navigate(correctedParams, "replace");
          return;
        }

        setHistory(data.history);
        setPagination(data.pagination);
      } catch (fetchError) {
        if (controller.signal.aborted) return;

        console.error("获取历史记录失败:", fetchError);
        setError(
          fetchError instanceof Error ? fetchError.message : "加载失败，请重试"
        );
      } finally {
        if (!controller.signal.aborted && requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }

    fetchHistory();
    return () => controller.abort();
  }, [
    currentPage,
    fromDate,
    navigate,
    pageSize,
    retryNonce,
    searchParamsString,
    toDate,
    urlKeyword,
  ]);

  const handleSearch = () => {
    const normalizedKeyword = keywordInput.trim().slice(0, 100);
    const normalizedToDate = fromDateInput
      ? toDateInput ?? fromDateInput
      : undefined;
    if (
      normalizedKeyword === urlKeyword &&
      fromDateInput === fromDate &&
      normalizedToDate === toDate &&
      currentPage === 1
    ) {
      return;
    }

    const params = new URLSearchParams(searchParamsString);
    if (normalizedKeyword) params.set("q", normalizedKeyword);
    else params.delete("q");
    if (fromDateInput) {
      params.set("from", fromDateInput);
      params.set("to", normalizedToDate!);
    } else {
      params.delete("from");
      params.delete("to");
    }
    params.delete("page");
    navigate(params, "replace");
    scrollToResults();
  };

  const handleDateDraftChange = (
    nextFromDate?: string,
    nextToDate?: string
  ) => {
    setFromDateInput(nextFromDate);
    setToDateInput(nextToDate);
  };

  const handlePageChange = (nextPage: number) => {
    if (
      nextPage === currentPage ||
      nextPage < 1 ||
      nextPage > pagination.totalPages
    ) {
      return;
    }

    const params = new URLSearchParams(searchParamsString);
    if (nextPage === 1) params.delete("page");
    else params.set("page", String(nextPage));
    navigate(params, "push");
    scrollToResults();
  };

  const handlePageSizeChange = (nextPageSize: number) => {
    if (
      nextPageSize === pageSize ||
      !PAGE_SIZE_OPTIONS.includes(
        nextPageSize as (typeof PAGE_SIZE_OPTIONS)[number]
      )
    ) {
      return;
    }

    const params = new URLSearchParams(searchParamsString);
    params.delete("page");
    if (nextPageSize === DEFAULT_PAGE_SIZE) params.delete("pageSize");
    else params.set("pageSize", String(nextPageSize));
    navigate(params, "push");
    scrollToResults();
  };

  const handleItemDeleted = (deletedId: HistoryItemType["id"]) => {
    const remainingTotal = Math.max(0, pagination.totalCount - 1);
    const remainingPages = Math.ceil(remainingTotal / pageSize);

    setHistory((items) =>
      items.filter((item) => String(item.id) !== String(deletedId))
    );
    setPagination((current) => ({
      ...current,
      totalCount: remainingTotal,
      totalPages: remainingPages,
    }));

    if (remainingPages > 0 && currentPage > remainingPages) {
      const params = new URLSearchParams(searchParamsString);
      if (remainingPages === 1) params.delete("page");
      else params.set("page", String(remainingPages));
      navigate(params, "replace");
      return;
    }

    if (remainingPages === 0 && currentPage !== 1) {
      const params = new URLSearchParams(searchParamsString);
      params.delete("page");
      navigate(params, "replace");
      return;
    }

    setRetryNonce((value) => value + 1);
  };

  const hasActiveFilters = Boolean(urlKeyword || fromDate || toDate);

  return (
    <div className="scroll-mt-24" ref={resultsTopRef}>
      <div className="mx-auto max-w-[1200px]">
        <HistoryFilters
          fromDate={fromDateInput}
          keyword={keywordInput}
          onDateChange={handleDateDraftChange}
          onKeywordChange={setKeywordInput}
          onSearch={handleSearch}
          toDate={toDateInput}
        />

        <div aria-live="polite" className="mb-4 text-sm text-gray-500">
          {isLoading
            ? "正在加载历史记录…"
            : error
              ? "历史记录加载失败"
              : `找到 ${pagination.totalCount} 条记录`}
        </div>

        {isLoading ? (
          <HistoryGridSkeleton />
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-white px-6 py-12 text-center">
            <p className="mb-4 text-sm text-red-600">{error}</p>
            <Button onClick={() => setRetryNonce((value) => value + 1)}>
              重新加载
            </Button>
          </div>
        ) : history.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
            {history.map((item) => (
              <HistoryItem
                item={item}
                key={item.id}
                onDelete={() => handleItemDeleted(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white px-6 py-16 text-center text-gray-500">
            <p>
              {hasActiveFilters
                ? "没有找到匹配的历史记录"
                : "暂无历史记录"}
            </p>
          </div>
        )}

        {!isLoading && !error && (
          <HistoryPagination
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            page={currentPage}
            pageSize={pageSize}
            totalCount={pagination.totalCount}
            totalPages={pagination.totalPages}
          />
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<HistoryGridSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
