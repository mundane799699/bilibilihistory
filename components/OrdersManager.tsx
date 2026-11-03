"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";

interface OrderRow {
  outTradeNo: string;
  userId: string;
  email: string;
  planId: string;
  amount: string;
  days: number;
  status: string;
  channel: string;
  payNo: string | null;
  createdAt: string;
  paidAt: string | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const PLAN_LABEL: Record<string, string> = {
  month: "月度会员",
  year: "年度会员",
};

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  closed: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  paid: "已支付",
  pending: "待支付",
  closed: "已关闭",
};

function formatTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersManager() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
      });
      if (keyword) params.set("search", keyword);
      if (status) params.set("status", status);
      const res = await fetch(`/api/orders?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "加载失败");
      setRows(data.data ?? []);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [page, keyword, status]);

  useEffect(() => {
    load();
  }, [load]);

  const check = async (outTradeNo: string) => {
    setChecking(outTradeNo);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ out_trade_no: outTradeNo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "核对失败");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "核对失败");
    } finally {
      setChecking(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 筛选 */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-white p-3 shadow-card sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPage(1);
                setKeyword(search.trim());
              }
            }}
            placeholder="订单号或用户邮箱"
            className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-[13.5px] outline-none focus:border-foreground/25"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="h-10 rounded-lg border border-border bg-white px-3 text-[13.5px] outline-none focus:border-foreground/25"
        >
          <option value="">全部状态</option>
          <option value="paid">已支付</option>
          <option value="pending">待支付</option>
          <option value="closed">已关闭</option>
        </select>

        <button
          onClick={() => {
            setPage(1);
            setKeyword(search.trim());
            load();
          }}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Search className="h-3.5 w-3.5" />
          查询
        </button>

        <button
          onClick={() => load()}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-[13.5px] text-muted-foreground transition-colors hover:bg-muted/50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          刷新
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">
          {error}
        </p>
      )}

      {/* 列表 */}
      <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-[13px]">
            <thead className="border-b border-border/60 bg-muted/30 text-[12px] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">订单号</th>
                <th className="px-4 py-3 font-medium">用户</th>
                <th className="px-4 py-3 font-medium">套餐</th>
                <th className="px-4 py-3 font-medium">金额</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">创建时间</th>
                <th className="px-4 py-3 font-medium">支付时间</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center text-muted-foreground"
                  >
                    还没有订单
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.outTradeNo} className="hover:bg-muted/20">
                    <td className="max-w-[220px] truncate px-4 py-3 font-mono text-[12px]">
                      {row.outTradeNo}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3">
                      {row.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {PLAN_LABEL[row.planId] ?? row.planId}
                      <span className="ml-1 text-muted-foreground">
                        {row.days} 天
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">¥{row.amount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11.5px] font-medium ${
                          STATUS_STYLE[row.status] ?? "bg-muted"
                        }`}
                      >
                        {STATUS_LABEL[row.status] ?? row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatTime(row.paidAt)}
                    </td>
                    <td className="px-4 py-3">
                      {row.status === "pending" ? (
                        <button
                          onClick={() => check(row.outTradeNo)}
                          disabled={checking === row.outTradeNo}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[12px] transition-colors hover:bg-muted/60 disabled:opacity-50"
                        >
                          {checking === row.outTradeNo ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          核对
                        </button>
                      ) : (
                        <span className="text-[12px] text-muted-foreground">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="flex flex-col gap-2 border-t border-border/60 px-4 py-3 text-[12.5px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            共 {pagination.totalCount} 条 · 第 {pagination.page}/
            {pagination.totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage || isLoading}
              className="rounded-lg border border-border px-3 py-1.5 transition-colors hover:bg-muted/60 disabled:opacity-40"
            >
              上一页
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNextPage || isLoading}
              className="rounded-lg border border-border px-3 py-1.5 transition-colors hover:bg-muted/60 disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}