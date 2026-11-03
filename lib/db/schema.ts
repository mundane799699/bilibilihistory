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
  numeric,
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
    userViewAtIdIdx: index("bilibili_history_user_view_at_id_idx").on(
      table.user_id,
      table.view_at.desc().nullsLast(),
      table.id.desc()
    ),
  })
);

// Auth.js user table
export const users = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

// VIP会员表
export const memberships = pgTable(
  "memberships",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    email: text("email").notNull().unique(),
    expiresAt: timestamp("expires_at"),
    plan: text("plan"), // 'monthly', 'yearly', 'lifetime'
    status: text("status").notNull().default("active"), // 'active', 'expired', 'cancelled'
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("user_id_idx").on(table.userId),
    emailIdx: index("email_idx").on(table.email),
  })
);

// 支付订单：一次购买一条，成功后由 markOrderPaid 幂等地开通/续期会员
export const orders = pgTable(
  "orders",
  {
    outTradeNo: text("out_trade_no").primaryKey(),
    userId: text("user_id").notNull(),
    // 下单时记下邮箱：本地开发库里可能没有 user 行，开通会员时要用它补一条占位记录
    userEmail: text("user_email"),
    planId: text("plan_id").notNull(), // 'month' | 'year'
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    days: integer("days").notNull(),
    status: text("status").notNull().default("pending"), // pending | paid | closed
    channel: text("channel").notNull().default("wxpay"),
    qrUrl: text("qr_url"),
    payNo: text("pay_no"),
    // 带时区：下单时间要参与「是否已过模拟支付等待期」的判断，
    // 用 timestamp without time zone 会因本地时区与数据库时区不同而算错。
    checkedAt: timestamp("checked_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index("orders_user_idx").on(table.userId),
    statusIdx: index("orders_status_idx").on(table.status),
  })
);

// better-auth 的 account 表（用于密码等凭证存储）
export const accounts = pgTable("account", {
  id: text("id").notNull().primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

// 导出类型
export type BilibiliHistory = typeof bilibiliHistory.$inferSelect;
export type NewBilibiliHistory = typeof bilibiliHistory.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type Account = typeof accounts.$inferSelect;
