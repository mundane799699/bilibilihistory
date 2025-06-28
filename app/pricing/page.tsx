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
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";

export default function PricingPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <nav className="bg-white shadow-sm sticky top-0 z-50 w-full">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <img src="/images/icon.svg" alt="Logo" className="w-8 h-8" />
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
              Bilibili 无限历史记录
            </span>
          </div>
        </div>
      </nav>
      <div className="w-full max-w-4xl mx-auto py-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
            选择适合你的方案
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            简单、透明的定价，助力你的 Bilibili 历史记录管理
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              <CardTitle>会员</CardTitle>
              <CardDescription>VIP Membership</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">¥8</span>
                <span className="ml-2 text-xl text-muted-foreground line-through">
                  ¥10
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
                  <Button className="w-full">升级到会员</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>联系我开通会员</DialogTitle>
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
                      加好友时请备注“开通会员”
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
      </div>
    </div>
  );
}
