import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  primaryKey,
} from "drizzle-orm/pg-core";

// B站历史记录表
export const bilibiliHistory = pgTable(
  "bilibili_history",
  {
    // 联合主键的组成部分
    id: bigint("id", { mode: "number" }).notNull(), // B站的历史记录ID，作为联合主键之一
    userId: text("user_id").notNull(), // 用户ID，作为联合主键之一

    // B站历史记录的原始数据
    business: text("business"), // 业务类型，如"archive"
    bvid: text("bvid"), // B站视频ID
    cid: bigint("cid", { mode: "number" }), // 视频cid
    title: text("title"), // 视频标题
    tagName: text("tag_name"), // 标签名称
    cover: text("cover"), // 封面图URL
    viewTime: bigint("view_time", { mode: "number" }), // 观看时间戳
    uri: text("uri"), // URI
    authorName: text("author_name"), // 作者名称
    authorMid: bigint("author_mid", { mode: "number" }), // 作者ID
    timestamp: bigint("timestamp", { mode: "number" }), // 时间戳

    // 我们自己的字段
    createdAt: timestamp("created_at").notNull().defaultNow(), // 记录创建时间
    updatedAt: timestamp("updated_at").notNull().defaultNow(), // 记录更新时间
  },
  (table) => ({
    // 联合主键：id + userId
    pk: primaryKey({ columns: [table.id, table.userId] }),
  })
);

// 导出类型
export type BilibiliHistory = typeof bilibiliHistory.$inferSelect;
export type NewBilibiliHistory = typeof bilibiliHistory.$inferInsert;
