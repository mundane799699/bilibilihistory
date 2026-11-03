import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  Check,
  Clock3,
  Crown,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSession } from "@/lib/session";
import { getMembershipByUserId } from "@/lib/db/membership_queries";
import { reconcileUserOrders } from "@/lib/pay/service";

const planNames: Record<string, string> = {
  monthly: "月会员",
  yearly: "年会员",
  lifetime: "终身会员",
};

const membershipBenefits = [
  "无限同步 Bilibili 历史记录到本地",
  "无限上传历史记录到服务器，多设备随时查看",
  "加入 VIP 用户群，提出的需求优先响应",
  "收藏管理、视频备份等新功能优先体验",
];

const freeBenefits = ["无限同步 Bilibili 历史记录到本地"];

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // 回调白名单受限，进页面时主动和蓝兔对一次账，避免用户关掉弹窗后会员没开通
  await reconcileUserOrders(session.user.id).catch(() => {});

  const membership = await getMembershipByUserId(session.user.id);
  const expiresAt = membership?.expiresAt
    ? new Date(membership.expiresAt)
    : null;
  const hasExpired = Boolean(expiresAt && expiresAt.getTime() <= Date.now());
  const isActiveMember = Boolean(
    membership && membership.status === "active" && !hasExpired
  );

  const planName = isActiveMember
    ? planNames[membership?.plan ?? ""] ?? "VIP 会员"
    : "免费版";
  const benefits = isActiveMember ? membershipBenefits : freeBenefits;

  const membershipStatus = isActiveMember
    ? "有效"
    : membership?.status === "cancelled"
      ? "已取消"
      : membership
        ? "已过期"
        : "免费用户";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold tracking-tight">个人中心</h1>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground">
          查看账号信息与会员权益
        </p>
      </div>

      {/* 账号概览 */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-card">
        <div className="h-1 bg-gradient-to-r from-primary/70 via-primary/40 to-primary/10" />
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="h-14 w-14 border border-border">
              <AvatarImage
                src={session.user.image ?? ""}
                alt={`${session.user.name}的头像`}
              />
              <AvatarFallback className="bg-primary text-[15px] font-semibold text-primary-foreground">
                {session.user.name?.charAt(0).toUpperCase() || "用"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-[16px] font-semibold">
                  {session.user.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    isActiveMember
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isActiveMember && <Crown className="h-3 w-3" />}
                  {planName}
                </span>
              </div>
              <p className="mt-1 truncate text-[13px] text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </div>

          {!isActiveMember && (
            <Link
              href="/pricing"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-primary px-5 text-[13.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              查看会员方案
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* 账号信息 */}
        <div className="rounded-2xl border border-border bg-white shadow-card">
          <div className="flex items-center gap-2 border-b border-border/60 px-6 py-4">
            <UserRound className="h-4 w-4 text-primary" />
            <h2 className="text-[14px] font-semibold">账号信息</h2>
          </div>
          <div className="divide-y divide-border/60 px-6">
            <div className="flex items-center justify-between gap-6 py-4">
              <span className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                <UserRound className="h-4 w-4" />
                用户名
              </span>
              <span className="min-w-0 truncate text-[13px] font-medium">
                {session.user.name}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6 py-4">
              <span className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                <Mail className="h-4 w-4" />
                邮箱
              </span>
              <span className="min-w-0 truncate text-[13px] font-medium">
                {session.user.email}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6 py-4">
              <span className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                邮箱状态
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[13px] font-medium ${
                  session.user.emailVerified
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              >
                {session.user.emailVerified ? "已验证" : "未验证"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6 py-4">
              <span className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                注册时间
              </span>
              <span className="text-[13px] font-medium">
                {formatDate(session.user.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* 会员权益 */}
        <div className="rounded-2xl border border-border bg-white shadow-card">
          <div className="flex items-center justify-between gap-4 border-b border-border/60 px-6 py-4">
            <div className="flex items-center gap-2">
              <Crown
                className={`h-4 w-4 ${
                  isActiveMember ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <h2 className="text-[14px] font-semibold">会员权益</h2>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                isActiveMember
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {membershipStatus}
            </span>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-4 rounded-xl bg-muted/40 p-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  当前方案
                </p>
                <p className="mt-1 text-[15px] font-semibold">{planName}</p>
              </div>
              <div className="text-right">
                <p className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Clock3 className="h-3 w-3" />
                  {isActiveMember ? "有效期至" : "会员有效期"}
                </p>
                <p className="mt-1 text-[13px] font-medium">
                  {isActiveMember
                    ? expiresAt
                      ? formatDate(expiresAt)
                      : "永久有效"
                    : "—"}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      isActiveMember
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-[13px] leading-5 text-muted-foreground">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            {!isActiveMember && (
              <div className="mt-5 flex gap-2 rounded-xl bg-primary/5 px-4 py-3 text-[12.5px] leading-relaxed text-foreground">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <p>升级会员可解锁云端同步、多设备查看和更多专属权益。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
