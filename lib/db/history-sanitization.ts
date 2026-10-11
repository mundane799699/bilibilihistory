import type { NewBilibiliHistory } from "./schema";

const historyTextFields = [
  "business",
  "bvid",
  "title",
  "tag_name",
  "cover",
  "uri",
  "author_name",
] as const;

export function sanitizeHistoryRecord(
  record: NewBilibiliHistory
): NewBilibiliHistory {
  const sanitized = { ...record };

  for (const field of historyTextFields) {
    const value = sanitized[field];
    if (typeof value === "string") {
      // PostgreSQL text cannot contain NUL, even though JSON accepts it.
      sanitized[field] = value.replace(/\u0000/g, "");
    }
  }

  return sanitized;
}
