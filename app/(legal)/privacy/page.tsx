import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私权政策 - Bilibili 无限历史记录",
  description: "Bilibili 无限历史记录 Chrome 扩展的隐私权政策",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold text-gray-800 hover:text-[#00a1d6] transition-colors"
          >
            Bilibili 无限历史记录
          </Link>
          <Link
            href="/"
            className="text-sm text-[#00a1d6] hover:underline"
          >
            ← 返回首页
          </Link>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container mx-auto max-w-4xl px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-12">
          {/* 标题 */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
              隐私权政策
            </h1>
            <p className="text-gray-500 text-sm">
              最后更新日期：2025 年 2 月 14 日
            </p>
          </div>

          {/* 正文内容 */}
          <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
            {/* 引言 */}
            <section>
              <p>
                感谢您使用{" "}
                <strong className="text-gray-800">Bilibili 无限历史记录</strong>
                （以下简称"本扩展"）。本扩展是一款 Chrome 浏览器扩展程序，旨在帮助用户突破 Bilibili（哔哩哔哩）官方历史记录上限，永久保存观看历史。我们非常重视您的隐私，本隐私权政策将向您说明我们如何收集、使用、存储和保护您的信息。
              </p>
            </section>

            {/* 信息收集 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                一、我们收集的信息
              </h2>
              <p className="mb-3">
                本扩展在运行过程中可能会收集或处理以下类型的信息：
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
                1. Bilibili 观看历史数据
              </h3>
              <p>
                本扩展的核心功能是自动同步和保存您的 Bilibili 观看历史记录，包括但不限于：视频标题、视频封面、UP 主信息、观看时间、视频 BV 号等。这些数据直接来源于 Bilibili 官方接口，仅用于为您提供历史记录管理服务。
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
                2. 账户信息
              </h3>
              <p>
                如果您选择注册本扩展的账户以使用云同步等高级功能，我们可能会收集您的电子邮件地址和您设置的用户名，用于账户管理和身份验证。
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
                3. 我们不收集的信息
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>我们<strong>不会</strong>收集您的 Bilibili 账号密码</li>
                <li>我们<strong>不会</strong>收集您的浏览器书签、其他网站浏览记录</li>
                <li>我们<strong>不会</strong>收集您的个人身份信息（如姓名、电话号码、身份证号等）</li>
                <li>我们<strong>不会</strong>追踪您在其他网站上的行为</li>
              </ul>
            </section>

            {/* 数据使用 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                二、我们如何使用您的信息
              </h2>
              <p className="mb-3">我们收集的信息仅用于以下目的：</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>提供核心服务：</strong>保存、展示和管理您的 Bilibili 观看历史记录
                </li>
                <li>
                  <strong>搜索功能：</strong>支持您通过关键词在历史记录中搜索视频
                </li>
                <li>
                  <strong>数据导出：</strong>支持将历史记录导出为 CSV 格式进行备份
                </li>
                <li>
                  <strong>云同步（仅限付费会员）：</strong>将历史记录同步到服务器，实现多设备访问
                </li>
                <li>
                  <strong>产品改进：</strong>用于分析和改善扩展的性能和用户体验
                </li>
              </ul>
            </section>

            {/* 数据存储 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                三、数据存储与安全
              </h2>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
                1. 本地存储
              </h3>
              <p>
                对于免费用户，您的所有观看历史数据均存储在您的浏览器本地（使用 Chrome 浏览器提供的本地存储 API）。数据完全保存在您的设备上，不会上传到任何外部服务器。
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
                2. 服务器存储
              </h3>
              <p>
                对于选择使用云同步功能的付费会员，您的历史记录数据将加密传输并存储在我们的安全服务器上。我们采取合理的技术和管理措施来保护您的数据安全，包括但不限于 HTTPS 加密传输、数据库访问控制等。
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">
                3. 数据保留
              </h3>
              <p>
                本地存储的数据将持续保留，直到您手动清除或卸载扩展。服务器上的数据将在您的账户有效期内保留，您可以随时要求我们删除您的服务器端数据。
              </p>
            </section>

            {/* 数据共享 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                四、数据共享与披露
              </h2>
              <p className="mb-3">
                我们承诺<strong>不会出售、出租或交易</strong>您的个人数据。仅在以下情况下，我们可能会披露您的信息：
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>获得您的明确同意</li>
                <li>根据法律法规的要求、法律程序或政府强制性要求</li>
                <li>为保护本扩展、用户或公众的权利、财产或安全所必需</li>
              </ul>
            </section>

            {/* 权限说明 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                五、浏览器权限说明
              </h2>
              <p className="mb-3">
                本扩展需要以下 Chrome 浏览器权限才能正常运行：
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>访问 Bilibili 网站数据：</strong>用于读取您在 Bilibili 上的观看历史记录
                </li>
                <li>
                  <strong>存储权限：</strong>用于在本地保存您的历史记录数据
                </li>
                <li>
                  <strong>网络请求权限：</strong>用于从 Bilibili 获取历史记录数据，以及（仅限付费用户）将数据同步到云端
                </li>
              </ul>
              <p className="mt-3">
                我们仅请求扩展功能所必需的最小权限，不会请求任何与核心功能无关的额外权限。
              </p>
            </section>

            {/* 用户权利 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                六、您的权利
              </h2>
              <p className="mb-3">您对自己的数据拥有以下权利：</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>查看权：</strong>您可以随时在扩展中查看您保存的所有历史记录
                </li>
                <li>
                  <strong>导出权：</strong>您可以随时将您的数据导出为 CSV 文件
                </li>
                <li>
                  <strong>删除权：</strong>您可以随时删除本地或服务器上的历史记录数据
                </li>
                <li>
                  <strong>撤回同意权：</strong>您可以随时停止使用扩展或卸载扩展来撤回数据收集的同意
                </li>
              </ul>
            </section>

            {/* 未成年人保护 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                七、未成年人保护
              </h2>
              <p>
                本扩展不面向 13 岁以下的儿童。我们不会故意收集 13 岁以下儿童的个人信息。如果您发现我们无意中收集了儿童的信息，请联系我们，我们会尽快删除相关数据。
              </p>
            </section>

            {/* 政策变更 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                八、隐私政策的变更
              </h2>
              <p>
                我们可能会不时更新本隐私权政策。当我们进行重大更改时，会通过扩展内通知或在本页面发布更新来告知您。我们建议您定期查看本页面，以了解最新的隐私保护措施。
              </p>
            </section>

            {/* 联系方式 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                九、联系我们
              </h2>
              <p>
                如果您对本隐私权政策有任何疑问、意见或请求，欢迎通过以下方式联系我们：
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
                <li>
                  通过本网站首页扫码加入微信用户群联系我们
                </li>
                <li>
                  在 Chrome 应用商店的扩展页面留言反馈
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-800 text-white py-8 px-6 mt-12">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-lg font-bold mb-2">Bilibili 无限历史记录</h2>
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} Bilibili 无限历史记录
          </div>
        </div>
      </footer>
    </div>
  );
}
