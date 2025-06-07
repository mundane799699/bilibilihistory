import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getUserHistory,
  upsertHistoryRecord,
  upsertHistoryRecords,
} from "@/lib/db/queries";
import { headers } from "next/headers";

// 获取历史记录
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const history = await getUserHistory(session.user.id, limit);

    return NextResponse.json({ history });
  } catch (error) {
    console.error("获取历史记录失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// 添加或更新历史记录 - 支持单条和批量upsert
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();

    // 检查是否为批量上传
    const isBatch = Array.isArray(body);
    const records = isBatch ? body : [body];

    // 验证每条记录的必需字段
    for (const record of records) {
      const { id, business, bvid, cid, title, viewTime, timestamp } = record;

      if (
        !id ||
        !business ||
        !bvid ||
        !cid ||
        !title ||
        !viewTime ||
        !timestamp
      ) {
        return NextResponse.json(
          {
            error: `记录缺少必要参数: ${JSON.stringify(record)}`,
          },
          { status: 400 }
        );
      }
    }

    // 准备要upsert的数据
    const recordsToUpsert = records.map((record) => ({
      ...record,
      userId: session.user.id,
    }));

    // 执行批量upsert
    const upsertedRecords = isBatch
      ? await upsertHistoryRecords(recordsToUpsert)
      : await upsertHistoryRecord(recordsToUpsert[0]);

    const resultRecords = Array.isArray(upsertedRecords)
      ? upsertedRecords
      : [upsertedRecords];

    return NextResponse.json({
      success: true,
      count: resultRecords.length,
      records: resultRecords,
      message: isBatch
        ? `成功处理 ${resultRecords.length} 条历史记录（插入或更新）`
        : `成功处理 1 条历史记录（插入或更新）`,
    });
  } catch (error) {
    console.error("处理历史记录失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
