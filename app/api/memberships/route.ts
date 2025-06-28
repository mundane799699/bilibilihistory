import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getMemberships,
  getMembershipsCount,
  createMembership,
  findUserByEmail,
} from "@/lib/db/membership_queries";
import { headers } from "next/headers";
import { z } from "zod";

const membershipSchema = z.object({
  email: z.string().email("无效的邮箱地址"),
  plan: z.string().optional(),
  status: z.enum(["active", "expired", "cancelled"]).default("active"),
  expiresAt: z.string().datetime().optional().nullable(),
});

// 获取会员列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    // TODO: 增加管理员角色校验
    // if (session.user.role !== 'admin') {
    //   return NextResponse.json({ error: "无权限访问" }, { status: 403 });
    // }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    const [members, totalCount] = await Promise.all([
      getMemberships({ page, pageSize, search, status }),
      getMembershipsCount({ search, status }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      data: members,
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
    console.error("获取会员列表失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// 创建新会员
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    // TODO: 增加管理员角色校验

    const body = await request.json();
    const validation = membershipSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "数据校验失败", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email, plan, status, expiresAt } = validation.data;

    // 1. 根据email查找用户
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "该邮箱对应的用户不存在" },
        { status: 404 }
      );
    }

    // 2. 使用找到的userId创建会员
    const newMembership = await createMembership({
      userId: user.id,
      email,
      plan,
      status,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    return NextResponse.json(newMembership, { status: 201 });
  } catch (error) {
    console.error("创建会员失败:", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      // unique_violation
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 400 });
    }
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
