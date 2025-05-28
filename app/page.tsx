"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Download,
  Clock,
  Search,
  RefreshCw,
  Lock,
  FileDown,
  BookOpen,
  Lightbulb,
  History,
  Share2,
  User,
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
      icon: <Clock className="h-6 w-6" />,
      title: "真正无限记录",
      description:
        "彻底突破官方数量限制，永久保存所有B站观看历史，不再有遗漏。",
    },
    {
      icon: <History className="h-6 w-6" />,
      title: "智能时间回溯",
      description: "按观看时间精确排序，轻松回顾当年今日在看什么视频内容。",
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: "精准标题搜索",
      description: "输入关键词，快速定位任何历史视频，忘记UP主也不怕找不到。",
    },
    {
      icon: <RefreshCw className="h-6 w-6" />,
      title: "自动增量同步",
      description:
        "每分钟自动同步最新历史，默默守护，省心省力，不错过任何记录。",
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "本地安全存储",
      description: "数据存储在本地IndexedDB，隐私至上，安全有保障。",
    },
    {
      icon: <FileDown className="h-6 w-6" />,
      title: "CSV 格式导出",
      description: "轻松将历史记录导出为CSV文件，方便备份或进行二次数据分析。",
    },
  ];

  // 定义应用场景数据
  const useCases = [
    {
      icon: <BookOpen className="h-7 w-7 text-[#00a1d6]" />,
      title: "学习与知识回顾 📚",
      description:
        "快速找回教程、科普视频，巩固学习成果。再也不用担心找不到之前看过的学习资源。",
    },
    {
      icon: <Lightbulb className="h-7 w-7 text-[#00a1d6]" />,
      title: "灵感与素材追溯 💡",
      description:
        "不再让一闪而过的灵感和素材溜走。随时回顾那些激发你创意的精彩内容，让灵感常驻。",
    },
    {
      icon: <History className="h-7 w-7 text-[#00a1d6]" />,
      title: "怀旧与考古乐趣 ⏳",
      description:
        "化身B站考古学家，发现被遗忘的宝藏。重温那些年你看过的经典视频，找回美好回忆。",
    },
    {
      icon: <Share2 className="h-7 w-7 text-[#00a1d6]" />,
      title: "日常查找与分享 🗣️",
      description:
        "快速定位视频，即时分享，不再尴尬。当朋友问起你之前推荐的那个视频是哪个？立刻找到！",
    },
  ];

  // 定义步骤数据
  const steps = [
    {
      number: 1,
      title: "安装扩展",
      description:
        "从Chrome商店或Edge商店下载并安装Bilibili 无限历史记录扩展。",
    },
    {
      number: 2,
      title: "登录B站",
      description: "确保你已登录哔哩哔哩网站，扩展将自动开始工作。",
    },
    {
      number: 3,
      title: "尽情使用",
      description: "点击扩展图标，即可查看、搜索和导出你的完整历史记录！",
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
            <span className="text-xl font-bold text-[#00a1d6]">
              Bilibili 无限历史记录
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <Link
              href="https://v3oxu28gnc.feishu.cn/docx/MZp8dCXd1otO9oxevQUcIlxFnPg?from=from_copylink"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-[#00a1d6] font-medium transition-colors"
            >
              文档
            </Link>
            <Link
              href="https://c1p0xw7om7n.feishu.cn/share/base/form/shrcneS0t8RdC3byY9xC5ftQgub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-700 hover:text-[#00a1d6] font-medium transition-colors"
            >
              提交建议
            </Link>

            {/* 根据登录状态显示不同内容 */}
            {isLoading ? (
              <div className="text-gray-500">加载中...</div>
            ) : user ? (
              // 已登录状态 - 显示用户名和跳转到仪表板
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 bg-[#00a1d6] hover:bg-[#0076a8] text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <User className="h-4 w-4" />
                <span>{user.name}</span>
              </Link>
            ) : (
              // 未登录状态 - 显示登录和注册按钮
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-[#00a1d6] font-medium transition-colors"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="bg-[#00a1d6] hover:bg-[#0076a8] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* 英雄区域 */}
      <header className="bg-gradient-to-r from-[#00a1d6] to-[#0076a8] text-white py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute left-0 bottom-0 w-96 h-96 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Bilibili 无限历史记录
            <span className="inline-block animate-bounce">🚀</span>
          </h1>
          <p className="text-xl sm:text-2xl mb-10 max-w-2xl mx-auto font-light">
            你的专属B站时光机，永久珍藏每一段观看记忆，不再错过任何精彩瞬间。
          </p>
          
          {/* 浏览器插件下载区域 */}
          <div className="flex flex-col items-center mt-8">
            <h3 className="text-lg font-medium mb-8 text-white/90">安装浏览器插件</h3>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {/* Chrome */}
              <Link
                href="https://chromewebstore.google.com/detail/bilibili-%E6%97%A0%E9%99%90%E5%8E%86%E5%8F%B2%E8%AE%B0%E5%BD%95/cfloggaggkeocfoflejkmhdhbehjojga?hl=zh"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center p-8 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl min-w-[160px]"
              >
                <div className="w-20 h-20 mb-5 flex items-center justify-center">
                  <img 
                    src="/images/chrome.svg" 
                    alt="Chrome"
                    className="w-16 h-16"
                  />
                </div>
                <span className="text-white font-medium text-sm group-hover:text-yellow-200 transition-colors">Chrome</span>
              </Link>

              {/* Edge */}
              <Link
                href="https://microsoftedge.microsoft.com/addons/detail/ekdaecpdimflnhalemibjjjdfoplnbna"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center p-8 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl min-w-[160px]"
              >
                <div className="w-20 h-20 mb-5 flex items-center justify-center">
                  <img 
                    src="/images/microsoft-edge.svg" 
                    alt="Microsoft Edge"
                    className="w-16 h-16"
                  />
                </div>
                <span className="text-white font-medium text-sm group-hover:text-blue-200 transition-colors">Edge</span>
              </Link>

              {/* Firefox */}
              <Link
                href="https://addons.mozilla.org/zh-CN/firefox/addon/bilibili-%E6%97%A0%E9%99%90%E5%8E%86%E5%8F%B2%E8%AE%B0%E5%BD%95/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center p-8 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-xl min-w-[160px]"
              >
                <div className="w-20 h-20 mb-5 flex items-center justify-center">
                  <img 
                    src="/images/Firefox.svg" 
                    alt="Firefox"
                    className="w-16 h-16"
                  />
                </div>
                <span className="text-white font-medium text-sm group-hover:text-orange-200 transition-colors">Firefox</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 问题区域 */}
      <section className="py-16 sm:py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">
              还在为这些烦恼吗？
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              官方记录上限、想不起的教程UP主、找不到的追番系列...
              那些B站瞬间，不应轻易消失。
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 sm:gap-10">
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-[#b3e5fc]/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Search className="h-8 w-8 text-[#00a1d6]" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-800">
                教程找不回
              </h3>
              <p className="text-gray-600">
                "上月看的烹饪教程是哪个UP主？找了好久都找不到..."
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-[#b3e5fc]/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Clock className="h-8 w-8 text-[#00a1d6]" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-800">
                系列追番难
              </h3>
              <p className="text-gray-600">
                "去年追的系列视频想重温，但历史记录早就刷没了..."
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-[#b3e5fc]/20 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <RefreshCw className="h-8 w-8 text-[#00a1d6]" />
              </div>
              <h3 className="font-semibold text-xl mb-3 text-gray-800">
                知识点遗忘
              </h3>
              <p className="text-gray-600">
                "看过讲这知识点的视频搜不到？记不清关键词怎么办..."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 功能区域 */}
      <section className="py-16 sm:py-20 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">
              ✨ 【Bilibili 无限历史记录】为你而来！
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              专为B站爱好者打造的终极历史记录解决方案，让每一次观看都有迹可循。
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 hover:border-[#00a1d6]/20"
              >
                <div className="flex items-center text-[#00a1d6] mb-4">
                  <div className="bg-[#b3e5fc]/30 w-12 h-12 rounded-lg flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-gray-800">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 ml-16">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 应用场景 */}
      <section className="py-16 sm:py-20 px-6 bg-gray-50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">
              满足你的多样需求
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              无论学习、娱乐还是工作，都能让你的B站体验更加完整
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-start hover:-translate-y-1"
              >
                <div className="bg-[#b3e5fc]/30 w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0">
                  {useCase.icon}
                </div>
                <div className="ml-6">
                  <h3 className="font-semibold text-xl mb-3 text-gray-800">
                    {useCase.title}
                  </h3>
                  <p className="text-gray-600">{useCase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 使用步骤 */}
      <section className="py-16 sm:py-20 px-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">
              📝 三步开启无限之旅
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              简单快捷，立即体验无限历史记录的便利
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* 连接线 (仅在md屏幕及以上显示) */}
            <div className="hidden md:block absolute top-24 left-[25%] w-[50%] h-0.5 bg-[#00a1d6]/20"></div>

            {steps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-4 relative"
              >
                <div className="bg-[#b3e5fc]/30 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-md relative z-10">
                  <div className="bg-[#00a1d6] w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {step.number}
                  </div>
                </div>
                <h3 className="font-semibold text-xl mb-3 text-gray-800">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-gray-800 text-white py-12 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">Bilibili 无限历史记录</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              让每一次B站观看都被永久珍藏，打造你的专属时光机。
            </p>
            <div className="text-center mb-8">
              <h3 className="text-xl font-medium mb-4">扫码加入用户群</h3>
              <div className="flex justify-center">
                <img
                  src="/images/wechat-qrcode.png"
                  alt="微信用户群二维码"
                  className="w-48 h-48 bg-white p-2 rounded-md shadow-md"
                />
              </div>
            </div>
            <div className="text-sm text-gray-500">
              © 2024 Bilibili 无限历史记录 丨你的专属时光机
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
