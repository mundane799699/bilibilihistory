"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";

interface PayDialogProps {
  plan: { id: string; name: string; price: string };
  onClose: () => void;
  onPaid: () => void;
}

type Phase = "creating" | "waiting" | "paid" | "error";

interface OrderInfo {
  out_trade_no: string;
  amount: string;
  title: string;
  days: number;
  qr_url: string;
  mock?: boolean;
}

export default function PayDialog({ plan, onClose, onPaid }: PayDialogProps) {
  const [phase, setPhase] = useState<Phase>("creating");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [error, setError] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(900);
  const stopped = useRef(false);
  const started = useRef(false);

  const create = useCallback(async () => {
    setPhase("creating");
    setError("");
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", plan: plan.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "下单失败");
      setOrder(data);
      setPhase("waiting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "下单失败");
      setPhase("error");
    }
  }, [plan.id]);

  useEffect(() => {
    // StrictMode 会把 effect 跑两遍：stopped 必须复位（否则轮询第一帧就被当成已卸载），
    // started 保证只下一次单（否则一次点击会生成两笔订单）
    stopped.current = false;
    if (!started.current) {
      started.current = true;
      create();
    }
    return () => {
      stopped.current = true;
    };
  }, [create]);

  // 轮询订单状态
  useEffect(() => {
    if (phase !== "waiting" || !order) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (stopped.current) return;
      try {
        const res = await fetch("/api/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "check",
            out_trade_no: order.out_trade_no,
          }),
        });
        const data = await res.json();
        if (data?.status === "paid") {
          setExpiresAt(
            data?.membership?.expiresAt
              ? new Date(data.membership.expiresAt)
              : null
          );
          setPhase("paid");
          return;
        }
        if (data?.status === "closed") {
          setError("订单已关闭，请返回重新下单");
          setPhase("error");
          return;
        }
      } catch {
        /* 网络抖动就继续轮询 */
      }
      timer = setTimeout(tick, 3000);
    };
    timer = setTimeout(tick, 1500);
    return () => clearTimeout(timer);
  }, [phase, order]);

  // 倒计时
  useEffect(() => {
    if (phase !== "waiting") return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          setError("二维码已过期，请返回重新下单");
          setPhase("error");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const mmss = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(
    secondsLeft % 60
  ).padStart(2, "0")}`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="微信支付"
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-lift sm:rounded-2xl">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h2 className="text-[16px] font-semibold">微信支付</h2>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              {plan.name} · 扫码后自动开通
            </p>
          </div>
          <button
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted/60"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center">
          {phase === "creating" && (
            <div className="flex h-[240px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {phase === "waiting" && order && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.qr_url}
                alt="微信支付二维码"
                className="h-[240px] w-[240px] rounded-xl border border-border bg-white object-contain"
              />
              <p className="mt-3 text-[13px] text-muted-foreground">
                用微信扫一扫，付款后自动开通
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground/80 tabular-nums">
                二维码 {mmss} 内有效
                {order.mock ? " · 本地模拟支付，3 秒后自动成功" : ""}
              </p>
            </>
          )}

          {phase === "paid" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <p className="mt-4 text-[15px] font-semibold">支付成功</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {expiresAt
                  ? `${plan.name}已开通，有效期至 ${expiresAt.toLocaleDateString("zh-CN")}`
                  : `${plan.name}已开通`}
              </p>
            </>
          )}

          {phase === "error" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <X className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="mt-4 text-center text-[13.5px] text-muted-foreground">
                {error}
              </p>
            </>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          {phase === "paid" ? (
            <button
              onClick={onPaid}
              className="h-11 flex-1 rounded-xl bg-primary text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              完成
            </button>
          ) : (
            <>
              {phase === "error" && (
                <button
                  onClick={create}
                  className="h-11 flex-1 rounded-xl bg-primary text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  重新下单
                </button>
              )}
              <button
                onClick={onClose}
                className="h-11 flex-1 rounded-xl border border-border text-[14px] font-medium transition-colors hover:bg-muted/50"
              >
                取消
              </button>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-[11.5px] leading-relaxed text-muted-foreground">
          付款由蓝兔支付处理，本站不保存任何银行卡信息。
          <br />
          会员到期后可再次购买，时长会从到期日往后叠加。
        </p>
      </div>
    </div>
  );
}