"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Download,
  User,
  BookMarked,
  BadgePercent,
  Send,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

export default function Home() {
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
  // 定义功能卡片数据
  const features = [
    {
      title: "无限记录",
      description: "突破官方限制，永久保存所有观看历史",
    },
    {
      title: "时间回溯",
      description: "按时间排序，轻松回顾任意时段的观看内容",
    },
    {
      title: "快速搜索",
      description: "关键词搜索，秒速定位想找的视频",
    },
    {
      title: "自动同步",
      description: "后台自动同步，无需手动操作",
    },
    {
      title: "本地存储",
      description: "数据存本地，隐私安全有保障",
    },
    {
      title: "导出备份",
      description: "支持CSV导出，方便备份和分析",
    },
  ];

  // 定义应用场景数据
  const useCases = [
    {
      title: "找回学习资料",
      description: "之前看的教程、科普视频，随时能找回来",
    },
    {
      title: "追溯创作灵感",
      description: "那个激发灵感的视频，再也不会弄丢",
    },
    {
      title: "重温经典内容",
      description: "多年前的宝藏视频，想看就能找到",
    },
    {
      title: "快速分享推荐",
      description: "朋友问起那个视频，立刻就能分享",
    },
  ];

  // 定义步骤数据
  const steps = [
    {
      number: 1,
      title: "安装扩展",
      description: "从浏览器商店安装插件",
    },
    {
      number: 2,
      title: "登录B站",
      description: "登录后自动开始同步",
    },
    {
      number: 3,
      title: "开始使用",
      description: "查看、搜索、导出历史记录",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src="/images/icon.svg"
              alt="Bilibili 无限历史记录 Logo"
              className="w-8 h-8"
            />
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
              className="flex items-center space-x-1.5 text-gray-600 hover:text-[#00a1d6] font-medium transition-colors"
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
              // 已登录状态 - 显示用户名和跳转到仪表板
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 bg-[#00a1d6] hover:bg-[#0076a8] text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
              >
                <User className="h-4 w-4" />
                <span>{user.name}</span>
              </Link>
            ) : (
              // 未登录状态 - 显示登录和注册按钮
              <>
                <Link
                  href="/login"
                  className="bg-[#00a1d6] hover:bg-[#0076a8] text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
                >
                  登录
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 英雄区域 */}
      <header className="bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-[#00a1d6]/30 to-blue-300/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute left-0 bottom-0 w-96 h-96 bg-gradient-to-tr from-sky-300/20 to-[#00a1d6]/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          <div className="absolute center-0 top-1/2 w-64 h-64 bg-gradient-to-r from-indigo-200/10 to-blue-200/10 rounded-full blur-2xl"></div>
        </div>
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
            Bilibili 无限历史记录
            <span className="inline-block animate-bounce">🚀</span>
          </h1>
          <p className="text-xl sm:text-2xl mb-10 max-w-2xl mx-auto font-light text-slate-700">
            你的专属B站时光机，永久珍藏每一段观看记忆，不再错过任何精彩瞬间。
          </p>

          {/* 浏览器插件下载区域 */}
          <div className="flex flex-col items-center mt-8">
            <h3 className="text-lg font-medium mb-8 text-slate-600">
              安装浏览器插件
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {/* Chrome */}
              <Link
                href="https://chromewebstore.google.com/detail/bilibili-%E6%97%A0%E9%99%90%E5%8E%86%E5%8F%B2%E8%AE%B0%E5%BD%95/cfloggaggkeocfoflejkmhdhbehjojga?hl=zh"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center p-8 bg-white/70 backdrop-blur-sm border border-blue-100/50 rounded-2xl hover:bg-white/90 hover:border-[#00a1d6]/40 hover:shadow-xl transition-all duration-300 hover:scale-105 min-w-[160px]"
              >
                <div className="w-14 h-14 mb-5 flex items-center justify-center">
                  <img
                    src="/images/chrome.svg"
                    alt="Chrome"
                    className="w-12 h-12"
                  />
                </div>
                <span className="text-slate-700 font-medium text-sm group-hover:text-[#00a1d6] transition-colors">
                  Chrome
                </span>
              </Link>

              {/* Edge */}
              <Link
                href="https://microsoftedge.microsoft.com/addons/detail/ekdaecpdimflnhalemibjjjdfoplnbna"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center p-8 bg-white/70 backdrop-blur-sm border border-blue-100/50 rounded-2xl hover:bg-white/90 hover:border-[#00a1d6]/40 hover:shadow-xl transition-all duration-300 hover:scale-105 min-w-[160px]"
              >
                <div className="w-14 h-14 mb-5 flex items-center justify-center">
                  <img
                    src="/images/microsoft-edge.svg"
                    alt="Microsoft Edge"
                    className="w-12 h-12"
                  />
                </div>
                <span className="text-slate-700 font-medium text-sm group-hover:text-[#00a1d6] transition-colors">
                  Edge
                </span>
              </Link>

              {/* Firefox */}
              <Link
                href="https://addons.mozilla.org/zh-CN/firefox/addon/bilibili-%E6%97%A0%E9%99%90%E5%8E%86%E5%8F%B2%E8%AE%B0%E5%BD%95/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center p-8 bg-white/70 backdrop-blur-sm border border-blue-100/50 rounded-2xl hover:bg-white/90 hover:border-[#00a1d6]/40 hover:shadow-xl transition-all duration-300 hover:scale-105 min-w-[160px]"
              >
                <div className="w-14 h-14 mb-5 flex items-center justify-center">
                  <img
                    src="/images/Firefox.svg"
                    alt="Firefox"
                    className="w-12 h-12"
                  />
                </div>
                <span className="text-slate-700 font-medium text-sm group-hover:text-[#00a1d6] transition-colors">
                  Firefox
                </span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-center mt-8">
            <h3 className="text-lg font-medium mb-8 text-slate-600">
              离线压缩包
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {/* 离线压缩包 */}
              <Link
                href="https://cdn.dreamfree.xyz/bilibilihistory/bilibili-unlimited-history-1.9.1-chrome.zip"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center p-8 bg-white/70 backdrop-blur-sm border border-blue-100/50 rounded-2xl hover:bg-white/90 hover:border-[#00a1d6]/40 hover:shadow-xl transition-all duration-300 hover:scale-105 min-w-[160px]"
              >
                <div className="w-14 h-14 mb-5 flex items-center justify-center">
                  <Download className="w-12 h-12 text-[#00a1d6]" />
                </div>
                <span className="text-slate-700 font-medium text-sm group-hover:text-[#00a1d6] transition-colors">
                  chrome、edge
                </span>
              </Link>

              <Link
                href="https://cdn.dreamfree.xyz/bilibilihistory/bilibili-unlimited-history-1.9.1-firefox.zip"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center p-8 bg-white/70 backdrop-blur-sm border border-blue-100/50 rounded-2xl hover:bg-white/90 hover:border-[#00a1d6]/40 hover:shadow-xl transition-all duration-300 hover:scale-105 min-w-[160px]"
              >
                <div className="w-14 h-14 mb-5 flex items-center justify-center">
                  <Download className="w-12 h-12 text-[#00a1d6]" />
                </div>
                <span className="text-slate-700 font-medium text-sm group-hover:text-[#00a1d6] transition-colors">
                  firefox
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 问题区域 */}
      <section className="py-16 sm:py-20 px-6 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">
              你是否也遇到过这些问题？
            </h2>
            <p className="text-gray-600">
              B站官方只保留有限的历史记录，那些精彩内容可能随时消失
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2 text-gray-800">
                想重看的教程找不到了
              </h3>
              <p className="text-gray-500 text-sm">
                之前看的那个讲得很好的教程，怎么也搜不到了
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2 text-gray-800">
                追的系列视频断了
              </h3>
              <p className="text-gray-500 text-sm">
                追到一半的系列，历史记录被覆盖，不知道看到哪了
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-lg mb-2 text-gray-800">
                宝藏视频再也找不回
              </h3>
              <p className="text-gray-500 text-sm">
                记得看过但想不起关键词，官方记录早就没了
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 应用场景 */}
      <section className="py-16 sm:py-20 px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">
              适用场景
            </h2>
            <p className="text-gray-600">
              无论学习、创作还是日常，都能派上用场
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="bg-gray-50 p-5 rounded-xl text-center hover:bg-[#00a1d6]/5 transition-colors"
              >
                <h3 className="font-semibold text-gray-800 mb-2">
                  {useCase.title}
                </h3>
                <p className="text-gray-500 text-sm">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 功能区域 */}
      <section className="py-16 sm:py-20 px-6 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">
              核心功能
            </h2>
            <p className="text-gray-600">
              专为B站用户打造，让每一次观看都有迹可循
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-5 rounded-xl hover:shadow-md transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 定价区域 */}
      <section className="py-16 sm:py-20 px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">
              定价方案
            </h2>
            <p className="text-gray-600">
              简单透明，选择适合你的方案
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* 免费版 */}
            <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">免费版</h3>
              <p className="text-gray-500 text-sm mb-4">基础功能</p>
              <div className="text-3xl font-bold text-gray-800 mb-4">¥0</div>
              <ul className="text-sm text-gray-600 space-y-2 flex-grow">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  无限同步历史记录到本地
                </li>
              </ul>
              <Link
                href="/pricing"
                className="mt-6 block text-center py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                免费使用
              </Link>
            </div>

            {/* 月会员 */}
            <div className="bg-white p-6 rounded-xl shadow-md border-2 border-[#00a1d6] relative flex flex-col">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00a1d6] text-white text-xs px-3 py-1 rounded-full">
                推荐
              </span>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">月会员</h3>
              <p className="text-gray-500 text-sm mb-4">全部功能</p>
              <div className="flex items-baseline mb-4">
                <span className="text-3xl font-bold text-gray-800">¥9.9</span>
                <span className="text-gray-400 line-through ml-2">¥12</span>
                <span className="text-gray-500 ml-1">/月</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-2 flex-grow">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  无限同步历史记录到本地
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  上传到服务器，多设备查看
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  加入VIP群，需求优先响应
                </li>
              </ul>
              <Link
                href="/pricing"
                className="mt-6 block text-center py-2 px-4 bg-[#00a1d6] text-white rounded-lg hover:bg-[#0076a8] transition-colors text-sm font-medium"
              >
                立即开通
              </Link>
            </div>

            {/* 年会员 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-green-200 relative flex flex-col">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                最划算
              </span>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">年会员</h3>
              <p className="text-gray-500 text-sm mb-4">全部功能</p>
              <div className="flex items-baseline mb-1">
                <span className="text-3xl font-bold text-gray-800">¥99</span>
                <span className="text-gray-400 line-through ml-2">¥118.8</span>
                <span className="text-gray-500 ml-1">/年</span>
              </div>
              <p className="text-green-600 text-xs mb-4">相当于 ¥8.25/月，省17%</p>
              <ul className="text-sm text-gray-600 space-y-2 flex-grow">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  无限同步历史记录到本地
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  上传到服务器，多设备查看
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  加入VIP群，需求优先响应
                </li>
              </ul>
              <Link
                href="/pricing"
                className="mt-6 block text-center py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              >
                立即开通
              </Link>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="text-[#00a1d6] hover:underline text-sm"
            >
              查看完整定价详情 →
            </Link>
          </div>
        </div>
      </section>

      {/* 使用步骤 */}
      <section className="py-16 sm:py-20 px-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">
              三步开始使用
            </h2>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-[#00a1d6] w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-3">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-gray-500 text-sm">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block w-12 h-0.5 bg-gray-200 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-gray-800 text-white py-10 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Bilibili 无限历史记录</h2>
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-3">扫码加入用户群</p>
              <div className="flex justify-center">
                <img
                  src="/images/wechat-qrcode.png"
                  alt="微信用户群二维码"
                  className="w-36 h-36 bg-white p-1.5 rounded-md"
                />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              © 2024 Bilibili 无限历史记录
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
