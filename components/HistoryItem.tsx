import { HistoryItem as HistoryItemType } from "@/utils/types";
import { getContentUrl } from "@/utils/common";
import { Trash2 } from "lucide-react";
import { getTypeTag } from "@/utils/common";
import { deleteHistoryItem } from "@/lib/api";
import { useState } from "react";

interface HistoryItemProps {
  item: HistoryItemType;
  onDelete?: () => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ item, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDeleting) return;

    try {
      setIsDeleting(true);

      // 调用api删除历史记录
      await deleteHistoryItem(item.id);

      // 删除成功，调用父组件的回调函数
      onDelete?.();
    } catch (error) {
      console.error("删除历史记录失败:", error);
      alert("删除失败，请重试");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <a
        href={getContentUrl(item)}
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline text-inherit"
      >
        <div>
          <div className="relative">
            <img
              src={`${item.cover}@760w_428h_1c.avif`}
              alt={item.title}
              className="w-full h-40 object-cover"
              referrerPolicy="no-referrer"
            />
            {getTypeTag(item.business) !== "视频" && (
              <span className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs text-white bg-[#fb7299]">
                {getTypeTag(item.business)}
              </span>
            )}
          </div>
          <div className="p-2.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="m-0 text-sm leading-[1.4] h-10 overflow-hidden line-clamp-2 flex-1">
                {item.title}
              </h3>
              <button
                className={`p-1 hover:bg-gray-100 rounded-full transition-colors ${
                  isDeleting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleDelete}
                disabled={isDeleting}
                title={isDeleting ? "删除中..." : "删除历史记录"}
              >
                <Trash2
                  className={`w-4 h-4 ${
                    isDeleting ? "text-gray-300" : "text-gray-500"
                  }`}
                />
              </button>
            </div>
            <div className="flex justify-between items-center text-gray-500 text-xs mt-1">
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(
                    `https://space.bilibili.com/${item.author_mid}`,
                    "_blank"
                  );
                }}
                className="hover:text-[#fb7299] transition-colors cursor-pointer"
              >
                {item.author_name}
              </span>
              <span>{new Date(item.view_at * 1000).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};
