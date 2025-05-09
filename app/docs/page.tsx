import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, FileText, Code, HelpCircle, Settings, Download } from "lucide-react"

export default function DocsPage() {
  // 定义文档卡片数据
  const docCards = [
    {
      icon: <FileText className="h-6 w-6 text-[#00a1d6]" />,
      title: "使用指南",
      description: "了解如何安装、配置和使用 Bilibili 无限历史记录扩展的基本功能。",
      link: "#usage-guide",
    },
    {
      icon: <Code className="h-6 w-6 text-[#00a1d6]" />,
      title: "高级功能",
      description: "探索扩展的高级功能，如数据导出、自定义设置和快捷键操作。",
      link: "#advanced-features",
    },
    {
      icon: <HelpCircle className="h-6 w-6 text-[#00a1d6]" />,
      title: "常见问题",
      description: "查看用户常见问题及解决方案，快速解决使用过程中遇到的问题。",
      link: "#faq",
    },
    {
      icon: <Settings className="h-6 w-6 text-[#00a1d6]" />,
      title: "故障排除",
      description: "遇到技术问题？这里提供详细的故障排除步骤和解决方案。",
      link: "#troubleshooting",
    },
  ]

  // 定义FAQ数据
  const faqItems = [
    {
      question: "扩展会收集我的个人信息吗？",
      answer:
        "不会。Bilibili 无限历史记录扩展只会在本地存储您的观看历史，所有数据都保存在您的浏览器中，不会上传到任何服务器或与第三方共享。",
    },
    {
      question: "历史记录会占用多少存储空间？",
      answer:
        "扩展使用浏览器的 IndexedDB 存储数据，一般来说，即使存储数万条历史记录也只会占用几十 MB 的空间，不会对您的设备性能造成明显影响。",
    },
    {
      question: "如何备份我的历史记录？",
      answer:
        "您可以在扩展面板中点击“导出数据”按钮，将历史记录导出为 CSV 文件保存到本地。建议定期导出备份，以防数据丢失。",
    },
    {
      question: "扩展支持哪些浏览器？",
      answer: "目前支持 Chrome、Edge、Firefox 和基于 Chromium 的其他浏览器（如 Brave、Opera 等）。",
    },
    {
      question: "如何清空历史记录？",
      answer: '在扩展设置中，您可以找到"清空数据"选项。请注意，此操作不可撤销，清空后的数据无法恢复。',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/" className="text-2xl font-bold text-[#00a1d6]">
              Bilibili 无限历史记录
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link
              href="/docs"
              className="text-[#00a1d6] font-medium transition-colors border-b-2 border-[#00a1d6] pb-1"
            >
              文档
            </Link>
            <Link href="/#download" className="text-gray-700 hover:text-[#00a1d6] font-medium transition-colors">
              下载插件
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/" className="inline-flex items-center text-[#00a1d6] hover:underline mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" />
          返回首页
        </Link>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">文档中心</h1>
          <p className="text-gray-600 mb-8">
            欢迎使用 Bilibili
            无限历史记录扩展的文档中心。在这里，您可以找到关于扩展的详细使用说明、常见问题解答以及高级功能介绍。
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {docCards.map((card, index) => (
              <a
                key={index}
                href={card.link}
                className="block p-6 border border-gray-100 rounded-xl hover:border-[#00a1d6]/30 hover:shadow-md transition-all duration-300 bg-gray-50 hover:bg-white"
              >
                <div className="flex items-start">
                  <div className="bg-white p-3 rounded-lg shadow-sm mr-4">{card.icon}</div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-800">{card.title}</h3>
                    <p className="text-gray-600 text-sm">{card.description}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8" id="usage-guide">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-[#00a1d6]" />
            使用指南
          </h2>
          <div className="border-l-4 border-[#00a1d6] pl-4 py-2 bg-blue-50 mb-6">
            <p className="text-gray-700">本指南将帮助您快速上手 Bilibili 无限历史记录扩展，掌握基本功能和操作。</p>
          </div>

          <h3 className="text-xl font-semibold mb-3 text-gray-800">安装扩展</h3>
          <p className="text-gray-600 mb-4">您可以通过以下方式安装我们的扩展：</p>
          <ol className="list-decimal list-inside space-y-2 mb-6 text-gray-600">
            <li>访问 Chrome 网上应用店或 Edge 扩展商店</li>
            <li>搜索"Bilibili 无限历史记录"</li>
            <li>点击"添加到 Chrome"或"获取"按钮</li>
            <li>完成安装后，您将在浏览器右上角看到扩展图标</li>
          </ol>

          <h3 className="text-xl font-semibold mb-3 text-gray-800">基本使用</h3>
          <p className="text-gray-600 mb-4">安装完成后，扩展将自动开始工作：</p>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-600">
            <li>登录 Bilibili 网站后，扩展会自动记录您的观看历史</li>
            <li>点击扩展图标打开历史记录面板</li>
            <li>在面板中，您可以查看、搜索和管理所有历史记录</li>
            <li>历史记录会按时间顺序排列，最新的记录显示在最前面</li>
          </ul>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-gray-800 mb-2">提示</h4>
            <p className="text-gray-600">
              首次使用时，扩展会自动同步您的历史记录。根据您的历史记录数量，这可能需要几分钟时间。同步完成后，您可以看到所有历史记录。
            </p>
          </div>

          <Button className="bg-[#00a1d6] hover:bg-[#0076a8] text-white">
            <Download className="mr-2 h-4 w-4" />
            下载完整用户手册 (PDF)
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8" id="faq">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
            <HelpCircle className="h-5 w-5 mr-2 text-[#00a1d6]" />
            常见问题
          </h2>
          <div className="border-l-4 border-[#00a1d6] pl-4 py-2 bg-blue-50 mb-6">
            <p className="text-gray-700">以下是用户最常问的问题及解答，希望能帮助您解决使用中的疑惑。</p>
          </div>

          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-gray-100 pb-4">
                <h3 className="font-semibold text-lg mb-2 text-gray-800">{item.question}</h3>
                <p className="text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="bg-gray-800 text-white py-8 px-6 mt-12">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Bilibili 无限历史记录</h2>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">让每一次B站观看都被永久珍藏，打造你的专属时光机。</p>
            <div className="text-sm text-gray-500">© 2024 Bilibili 无限历史记录 | 非官方工具，与哔哩哔哩官方无关</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
