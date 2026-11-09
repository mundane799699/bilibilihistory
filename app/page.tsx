"use client";

import Link from "next/link";
import {
  BookMarked,
  BadgePercent,
  Send,
  ShieldCheck,
  Menu,
  X,
  ArrowRight,
  Check,
  Download,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Share2,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

/* ---------- 内容数据 ---------- */

const problems = [
  {
    title: "想重看的教程找不到了",
    body: "之前看的那个讲得很好的教程，怎么也搜不到了。",
  },
  {
    title: "追的系列视频断了",
    body: "追到一半的系列，历史记录被覆盖，不知道看到哪了。",
  },
  {
    title: "宝藏视频再也找不回",
    body: "记得看过但想不起关键词，官方记录早就没了。",
  },
];

const features = [
  { title: "无限记录", body: "突破官方上限，所有观看历史永久保存。" },
  { title: "时间回溯", body: "按时间排序，轻松回到任意一段观看。" },
  { title: "快速搜索", body: "关键词检索，秒速定位想找的视频。" },
  { title: "自动同步", body: "浏览器后台静默同步，不用手动操作。" },
  { title: "本地优先", body: "数据默认存在本地，隐私自己掌握。" },
  { title: "导出备份", body: "支持 CSV 导出，方便归档和二次分析。" },
];

const useCases = [
  {
    title: "找回学习资料",
    body: "教程、科普、公开课，随时翻回来。",
    icon: GraduationCap,
  },
  {
    title: "追溯创作灵感",
    body: "那个激发灵感的视频，再也不会弄丢。",
    icon: Lightbulb,
  },
  {
    title: "重温经典内容",
    body: "多年前的宝藏视频，想看就能找到。",
    icon: Sparkles,
  },
  {
    title: "分享给朋友",
    body: "朋友问起那个视频，立刻就能找出来。",
    icon: Share2,
  },
];

const steps = [
  { title: "安装扩展", body: "从浏览器商店安装，几秒钟完成。" },
  { title: "登录 B 站", body: "打开 bilibili.com，同步自动开始。" },
  { title: "开始回看", body: "在网页端搜索、筛选、导出全部历史。" },
];

const plans = [
  {
    name: "免费版",
    desc: "基础功能，一直可用",
    price: "0",
    unit: "",
    original: "",
    cta: "免费使用",
    highlight: false,
    note: "",
    features: ["无限同步历史记录到本地"],
  },
  {
    name: "月会员",
    desc: "全部功能",
    price: "9.9",
    unit: "/月",
    original: "¥12",
    cta: "立即开通",
    highlight: false,
    note: "",
    features: [
      "无限同步历史记录到本地",
      "上传到服务器，多设备查看",
      "加入 VIP 群，需求优先响应",
    ],
  },
  {
    name: "年会员",
    desc: "全部功能",
    price: "99",
    unit: "/年",
    original: "¥118.8",
    cta: "立即开通",
    highlight: true,
    note: "相当于 ¥8.25/月，省 17%",
    features: [
      "无限同步历史记录到本地",
      "上传到服务器，多设备查看",
      "加入 VIP 群，需求优先响应",
    ],
  },
];

const browsers = [
  {
    name: "Chrome",
    img: "/images/chrome.svg",
    href: "https://chromewebstore.google.com/detail/bilibili-%E6%97%A0%E9%99%90%E5%8E%86%E5%8F%B2%E8%AE%B0%E5%BD%95/cfloggaggkeocfoflejkmhdhbehjojga?hl=zh",
  },
  {
    name: "Edge",
    img: "/images/microsoft-edge.svg",
    href: "https://microsoftedge.microsoft.com/addons/detail/ekdaecpdimflnhalemibjjjdfoplnbna",
  },
  {
    name: "Firefox",
    img: "/images/Firefox.svg",
    href: "https://addons.mozilla.org/zh-CN/firefox/addon/bilibili-%E6%97%A0%E9%99%90%E5%8E%86%E5%8F%B2%E8%AE%B0%E5%BD%95/",
  },
];

// 离线安装包版本号，发布新版时只需修改这里
const EXTENSION_VERSION = "2.3.0";
const OFFLINE_BASE_URL = "https://cdn.dreamfree.xyz/bilibilihistory";

const offline = [
  {
    name: "Chrome / Edge",
    href: `${OFFLINE_BASE_URL}/bilibili-unlimited-history-${EXTENSION_VERSION}-chrome.zip`,
  },
  {
    name: "Firefox",
    href: `${OFFLINE_BASE_URL}/bilibili-unlimited-history-${EXTENSION_VERSION}-firefox.zip`,
  },
];

const navLinks = [
  {
    label: "文档",
    icon: BookMarked,
    href: "https://v3oxu28gnc.feishu.cn/docx/MZp8dCXd1otO9oxevQUcIlxFnPg?from=from_copylink",
    external: true,
  },
  { label: "价格", icon: BadgePercent, href: "/pricing", external: false },
  { label: "反馈", icon: Send, href: "#footer", external: false },
  { label: "隐私政策", icon: ShieldCheck, href: "/privacy", external: false },
];

/* ---------- 小组件 ---------- */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-white px-3 py-1 text-eyebrow text-muted-foreground">
      {children}
    </span>
  );
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* ============ 导航 ============ */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/images/icon.svg"
              alt="Bilibili 无限历史记录"
              className="h-8 w-8"
            />
            <span className="text-[15px] font-semibold tracking-tight">
              Bilibili 无限历史记录
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => {
              const Icon = l.icon;
              const cls =
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground";
              return l.external ? (
                <Link
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cls}
                >
                  <Icon className="h-4 w-4" />
                  {l.label}
                </Link>
              ) : (
                <Link key={l.label} href={l.href} className={cls}>
                  <Icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {isLoading ? (
              <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
            ) : user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                {user.name}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                登录
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {!isLoading && (
              <Link
                href={user ? "/dashboard" : "/login"}
                className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground"
              >
                {user ? user.name : "登录"}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted/60"
              aria-label="切换菜单"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border/60 bg-white px-4 py-3 md:hidden">
            {navLinks.map((l) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  target={l.external ? "_blank" : undefined}
                  rel={l.external ? "noopener noreferrer" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted/60"
                >
                  <Icon className="h-4 w-4" />
                  {l.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* ============ 首屏 ============ */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[680px] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(251,114,153,0.12),transparent_70%)]"
        />
        <div className="relative mx-auto max-w-page px-6 px-6 pb-14 pt-14 text-center md:pb-20 md:pt-20 lg:px-8 lg:pb-28 lg:pt-28">
          <Eyebrow>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            你的专属 B 站时光机
          </Eyebrow>

          <h1 className="mx-auto mt-6 max-w-4xl text-[clamp(2.125rem,7vw,5rem)] font-semibold leading-[1.1] tracking-[-0.04em] text-balance">
            Bilibili 无限历史记录
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-subhead text-muted-foreground">
            突破官方历史记录上限，把每一段观看都完整留下来。
            <br className="hidden sm:block" />
            想重看的时候，它还在那里。
          </p>

          {/* 三个浏览器商店入口都放在首屏，不用滚到下面找 */}
          <div className="mx-auto mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
            {browsers.map((b) => (
              <Link
                key={b.name}
                href={b.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-border bg-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
              >
                <img src={b.img} alt={b.name} className="h-7 w-7 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium">
                    {b.name}
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    去商店安装
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>

          {/* 在线使用降为文字链接：首屏焦点留给三个商店入口 */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground transition-colors hover:text-primary"
            >
              {user ? "进入控制台" : "在线使用"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {offline.map((o) => (
              <Link
                key={o.name}
                href={o.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <Download className="h-3.5 w-3.5" />
                离线包 · {o.name}
              </Link>
            ))}
          </div>

          <p className="mt-4 text-[13px] text-muted-foreground">
            免费安装 · 数据默认存在本地
          </p>

          {/* 应用预览框 */}
          <div className="mx-auto mt-10 max-w-4xl text-left md:mt-16">
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-lift">
              <div className="flex items-center gap-2 border-b border-border/70 bg-muted/30 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-xs text-muted-foreground">
                  bilibilihistory
                </span>
              </div>
              <div className="grid gap-0 sm:grid-cols-[176px_1fr]">
                <div className="hidden border-r border-border/70 bg-muted/20 p-3 sm:block">
                  {["总览", "历史记录", "搜索", "导出", "设置"].map((x, i) => (
                    <div
                      key={x}
                      className={`mb-1 rounded-lg px-3 py-2 text-[13px] ${
                        i === 1
                          ? "bg-white font-medium text-foreground shadow-sm"
                          : "text-muted-foreground"
                      }`}
                    >
                      {x}
                    </div>
                  ))}
                </div>
                <div className="p-5 sm:p-7">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="h-3 w-24 rounded-full bg-muted" />
                    <div className="h-8 w-20 rounded-lg border border-border" />
                  </div>
                  <div className="space-y-2.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-xl border border-border/60 p-3"
                      >
                        <div className="h-10 w-16 shrink-0 rounded-md bg-gradient-to-br from-primary/25 to-primary/5" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2.5 w-3/4 rounded-full bg-muted" />
                          <div className="h-2 w-1/3 rounded-full bg-muted/70" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 问题 ============ */}
      <section className="border-t border-border/60 bg-muted/20 py-14 md:py-20 lg:py-28">
        <div className="mx-auto max-w-page px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:items-start lg:gap-20">
            <div className="lg:sticky lg:top-28">
              <Eyebrow>为什么需要它</Eyebrow>
              <h2 className="mt-6 text-headline text-balance">
                突破官方限制，无限保存历史记录
              </h2>
              <p className="mt-5 max-w-md text-subhead text-muted-foreground">
                B 站的历史记录有上限，翻久了就没了。那些你认真看完的内容，
                值得一个更可靠的存放处。
              </p>
            </div>

            <div className="space-y-3">
              {problems.map((p, i) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-border bg-white p-6 shadow-card transition-shadow hover:shadow-lift"
                >
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 font-mono text-[13px] text-muted-foreground/60">
                      0{i + 1}
                    </span>
                    <div>
                      <h3 className="text-[15px] font-semibold">{p.title}</h3>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                        {p.body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ 功能 ============ */}
      <section className="py-14 md:py-20 lg:py-28">
        <div className="mx-auto max-w-page px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>核心能力</Eyebrow>
            <h2 className="mt-6 text-headline text-balance">
              看过的全都找得到
            </h2>
            <p className="mt-5 text-subhead text-muted-foreground">
              从同步、检索到导出，一条完整的链路。
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex min-h-[168px] flex-col bg-white p-8 transition-colors hover:bg-muted/20"
              >
                <h3 className="text-[20px] font-semibold tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 使用场景 ============ */}
      <section className="border-y border-border/60 bg-muted/20 py-14 md:py-20 lg:py-28">
        <div className="mx-auto max-w-page px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Eyebrow>适用场景</Eyebrow>
              <h2 className="mt-6 text-headline text-balance">
                你会在这些时候用到它
              </h2>
            </div>
            <p className="max-w-sm text-[14px] leading-relaxed text-muted-foreground">
              不管是补一节没看完的课，还是找一段说不清名字的视频。
            </p>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {useCases.map((u) => {
              const Icon = u.icon;
              return (
                <div
                  key={u.title}
                  className="group flex min-h-[148px] flex-col rounded-2xl border border-border bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift"
                >
                  <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="text-[15px] font-semibold">{u.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                    {u.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ 定价 ============ */}
      <section className="py-14 md:py-20 lg:py-28">
        <div className="mx-auto max-w-page px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>价格</Eyebrow>
            <h2 className="mt-6 text-headline">简单透明，按需选择</h2>
            <p className="mt-5 text-subhead text-muted-foreground">
              本地同步永久免费，需要多设备时再升级。
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl items-stretch gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-2xl border p-7 ${
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
                <h3 className="text-[15px] font-semibold">{p.name}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {p.desc}
                </p>

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
                      className="flex items-start gap-2 text-[13.5px] text-muted-foreground"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/pricing"
                  className={`mt-7 inline-flex h-11 items-center justify-center rounded-xl text-[14px] font-medium transition-all ${
                    p.highlight
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "border border-border hover:bg-muted/50"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
            >
              查看完整定价详情
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ 下载 ============ */}
      <section className="border-t border-border/60 bg-muted/20 py-14 md:py-20 lg:py-28">
        <div className="mx-auto max-w-page px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>安装</Eyebrow>
            <h2 className="mt-6 text-headline">选择你的浏览器</h2>
            <p className="mt-5 text-subhead text-muted-foreground">
              从商店安装即可自动更新；需要离线安装包时用下面的压缩包。
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-3">
            {browsers.map((b) => (
              <Link
                key={b.name}
                href={b.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <img src={b.img} alt={b.name} className="h-9 w-9" />
                <div className="flex-1">
                  <div className="text-[14px] font-medium">{b.name}</div>
                  <div className="text-[12px] text-muted-foreground">
                    去商店安装
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>

          <div className="mx-auto mt-3 grid max-w-3xl gap-3 sm:grid-cols-2">
            {offline.map((o) => (
              <Link
                key={o.name}
                href={o.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-white/60 p-5 text-[13.5px] text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
              >
                <Download className="h-4 w-4" />
                离线压缩包 · {o.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 步骤 ============ */}
      <section className="py-14 md:py-20 lg:py-28">
        <div className="mx-auto max-w-page px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>三步开始</Eyebrow>
            <h2 className="mt-6 text-headline">三步安装</h2>
          </div>

          <div className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {steps.map((s, i) => (
              <div key={s.title} className="relative text-center">
                {/* 编号居中；横线从编号两侧伸向相邻步骤 */}
                <div className="relative flex items-center justify-center">
                  {i > 0 && (
                    <span className="absolute right-1/2 hidden h-px w-[calc(50%-1.5rem)] bg-border sm:block" />
                  )}
                  {i < steps.length - 1 && (
                    <span className="absolute left-1/2 hidden h-px w-[calc(50%-1.5rem)] bg-border sm:block" />
                  )}
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-[13px] font-medium">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-[15px] font-semibold">{s.title}</h3>
                <p className="mx-auto mt-1.5 max-w-[240px] text-[13.5px] leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 页脚 ============ */}
      <footer id="footer" className="border-t border-border/60">
        <div className="mx-auto max-w-page px-6 py-14 lg:px-8">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <img
                  src="/images/icon.svg"
                  alt="Bilibili 无限历史记录"
                  className="h-7 w-7"
                />
                <span className="text-[14px] font-semibold">
                  Bilibili 无限历史记录
                </span>
              </div>
              <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
                把每一段观看完整留下来，想找的时候随时能找到。
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <p className="text-[12px] text-muted-foreground">
                扫码加入用户群
              </p>
              <img
                src="/images/wechat-qrcode.png"
                alt="微信用户群二维码"
                className="h-32 w-32 rounded-lg border border-border bg-white p-1.5"
              />
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-border/60 pt-6 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Bilibili 无限历史记录</span>
            <div className="flex gap-5">
              <Link
                href="/privacy"
                className="transition-colors hover:text-foreground"
              >
                隐私政策
              </Link>
              <Link
                href="/pricing"
                className="transition-colors hover:text-foreground"
              >
                价格
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
