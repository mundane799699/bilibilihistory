import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

// B站历史记录表
export const bilibiliHistory = pgTable(
  "bilibili_history",
  {
    // 联合主键的组成部分
    id: bigint("id", { mode: "number" }).notNull(), // B站的历史记录ID，作为联合主键之一
    user_id: text("user_id").notNull(), // 用户ID，作为联合主键之一

    // B站历史记录的原始数据
    business: text("business"), // 业务类型，如"archive"
    bvid: text("bvid"), // B站视频ID
    cid: bigint("cid", { mode: "number" }), // 视频cid
    title: text("title"), // 视频标题
    tag_name: text("tag_name"), // 标签名称
    cover: text("cover"), // 封面图URL
    view_at: bigint("view_at", { mode: "number" }), // 观看时间戳
    uri: text("uri"), // URI
    author_name: text("author_name"), // 作者名称
    author_mid: bigint("author_mid", { mode: "number" }), // 作者ID
    timestamp: bigint("timestamp", { mode: "number" }), // 时间戳

    // 我们自己的字段
    created_at: timestamp("created_at").notNull().defaultNow(), // 记录创建时间
    updated_at: timestamp("updated_at").notNull().defaultNow(), // 记录更新时间
  },
  (table) => ({
    // 联合主键：id + user_id
    pk: primaryKey({ columns: [table.id, table.user_id] }),
    // 索引
    titleIdx: index("title_idx").on(table.title),
    viewAtIdx: index("view_at_idx").on(table.view_at),
    authorNameIdx: index("author_name_idx").on(table.author_name),
    tagNameIdx: index("tag_name_idx").on(table.tag_name),
  })
);

// 导出类型
export type BilibiliHistory = typeof bilibiliHistory.$inferSelect;
export type NewBilibiliHistory = typeof bilibiliHistory.$inferInsert;
