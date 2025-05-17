import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Code, HelpCircle, Settings, Download, ExternalLink, Search, CheckCircle2, AlertTriangle, BookOpen } from "lucide-react"

export default function DocsPage() {
  // 定义文档卡片数据
  const docCards = [
    {
      icon: <FileText className="h-6 w-6 text-biliBlue" />,
      title: "使用指南",
      description: "了解如何安装、配置和使用 Bilibili 无限历史记录扩展的基本功能。",
      link: "#usage-guide",
    },
    {
      icon: <Code className="h-6 w-6 text-biliBlue" />,
      title: "高级功能",
      description: "探索扩展的高级功能，如数据导出、自定义设置和快捷键操作。",
      link: "#advanced-features",
    },
    {
      icon: <HelpCircle className="h-6 w-6 text-biliBlue" />,
      title: "常见问题",
      description: "查看用户常见问题及解决方案，快速解决使用过程中遇到的问题。",
      link: "#faq",
    },
    {
      icon: <Settings className="h-6 w-6 text-biliBlue" />,
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
        "您可以在扩展面板中点击"导出数据"按钮，将历史记录导出为 CSV 文件保存到本地。建议定期导出备份，以防数据丢失。",
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
    <div className="min-h-screen bg-biliGray">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-biliBlue flex items-center">
              <svg viewBox="0 0 24 24" className="h-7 w-7 mr-2" fill="currentColor">
                <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906L17.813 4.653zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773H5.333zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z" />
              </svg>
              Bilibili 无限历史记录
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link
              href="/docs"
              className="text-biliBlue font-medium transition-colors border-b-2 border-biliBlue pb-1"
            >
              文档
            </Link>
            <Link 
              href="/#download" 
              className="text-gray-700 hover:text-biliBlue font-medium transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-1" />
              下载插件
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/" className="inline-flex items-center text-biliBlue hover:underline mb-6 group">
          <ArrowLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          返回首页
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-8 mb-8 transition-shadow hover:shadow-md">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center">
            <BookOpen className="h-7 w-7 mr-3 text-biliPink" />
            文档中心
          </h1>
          <p className="text-gray-600 mb-8">
            欢迎使用 Bilibili
            无限历史记录扩展的文档中心。在这里，您可以找到关于扩展的详细使用说明、常见问题解答以及高级功能介绍。
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {docCards.map((card, index) => (
              <a
                key={index}
                href={card.link}
                className="group flex p-6 border border-gray-100 rounded-xl hover:border-biliBlue/30 hover:shadow-md transition-all duration-300 bg-gray-50 hover:bg-white"
              >
                <div className="bg-white p-3 rounded-lg shadow-sm mr-4 group-hover:shadow-md group-hover:bg-biliLightBlue/20 transition-all">
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-800 group-hover:text-biliBlue transition-colors">{card.title}</h3>
                  <p className="text-gray-600 text-sm">{card.description}</p>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 text-biliBlue transition-opacity" />
              </a>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 mb-8 transition-shadow hover:shadow-md" id="usage-guide">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-biliBlue" />
            使用指南
          </h2>
          <div className="border-l-4 border-biliBlue pl-4 py-2 bg-biliLightBlue/10 mb-6 rounded-r-md">
            <p className="text-gray-700">本指南将帮助您快速上手 Bilibili 无限历史记录扩展，掌握基本功能和操作。</p>
          </div>

          <h3 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
            <Download className="h-5 w-5 mr-2 text-biliPink" />
            安装扩展
          </h3>
          <p className="text-gray-600 mb-4">您可以通过以下方式安装我们的扩展：</p>
          <ol className="list-decimal list-inside space-y-2 mb-6 text-gray-600 ml-2">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>访问 Chrome 网上应用店或 Edge 扩展商店</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>搜索"Bilibili 无限历史记录"</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>点击"添加到 Chrome"或"获取"按钮</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>完成安装后，您将在浏览器右上角看到扩展图标</span>
            </li>
          </ol>

          <h3 className="text-xl font-semibold mb-3 text-gray-800 flex items-center">
            <Search className="h-5 w-5 mr-2 text-biliPink" />
            基本使用
          </h3>
          <p className="text-gray-600 mb-4">安装完成后，扩展将自动开始工作：</p>
          <ul className="space-y-2 mb-6 text-gray-600 ml-2">
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 text-biliBlue mt-1 mr-2 flex-shrink-0" />
              <span>登录 Bilibili 网站后，扩展会自动记录您的观看历史</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 text-biliBlue mt-1 mr-2 flex-shrink-0" />
              <span>点击扩展图标打开历史记录面板</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 text-biliBlue mt-1 mr-2 flex-shrink-0" />
              <span>在面板中，您可以查看、搜索和管理所有历史记录</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 text-biliBlue mt-1 mr-2 flex-shrink-0" />
              <span>历史记录会按时间顺序排列，最新的记录显示在最前面</span>
            </li>
          </ul>

          <div className="bg-biliGray p-5 rounded-lg mb-6 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-biliPink" />
              提示
            </h4>
            <p className="text-gray-600">
              首次使用时，扩展会自动同步您的历史记录。根据您的历史记录数量，这可能需要几分钟时间。同步完成后，您可以看到所有历史记录。
            </p>
          </div>

          <Button className="bg-biliBlue hover:bg-biliDarkBlue text-white shadow-md hover:shadow-lg transition-all">
            <Download className="mr-2 h-4 w-4" />
            下载完整用户手册 (PDF)
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 transition-shadow hover:shadow-md" id="faq">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
            <HelpCircle className="h-6 w-6 mr-2 text-biliBlue" />
            常见问题
          </h2>
          <div className="border-l-4 border-biliBlue pl-4 py-2 bg-biliLightBlue/10 mb-6 rounded-r-md">
            <p className="text-gray-700">以下是用户最常问的问题及解答，希望能帮助您解决使用中的疑惑。</p>
          </div>

          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="border border-gray-100 rounded-lg p-4 hover:border-biliBlue/30 hover:shadow-sm transition-all">
                <h3 className="font-semibold text-lg mb-2 text-gray-800 flex items-center">
                  <span className="flex items-center justify-center bg-biliLightBlue/20 text-biliBlue w-7 h-7 rounded-full mr-2 text-sm font-bold">Q</span>
                  {item.question}
                </h3>
                <p className="text-gray-600 ml-9">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="bg-[#1c2022] text-white py-8 px-6 mt-12">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" className="h-6 w-6 mr-2 text-biliBlue" fill="currentColor">
                <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906L17.813 4.653zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773H5.333zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z" />
              </svg>
              <h2 className="text-xl font-bold">Bilibili 无限历史记录</h2>
            </div>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">让每一次B站观看都被永久珍藏，打造你的专属时光机。</p>
            <div className="text-sm text-gray-500">© 2024 Bilibili 无限历史记录 | 非官方工具，与哔哩哔哩官方无关</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
