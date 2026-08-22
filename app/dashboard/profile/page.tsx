import Link from "next/link";
import { headers } from "next/headers";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getMembershipByUserId } from "@/lib/db/membership_queries";

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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

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
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">个人中心</h1>
        <p className="text-gray-600">查看您的账号信息和会员权益</p>
      </div>

      <Card className="overflow-hidden border-gray-200 shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400" />
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-blue-50">
                <AvatarImage
                  src={session.user.image ?? ""}
                  alt={`${session.user.name}的头像`}
                />
                <AvatarFallback className="bg-blue-500 text-xl font-semibold text-white">
                  {session.user.name?.charAt(0).toUpperCase() || "用"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-semibold text-gray-900">
                    {session.user.name}
                  </h2>
                  <Badge
                    className={
                      isActiveMember
                        ? "border-0 bg-amber-100 text-amber-700 hover:bg-amber-100"
                        : "border-0 bg-gray-100 text-gray-600 hover:bg-gray-100"
                    }
                  >
                    {isActiveMember && <Crown className="mr-1 h-3.5 w-3.5" />}
                    {planName}
                  </Badge>
                </div>
                <p className="truncate text-sm text-gray-500">
                  {session.user.email}
                </p>
              </div>
            </div>

            {!isActiveMember && (
              <Button asChild className="bg-blue-500 hover:bg-blue-600">
                <Link href="/pricing">查看会员方案</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
              <UserRound className="h-5 w-5 text-blue-500" />
              账号信息
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 px-6 py-1">
            <div className="flex items-center justify-between gap-6 py-5">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <UserRound className="h-4 w-4" />
                用户名
              </div>
              <span className="min-w-0 truncate text-sm font-medium text-gray-900">
                {session.user.name}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6 py-5">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Mail className="h-4 w-4" />
                邮箱
              </div>
              <span className="min-w-0 truncate text-sm font-medium text-gray-900">
                {session.user.email}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6 py-5">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <ShieldCheck className="h-4 w-4" />
                邮箱状态
              </div>
              <span
                className={`text-sm font-medium ${
                  session.user.emailVerified
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              >
                {session.user.emailVerified ? "已验证" : "未验证"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6 py-5">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <CalendarDays className="h-4 w-4" />
                注册时间
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formatDate(session.user.createdAt)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`overflow-hidden shadow-sm ${
            isActiveMember
              ? "border-amber-200 bg-gradient-to-br from-white to-amber-50/60"
              : "border-gray-200"
          }`}
        >
          <CardHeader className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                <Crown
                  className={`h-5 w-5 ${
                    isActiveMember ? "text-amber-500" : "text-gray-400"
                  }`}
                />
                会员权益
              </CardTitle>
              <Badge
                variant="outline"
                className={
                  isActiveMember
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-white text-gray-500"
                }
              >
                {membershipStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6 flex items-start justify-between gap-4 rounded-xl bg-white/80 p-4 ring-1 ring-gray-100">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  当前方案
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {planName}
                </p>
              </div>
              <div className="text-right">
                <p className="flex items-center justify-end gap-1.5 text-xs font-medium text-gray-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  {isActiveMember ? "有效期至" : "会员有效期"}
                </p>
                <p className="mt-1 text-sm font-medium text-gray-700">
                  {isActiveMember
                    ? expiresAt
                      ? formatDate(expiresAt)
                      : "永久有效"
                    : "—"}
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      isActiveMember
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm leading-5 text-gray-700">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>

            {!isActiveMember && (
              <div className="mt-6 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <div className="flex gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>升级会员可解锁云端同步、多设备查看和更多专属权益。</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
