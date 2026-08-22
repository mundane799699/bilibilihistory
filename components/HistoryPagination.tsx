"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HistoryPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

type PageToken = number | "start-ellipsis" | "end-ellipsis";

function buildPageTokens(page: number, totalPages: number): PageToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visiblePages = new Set([1, totalPages]);
  for (let candidate = page - 2; candidate <= page + 2; candidate += 1) {
    if (candidate > 1 && candidate < totalPages) {
      visiblePages.add(candidate);
    }
  }

  const sortedPages = Array.from(visiblePages).sort((a, b) => a - b);
  const tokens: PageToken[] = [];

  sortedPages.forEach((visiblePage, index) => {
    const previousPage = sortedPages[index - 1];
    if (previousPage && visiblePage - previousPage > 1) {
      tokens.push(index === 1 ? "start-ellipsis" : "end-ellipsis");
    }
    tokens.push(visiblePage);
  });

  return tokens;
}

export function HistoryPagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: HistoryPaginationProps) {
  const [jumpValue, setJumpValue] = useState("");
  const [jumpError, setJumpError] = useState("");

  const pageTokens = useMemo(
    () => buildPageTokens(page, totalPages),
    [page, totalPages]
  );

  useEffect(() => {
    setJumpValue("");
    setJumpError("");
  }, [page, totalPages]);

  const submitJump = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!/^\d+$/.test(jumpValue)) {
      setJumpError(`请输入 1–${Math.max(totalPages, 1)} 之间的页码`);
      return;
    }

    const targetPage = Number(jumpValue);
    if (
      !Number.isSafeInteger(targetPage) ||
      targetPage < 1 ||
      targetPage > totalPages
    ) {
      setJumpError(`请输入 1–${Math.max(totalPages, 1)} 之间的页码`);
      return;
    }

    setJumpError("");
    if (targetPage !== page) {
      onPageChange(targetPage);
    }
  };

  return (
    <div className="mt-8 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start">
          <span className="text-sm text-gray-600">共 {totalCount} 条</span>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>每页</span>
            <Select
              onValueChange={(value) => onPageSizeChange(Number(value))}
              value={String(pageSize)}
            >
              <SelectTrigger aria-label="每页条数" className="h-9 w-[78px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>条</span>
          </div>
        </div>

        {totalPages > 1 && (
          <>
            <Pagination className="hidden w-auto md:flex">
              <PaginationContent>
                <PaginationItem>
                  <Button
                    aria-label="上一页"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    size="sm"
                    variant="ghost"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    上一页
                  </Button>
                </PaginationItem>

                {pageTokens.map((token) => (
                  <PaginationItem key={token}>
                    {typeof token === "number" ? (
                      <Button
                        aria-current={token === page ? "page" : undefined}
                        aria-label={`第 ${token} 页`}
                        disabled={token === page}
                        onClick={() => onPageChange(token)}
                        size="icon"
                        variant={token === page ? "outline" : "ghost"}
                      >
                        {token}
                      </Button>
                    ) : (
                      <PaginationEllipsis />
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <Button
                    aria-label="下一页"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    size="sm"
                    variant="ghost"
                  >
                    下一页
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            <div className="flex items-center justify-center gap-3 md:hidden">
              <Button
                aria-label="上一页"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                size="sm"
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[92px] text-center text-sm text-gray-600">
                第 {page}/{totalPages} 页
              </span>
              <Button
                aria-label="下一页"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                size="sm"
                variant="outline"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <form
              className="flex flex-wrap items-center justify-center gap-2 lg:justify-end"
              onSubmit={submitJump}
            >
              <label className="text-sm text-gray-600" htmlFor="history-page-jump">
                前往
              </label>
              <Input
                aria-describedby={jumpError ? "history-page-jump-error" : undefined}
                className="h-9 w-20"
                id="history-page-jump"
                inputMode="numeric"
                onChange={(event) => {
                  setJumpValue(event.target.value);
                  if (jumpError) setJumpError("");
                }}
                pattern="[0-9]*"
                value={jumpValue}
              />
              <span className="text-sm text-gray-600">页</span>
              <Button size="sm" type="submit" variant="outline">
                跳转
              </Button>
              {jumpError && (
                <span
                  className="w-full text-center text-xs text-red-600 lg:text-right"
                  id="history-page-jump-error"
                  role="alert"
                >
                  {jumpError}
                </span>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
