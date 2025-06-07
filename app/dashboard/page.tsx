"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [testDataGenerated, setTestDataGenerated] = useState(false);

  // 存储测试数据以便重复使用
  const [testDataList, setTestDataList] = useState<any[]>([]);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: session } = await authClient.getSession();
        if (!session) {
          router.push("/login");
        } else {
          setUser(session.user);
        }
      } catch (error) {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    getSession();
  }, [router]);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };

  // 生成固定的测试数据
  const generateTestData = () => {
    return Array.from({ length: 5 }, (_, index) => ({
      id: 114624238256154 + index, // 使用固定的ID以便测试upsert
      business: "archive",
      bvid: `BV1CXT7zxEc${index}`,
      cid: 30315907197 + index,
      title: `测试视频${index + 1}-${testDataGenerated ? "更新版" : "原版"}`,
      tagName: ["科技", "游戏", "音乐", "生活", "学习"][index] || "测试分类",
      cover: "https://i2.hdslb.com/bfs/archive/default.jpg",
      viewTime: Math.floor(Date.now() / 1000) - index * 3600,
      uri: "",
      authorName: `${testDataGenerated ? "新" : "原"}UP主${index + 1}`,
      authorMid: 10979326 + index,
      timestamp: Date.now() - index * 3600000,
    }));
  };

  // 测试批量upsert历史记录的函数
  const handleTestUpsert = async () => {
    if (!user) return;

    setIsUploading(true);
    try {
      // 如果还没有生成过测试数据，生成新的；否则更新现有数据
      const newTestData = generateTestData();
      setTestDataList(newTestData);

      const response = await fetch("/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upsert失败");
      }

      const result = await response.json();

      const action = testDataGenerated ? "更新" : "插入";
      toast.success(`批量${action}测试成功！`, {
        description: `成功${action} ${result.count} 条历史记录`,
      });

      setTestDataGenerated(!testDataGenerated);
      console.log(`批量${action}成功:`, result);
    } catch (error) {
      console.error("Upsert失败:", error);
      toast.error("Upsert失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/images/icon.svg" alt="Logo" className="w-8 h-8" />
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">
              Bilibili 无限历史记录
            </span>
          </div>

          {/* 右上角 - 退出登录 */}
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 px-4 py-1.5"
          >
            退出登录
          </Button>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              欢迎回来，{user.name}！
            </h1>
            <p className="text-gray-600 mt-2">这是您的个人仪表板</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>用户信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    姓名
                  </label>
                  <p className="text-lg">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    邮箱
                  </label>
                  <p className="text-lg">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    用户ID
                  </label>
                  <p className="text-sm text-gray-600 font-mono">{user.id}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upsert测试功能</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  测试Drizzle数据库的Upsert功能（插入或更新）
                </p>
                <Button
                  onClick={handleTestUpsert}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading
                    ? "Upsert中..."
                    : testDataGenerated
                    ? "测试批量更新"
                    : "测试批量插入"}
                </Button>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>第一次点击：插入5条新记录</p>
                  <p>第二次点击：更新相同ID的记录</p>
                  <p className="font-medium">
                    当前状态：
                    {testDataGenerated
                      ? "已有测试数据，下次将更新"
                      : "尚无测试数据，下次将插入"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
