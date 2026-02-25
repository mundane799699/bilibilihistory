import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { resetPasswordByEmail, findUserByEmail } from "@/lib/db/membership_queries";

const resetPasswordSchema = z.object({
  email: z.string().email("无效的邮箱地址"),
  password: z.string().min(8, "密码长度至少为8位"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "数据校验失败", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "该邮箱对应的用户不存在" },
        { status: 404 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const result = await resetPasswordByEmail(email, hashedPassword);

    if (!result) {
      return NextResponse.json(
        { error: "该用户没有密码凭证记录，无法重置" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "密码重置成功" });
  } catch (error) {
    console.error("重置密码失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
