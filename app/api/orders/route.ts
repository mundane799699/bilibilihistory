import { NextRequest, NextResponse } from "next/server";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { orders, users } from "@/lib/db/schema";
import { reconcileOrder } from "@/lib/pay/service";

export const dynamic = "force-dynamic";

/** 订单列表（后台）：支持按订单号 / 邮箱搜索，按状态过滤，分页 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") ?? 20) || 20)
    );
    const search = (searchParams.get("search") ?? "").trim();
    const status = (searchParams.get("status") ?? "").trim();

    const filters = [];
    if (status && ["pending", "paid", "closed"].includes(status)) {
      filters.push(eq(orders.status, status));
    }
    if (search) {
      const like = `%${search}%`;
      filters.push(
        or(
          ilike(orders.outTradeNo, like),
          ilike(orders.userEmail, like),
          ilike(users.email, like)
        )
      );
    }
    const where = filters.length ? and(...filters) : undefined;

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          outTradeNo: orders.outTradeNo,
          userId: orders.userId,
          email: users.email,
          orderEmail: orders.userEmail,
          planId: orders.planId,
          amount: orders.amount,
          days: orders.days,
          status: orders.status,
          channel: orders.channel,
          payNo: orders.payNo,
          createdAt: orders.createdAt,
          paidAt: orders.paidAt,
        })
        .from(orders)
        .leftJoin(users, eq(users.id, orders.userId))
        .where(where)
        .orderBy(desc(orders.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ value: count() })
        .from(orders)
        .leftJoin(users, eq(users.id, orders.userId))
        .where(where),
    ]);

    const totalCount = Number(totalRows[0]?.value ?? 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return NextResponse.json({
      data: rows.map((r) => ({ ...r, email: r.email ?? r.orderEmail ?? "" })),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("获取订单列表失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

/** 手动核对单笔订单 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const outTradeNo = String(body?.out_trade_no ?? "").trim();
    if (!outTradeNo) {
      return NextResponse.json({ error: "缺少订单号" }, { status: 400 });
    }
    const result = await reconcileOrder(outTradeNo);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("核对订单失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}