export default function HistoryPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">历史记录</h1>
        <p className="text-gray-600">查看您的观看历史记录</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">最近观看</h2>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-medium">V1</span>
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-gray-900">示例视频 1</h3>
              <p className="text-sm text-gray-500">2小时前观看</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-medium">V2</span>
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-gray-900">示例视频 2</h3>
              <p className="text-sm text-gray-500">1天前观看</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
