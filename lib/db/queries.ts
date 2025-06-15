import { db } from "./index";
import {
  bilibiliHistory,
  type NewBilibiliHistory,
  type BilibiliHistory,
} from "./schema";
import { eq, desc, and, like, or, sql } from "drizzle-orm";

// 获取用户的观看历史
export async function getUserHistory(user_id: string, limit = 50) {
  return await db
    .select()
    .from(bilibiliHistory)
    .where(eq(bilibiliHistory.user_id, user_id))
    .orderBy(desc(bilibiliHistory.view_at))
    .limit(limit);
}

// 获取用户的观看历史（分页版本）
export async function getUserHistoryWithPagination(
  userId: string,
  page: number = 1,
  pageSize: number = 50
) {
  const offset = (page - 1) * pageSize;
  
  return await db
    .select()
    .from(bilibiliHistory)
    .where(eq(bilibiliHistory.user_id, userId))
    .orderBy(desc(bilibiliHistory.view_at))
    .limit(pageSize)
    .offset(offset);
}

// 添加观看历史记录
export async function addHistoryRecord(data: NewBilibiliHistory) {
  return await db
    .insert(bilibiliHistory)
    .values({
      ...data,
      updated_at: new Date(),
    })
    .returning();
}

// 批量添加历史记录
export async function addHistoryRecords(records: NewBilibiliHistory[]) {
  return await db
    .insert(bilibiliHistory)
    .values(
      records.map((record) => ({
        ...record,
        updated_at: new Date(),
      }))
    )
    .returning();
}

// Upsert单条历史记录（插入或更新）
export async function upsertHistoryRecord(data: NewBilibiliHistory) {
  return await db
    .insert(bilibiliHistory)
    .values({
      ...data,
      updated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: [bilibiliHistory.id, bilibiliHistory.user_id],
      set: {
        business: sql.raw(`excluded.business`),
        bvid: sql.raw(`excluded.bvid`),
        cid: sql.raw(`excluded.cid`),
        title: sql.raw(`excluded.title`),
        tag_name: sql.raw(`excluded.tag_name`),
        cover: sql.raw(`excluded.cover`),
        view_at: sql.raw(`excluded.view_at`),
        uri: sql.raw(`excluded.uri`),
        author_name: sql.raw(`excluded.author_name`),
        author_mid: sql.raw(`excluded.author_mid`),
        timestamp: sql.raw(`excluded.timestamp`),
        updated_at: new Date(),
      },
    })
    .returning();
}

// 批量Upsert历史记录（插入或更新）
export async function upsertHistoryRecords(records: NewBilibiliHistory[]) {
  if (records.length === 0) return [];

  return await db
    .insert(bilibiliHistory)
    .values(
      records.map((record) => ({
        ...record,
        updatedAt: new Date(),
      }))
    )
    .onConflictDoUpdate({
      target: [bilibiliHistory.id, bilibiliHistory.user_id],
      set: {
        business: sql.raw(`excluded.business`),
        bvid: sql.raw(`excluded.bvid`),
        cid: sql.raw(`excluded.cid`),
        title: sql.raw(`excluded.title`),
        tag_name: sql.raw(`excluded.tag_name`),
        cover: sql.raw(`excluded.cover`),
        view_at: sql.raw(`excluded.view_at`),
        uri: sql.raw(`excluded.uri`),
        author_name: sql.raw(`excluded.author_name`),
        author_mid: sql.raw(`excluded.author_mid`),
        timestamp: sql.raw(`excluded.timestamp`),
        updated_at: new Date(),
      },
    })
    .returning();
}

// 检查记录是否已存在（使用联合主键）
export async function checkRecordExists(user_id: string, id: number) {
  const result = await db
    .select({ id: bilibiliHistory.id })
    .from(bilibiliHistory)
    .where(and(eq(bilibiliHistory.user_id, user_id), eq(bilibiliHistory.id, id)))
    .limit(1);

  return result.length > 0;
}

// 删除历史记录（使用联合主键）
export async function deleteHistoryRecord(user_id: string, id: number) {
  return await db
    .delete(bilibiliHistory)
    .where(and(eq(bilibiliHistory.id, id), eq(bilibiliHistory.user_id, user_id)));
}

// 更新历史记录（使用联合主键）
export async function updateHistoryRecord(
  user_id: string,
  id: number,
  data: Partial<NewBilibiliHistory>
) {
  return await db
    .update(bilibiliHistory)
    .set({
      ...data,
      updated_at: new Date(),
    })
    .where(and(eq(bilibiliHistory.user_id, user_id), eq(bilibiliHistory.id, id)))
    .returning();
}

// 搜索历史记录
export async function searchHistory(userId: string, searchTerm: string) {
  return await db
    .select()
    .from(bilibiliHistory)
    .where(
      and(
        eq(bilibiliHistory.user_id, userId),
        or(
          like(bilibiliHistory.title, `%${searchTerm}%`),
          like(bilibiliHistory.author_name, `%${searchTerm}%`),
          like(bilibiliHistory.tag_name, `%${searchTerm}%`)
        )
      )
    )
    .orderBy(desc(bilibiliHistory.view_at));
}

// 获取用户统计信息
export async function getUserStats(user_id: string) {
  const totalVideos = await db
    .select({ count: sql<number>`count(*)` })
    .from(bilibiliHistory)
    .where(eq(bilibiliHistory.user_id, user_id));

  const uniqueAuthors = await db
    .select({ count: sql<number>`count(distinct author_name)` })
    .from(bilibiliHistory)
    .where(eq(bilibiliHistory.user_id, user_id));

  const latestRecord = await db
    .select({ view_at: bilibiliHistory.view_at })
    .from(bilibiliHistory)
    .where(eq(bilibiliHistory.user_id, user_id))
    .orderBy(desc(bilibiliHistory.view_at))
    .limit(1);

  return {
    totalVideos: totalVideos[0]?.count || 0,
    uniqueAuthors: uniqueAuthors[0]?.count || 0,
    latestViewAt: latestRecord[0]?.view_at || 0,
  };
}

// 按标签分组统计
export async function getTagStats(user_id: string) {
  return await db
    .select({
      tag_name: bilibiliHistory.tag_name,
      count: sql<number>`count(*)`,
    })
    .from(bilibiliHistory)
    .where(eq(bilibiliHistory.user_id, user_id))
    .groupBy(bilibiliHistory.tag_name)
    .orderBy(desc(sql`count(*)`));
}

// 获取用户历史记录总数
export async function getUserHistoryCount(user_id: string) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(bilibiliHistory)
    .where(eq(bilibiliHistory.user_id, user_id));

  return result[0]?.count || 0;
}
