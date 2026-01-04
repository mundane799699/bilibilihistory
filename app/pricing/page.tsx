"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, BookMarked, BadgePercent, Send, User } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: session } = await authClient.getSession();
        setUser(session?.user || null);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-50 w-full">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <img src="/images/icon.svg" alt="Logo" className="w-8 h-8" />
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
              Bilibili 无限历史记录
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <Link
              href="https://v3oxu28gnc.feishu.cn/docx/MZp8dCXd1otO9oxevQUcIlxFnPg?from=from_copylink"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-gray-600 hover:text-[#00a1d6] font-medium transition-colors"
            >
              <BookMarked className="h-4 w-4" />
              <span>文档</span>
            </Link>
            <Link
              href="/pricing"
              className="flex items-center space-x-1.5 text-[#00a1d6] font-medium transition-colors"
            >
              <BadgePercent className="h-4 w-4" />
              <span>价格</span>
            </Link>
            <Link
              href="https://c1p0xw7om7n.feishu.cn/share/base/form/shrcneS0t8RdC3byY9xC5ftQgub"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 text-gray-600 hover:text-[#00a1d6] font-medium transition-colors"
            >
              <Send className="h-4 w-4" />
              <span>反馈</span>
            </Link>

            {/* 根据登录状态显示不同内容 */}
            {isLoading ? (
              <div className="text-gray-500">加载中...</div>
            ) : user ? (
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 bg-[#00a1d6] hover:bg-[#0076a8] text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
              >
                <User className="h-4 w-4" />
                <span>{user.name}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-[#00a1d6] hover:bg-[#0076a8] text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
              >
                登录
              </Link>
            )}
          </div>
        </div>
      </nav>
      <div className="w-full max-w-6xl mx-auto py-6 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            选择适合你的方案
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            简单、透明的定价，助力你的 Bilibili 历史记录管理
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>免费版</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="text-4xl font-bold">¥0</div>
              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>无限同步B站的历史记录到本地</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter></CardFooter>
          </Card>

          <Card className="border-purple-500 flex flex-col relative shadow-lg">
            <Badge className="absolute -top-4 left-1/2 -translate-x-1/2">
              推荐
            </Badge>
            <CardHeader>
              <CardTitle>月会员</CardTitle>
              <CardDescription>Monthly VIP</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">¥9.9</span>
                <span className="ml-2 text-xl text-muted-foreground line-through">
                  ¥12
                </span>
                <span className="ml-2 text-muted-foreground">/ 月</span>
              </div>
              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>无限同步B站的历史记录到本地</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>
                    <strong>无限上传历史记录到服务器，实现多设备查看</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>
                    <strong>加入VIP用户群, 提出的需求优先响应</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>
                    <strong>收藏管理、视频备份等更多功能正在开发中...</strong>
                  </span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">升级到月会员</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>联系我开通月会员</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center justify-center p-4">
                    <Image
                      src="/images/wechat-qrcode.png"
                      alt="wechat qrcode"
                      width={250}
                      height={250}
                      className="rounded-md"
                    />
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      添加微信，付款，作者将手动为您开通会员。
                    </p>
                    <p className="font-bold mt-4 text-center text-base text-muted-foreground">
                      加好友时请备注"开通月会员"
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          <Card className="border-green-500 flex flex-col relative shadow-lg">
            <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500">
              最划算
            </Badge>
            <CardHeader>
              <CardTitle>年会员</CardTitle>
              <CardDescription>Yearly VIP</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">¥99</span>
                <span className="ml-2 text-xl text-muted-foreground line-through">
                  ¥118.8
                </span>
                <span className="ml-2 text-muted-foreground">/ 年</span>
              </div>
              <div className="mt-2 text-sm text-green-600 font-medium">
                相当于每月仅需 ¥8.25，节省 17%
              </div>
              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>无限同步B站的历史记录到本地</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>
                    <strong>无限上传历史记录到服务器，实现多设备查看</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>
                    <strong>加入VIP用户群, 提出的需求优先响应</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                  <span>
                    <strong>收藏管理、视频备份等更多功能正在开发中...</strong>
                  </span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-green-600 hover:bg-green-700">升级到年会员</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>联系我开通年会员</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center justify-center p-4">
                    <Image
                      src="/images/wechat-qrcode.png"
                      alt="wechat qrcode"
                      width={250}
                      height={250}
                      className="rounded-md"
                    />
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      添加微信，付款，作者将手动为您开通会员。
                    </p>
                    <p className="font-bold mt-4 text-center text-base text-muted-foreground">
                      加好友时请备注"开通年会员"
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-16 ">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            为什么要收费？
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            我们收费是为了能够覆盖服务器、数据库等基础设施的成本，并投入更多的时间和精力来维护和开发新功能，从而为您提供更稳定、更优质的服务。
          </p>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            感谢您的理解与支持。
          </p>
        </div>

        <div className="mt-16 ">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            对定价有建议？
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            欢迎提出您的建议，作者将根据您的建议调整定价。
          </p>
          <div className="flex flex-col items-center justify-center mt-8">
            <Image
              src="/images/wechat-qrcode.png"
              alt="wechat qrcode"
              width={250}
              height={250}
              className="rounded-md"
            />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              扫码添加微信，向我提出您的建议
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
