import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getMembershipById,
  updateMembership,
  deleteMembership,
} from "@/lib/db/membership_queries";
import { headers } from "next/headers";
import { z } from "zod";

const updateMembershipSchema = z.object({
  email: z.string().email("无效的邮箱地址").optional(),
  plan: z.string().optional(),
  status: z.enum(["active", "expired", "cancelled"]).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

// 获取单个会员信息
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // const session = await auth.api.getSession({ headers: await headers() });
    // if (!session) {
    //   return NextResponse.json({ error: "未授权" }, { status: 401 });
    // }
    // TODO: 增加管理员角色校验

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 });
    }

    const membership = await getMembershipById(id);
    if (!membership) {
      return NextResponse.json({ error: "会员记录未找到" }, { status: 404 });
    }

    return NextResponse.json(membership);
  } catch (error) {
    console.error(`获取会员(id: ${params.id})失败:`, error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// 更新会员信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // const session = await auth.api.getSession({ headers: await headers() });
    // if (!session) {
    //   return NextResponse.json({ error: "未授权" }, { status: 401 });
    // }
    // TODO: 增加管理员角色校验

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 });
    }

    const body = await request.json();
    const validation = updateMembershipSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "数据校验失败", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updatedMembership = await updateMembership(id, {
      ...validation.data,
      expiresAt: validation.data.expiresAt
        ? new Date(validation.data.expiresAt)
        : undefined,
    });

    if (!updatedMembership || updatedMembership.length === 0) {
      return NextResponse.json({ error: "会员记录未找到" }, { status: 404 });
    }

    return NextResponse.json(updatedMembership[0]);
  } catch (error) {
    console.error(`更新会员(id: ${params.id})失败:`, error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json({ error: "该邮箱已被使用" }, { status: 400 });
    }
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

// 删除会员
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // const session = await auth.api.getSession({ headers: await headers() });
    // if (!session) {
    //   return NextResponse.json({ error: "未授权" }, { status: 401 });
    // }
    // TODO: 增加管理员角色校验

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "无效的ID" }, { status: 400 });
    }

    const deletedMembership = await deleteMembership(id);

    if (!deletedMembership || deletedMembership.length === 0) {
      return NextResponse.json({ error: "会员记录未找到" }, { status: 404 });
    }

    return NextResponse.json({ message: "会员删除成功" });
  } catch (error) {
    console.error(`删除会员(id: ${params.id})失败:`, error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
