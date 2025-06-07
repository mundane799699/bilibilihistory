import { db } from "./index";
import {
  bilibiliHistory,
  type NewBilibiliHistory,
  type BilibiliHistory,
} from "./schema";
import { eq, desc, and, like, or, sql } from "drizzle-orm";

// 获取用户的观看历史
export async function getUserHistory(userId: string, limit = 50) {
  return await db
    .select()
    .from(bilibiliHistory)
    .where(eq(bilibiliHistory.userId, userId))
    .orderBy(desc(bilibiliHistory.viewTime))
    .limit(limit);
}

// 添加观看历史记录
export async function addHistoryRecord(data: NewBilibiliHistory) {
  return await db
    .insert(bilibiliHistory)
    .values({
      ...data,
      updatedAt: new Date(),
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
        updatedAt: new Date(),
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
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [bilibiliHistory.id, bilibiliHistory.userId],
      set: {
        business: sql.raw(`excluded.business`),
        bvid: sql.raw(`excluded.bvid`),
        cid: sql.raw(`excluded.cid`),
        title: sql.raw(`excluded.title`),
        tagName: sql.raw(`excluded.tag_name`),
        cover: sql.raw(`excluded.cover`),
        viewTime: sql.raw(`excluded.view_time`),
        uri: sql.raw(`excluded.uri`),
        authorName: sql.raw(`excluded.author_name`),
        authorMid: sql.raw(`excluded.author_mid`),
        timestamp: sql.raw(`excluded.timestamp`),
        updatedAt: new Date(),
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
      target: [bilibiliHistory.id, bilibiliHistory.userId],
      set: {
        business: sql.raw(`excluded.business`),
        bvid: sql.raw(`excluded.bvid`),
        cid: sql.raw(`excluded.cid`),
        title: sql.raw(`excluded.title`),
        tagName: sql.raw(`excluded.tag_name`),
        cover: sql.raw(`excluded.cover`),
        viewTime: sql.raw(`excluded.view_time`),
        uri: sql.raw(`excluded.uri`),
        authorName: sql.raw(`excluded.author_name`),
        authorMid: sql.raw(`excluded.author_mid`),
        timestamp: sql.raw(`excluded.timestamp`),
        updatedAt: new Date(),
      },
    })
    .returning();
}

// 检查记录是否已存在（使用联合主键）
export async function checkRecordExists(userId: string, id: number) {
  const result = await db
    .select({ id: bilibiliHistory.id })
    .from(bilibiliHistory)
    .where(and(eq(bilibiliHistory.userId, userId), eq(bilibiliHistory.id, id)))
    .limit(1);

  return result.length > 0;
}

// 删除历史记录（使用联合主键）
export async function deleteHistoryRecord(userId: string, id: number) {
  return await db
    .delete(bilibiliHistory)
    .where(and(eq(bilibiliHistory.id, id), eq(bilibiliHistory.userId, userId)));
}

// 更新历史记录（使用联合主键）
export async function updateHistoryRecord(
  userId: string,
  id: number,
  data: Partial<NewBilibiliHistory>
) {
  return await db
    .update(bilibiliHistory)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(bilibiliHistory.userId, userId), eq(bilibiliHistory.id, id)))
    .returning();
}

// 搜索历史记录
export async function searchHistory(userId: string, searchTerm: string) {
  return await db
    .select()
    .from(bilibiliHistory)
    .where(
      and(
        eq(bilibiliHistory.userId, userId),
        or(
          like(bilibiliHistory.title, `%${searchTerm}%`),
          like(bilibiliHistory.authorName, `%${searchTerm}%`),
          like(bilibiliHistory.tagName, `%${searchTerm}%`)
        )
      )
    )
    .orderBy(desc(bilibiliHistory.viewTime));
}

// 获取用户统计信息
export async function getUserStats(userId: string) {
  const totalVideos = await db
    .select({ count: sql<number>`count(*)` })
    .from(bilibiliHistory)
    .where(eq(bilibiliHistory.userId, userId));

  const uniqueAuthors = await db
    .select({ count: sql<number>`count(distinct author_name)` })
    .from(bilibiliHistory)
    .where(eq(bilibiliHistory.userId, userId));

  const latestRecord = await db
    .select({ viewTime: bilibiliHistory.viewTime })
    .from(bilibiliHistory)
    .where(eq(bilibiliHistory.userId, userId))
    .orderBy(desc(bilibiliHistory.viewTime))
    .limit(1);

  return {
    totalVideos: totalVideos[0]?.count || 0,
    uniqueAuthors: uniqueAuthors[0]?.count || 0,
    latestViewTime: latestRecord[0]?.viewTime || 0,
  };
}

// 按标签分组统计
export async function getTagStats(userId: string) {
  return await db
    .select({
      tagName: bilibiliHistory.tagName,
      count: sql<number>`count(*)`,
    })
    .from(bilibiliHistory)
    .where(eq(bilibiliHistory.userId, userId))
    .groupBy(bilibiliHistory.tagName)
    .orderBy(desc(sql`count(*)`));
}
