// API 工具函数

// 删除历史记录
export async function deleteHistoryItem(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`/api/history?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "删除失败");
    }

    return data;
  } catch (error) {
    console.error("删除历史记录失败:", error);
    throw error;
  }
}
