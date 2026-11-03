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
      await deleteHistoryItem(item.id);
      onDelete?.();
    } catch (error) {
      console.error("删除历史记录失败:", error);
      alert("删除失败，请重试");
    } finally {
      setIsDeleting(false);
    }
  };

  const typeTag = getTypeTag(item.business);

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-white shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift">
      <a
        href={getContentUrl(item)}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-inherit no-underline"
      >
        <div className="relative">
          <img
            src={`${item.cover}@760w_428h_1c.avif`}
            alt={item.title}
            className="h-36 w-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          {typeTag !== "视频" && (
            <span className="absolute bottom-2 right-2 rounded-md bg-primary/90 px-1.5 py-0.5 text-[11px] font-medium text-primary-foreground backdrop-blur">
              {typeTag}
            </span>
          )}
          <button
            className={`absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/70 group-hover:opacity-100 ${
              isDeleting ? "cursor-not-allowed opacity-50" : ""
            }`}
            onClick={handleDelete}
            disabled={isDeleting}
            title={isDeleting ? "删除中…" : "删除这条记录"}
            aria-label="删除这条记录"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-3">
          <h3 className="line-clamp-2 h-10 text-[13.5px] leading-[1.45] text-foreground">
            {item.title}
          </h3>
          <div className="mt-2 flex items-center justify-between gap-2 text-[11.5px] text-muted-foreground">
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(
                  `https://space.bilibili.com/${item.author_mid}`,
                  "_blank"
                );
              }}
              className="cursor-pointer truncate transition-colors hover:text-primary"
            >
              {item.author_name}
            </span>
            <span className="shrink-0 tabular-nums">
              {new Date(item.view_at * 1000).toLocaleDateString("zh-CN", {
                month: "2-digit",
                day: "2-digit",
              })}
            </span>
          </div>
        </div>
      </a>
    </div>
  );
};