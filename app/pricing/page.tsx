"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";

const FREE_FEATURES = ["无限同步 B 站历史记录到本地"];

const VIP_FEATURES = [
  "无限同步 B 站历史记录到本地",
  "无限上传历史记录到服务器，多设备查看",
  "加入 VIP 用户群，需求优先响应",
  "收藏管理、视频备份等新功能优先体验",
];

const plans = [
  {
    id: "free",
    name: "免费版",
    desc: "基础功能，一直可用",
    price: "0",
    unit: "",
    original: "",
    note: "",
    features: FREE_FEATURES,
    highlight: false,
  },
  {
    id: "month",
    name: "月会员",
    desc: "全部功能",
    price: "9.9",
    unit: "/月",
    original: "¥12",
    note: "",
    features: VIP_FEATURES,
    highlight: false,
  },
  {
    id: "year",
    name: "年会员",
    desc: "全部功能",
    price: "99",
    unit: "/年",
    original: "¥118.8",
    note: "相当于 ¥8.25/月，省 17%",
    features: VIP_FEATURES,
    highlight: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: session } = await authClient.getSession();
        setUser(session?.user || null);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    getSession();
  }, []);

  const openQr = (title: string, hint: string) => (
    <Dialog>
      <DialogTrigger asChild>
        <button className="mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-primary text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90">
          {title}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{hint}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          <Image
            src="/images/wechat-qrcode.png"
            alt="微信二维码"
            width={240}
            height={240}
            className="rounded-xl border border-border"
          />
          <p className="mt-4 text-center text-[13px] leading-relaxed text-muted-foreground">
            添加微信付款，作者会手动为你开通会员。
          </p>
          <p className="mt-3 text-center text-[13px] font-medium">
            加好友时请备注「{hint.replace("联系我开通", "")}」
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* 导航 */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between px-4 md:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/images/icon.svg"
              alt="Bilibili 无限历史记录"
              className="h-8 w-8"
            />
            <span className="truncate text-[14px] font-semibold tracking-tight md:text-[15px]">
              Bilibili 无限历史记录
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              返回首页
            </Link>
            {!isLoading &&
              (user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  进入控制台
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  登录
                </Link>
              ))}
          </div>
        </div>
      </header>

      {/* 标题 */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(55%_50%_at_50%_0%,rgba(251,114,153,0.12),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-page px-6 pb-8 pt-12 text-center md:pb-10 md:pt-16 lg:px-8 lg:pt-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-white px-3 py-1 text-eyebrow text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            价格
          </span>
          <h1 className="mx-auto mt-6 max-w-2xl text-headline text-balance">
            选择适合你的方案
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-subhead text-muted-foreground">
            本地同步永久免费。需要多设备查看时，再考虑升级。
          </p>
        </div>
      </section>

      {/* 方案卡片 */}
      <section className="mx-auto max-w-page px-6 pb-20 lg:px-8">
        <div className="mx-auto grid max-w-4xl items-stretch gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border p-6 md:p-7 ${
                p.highlight
                  ? "border-foreground/15 bg-white shadow-lift ring-1 ring-foreground/5"
                  : "border-border bg-white shadow-card"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-2.5 left-7 z-10 rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                  推荐
                </span>
              )}

              <h2 className="text-[15px] font-semibold">{p.name}</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">{p.desc}</p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-[13px] text-muted-foreground">¥</span>
                <span className="text-[34px] font-semibold leading-none tracking-tight">
                  {p.price}
                </span>
                {p.unit && (
                  <span className="text-[13px] text-muted-foreground">
                    {p.unit}
                  </span>
                )}
                {p.original && (
                  <span className="ml-1 text-[13px] text-muted-foreground/70 line-through">
                    {p.original}
                  </span>
                )}
              </div>
              {p.note && (
                <p className="mt-1.5 text-[12px] text-primary">{p.note}</p>
              )}

              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-[13.5px] leading-relaxed text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              {p.id === "free" ? (
                <Link
                  href={user ? "/dashboard" : "/login"}
                  className="mt-7 inline-flex h-11 items-center justify-center rounded-xl border border-border text-[14px] font-medium transition-colors hover:bg-muted/50"
                >
                  免费使用
                </Link>
              ) : (
                openQr(
                  `升级到${p.name}`,
                  p.id === "month" ? "联系我开通月会员" : "联系我开通年会员"
                )
              )}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-[12.5px] text-muted-foreground">
          会员由作者手动开通，付款后请留意微信消息。
        </p>
      </section>

      {/* 说明 */}
      <section className="border-t border-border/60 bg-muted/20 py-20">
        <div className="mx-auto max-w-page px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-white px-3 py-1 text-eyebrow text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                为什么收费
              </span>
              <h2 className="mt-5 text-[24px] font-semibold tracking-tight">
                覆盖成本，把功能做下去
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
                收费用于承担服务器、数据库等基础设施开销，也让作者能把更多时间投入到维护和开发上，提供更稳定的服务。
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                感谢理解与支持。
              </p>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-border bg-white p-7 shadow-card">
              <div>
                <h2 className="text-[16px] font-semibold">对定价有建议？</h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                  欢迎直接告诉我，我会根据建议调整。
                </p>
              </div>
              <div className="mt-6 flex items-center gap-5">
                <Image
                  src="/images/wechat-qrcode.png"
                  alt="微信二维码"
                  width={112}
                  height={112}
                  className="rounded-xl border border-border"
                />
                <div className="text-[13px] leading-relaxed text-muted-foreground">
                  扫码添加微信
                  <br />
                  备注「定价建议」
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-page flex-col gap-3 px-6 py-8 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>© {new Date().getFullYear()} Bilibili 无限历史记录</span>
          <div className="flex gap-5">
            <Link href="/" className="transition-colors hover:text-foreground">
              首页
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              隐私政策
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}