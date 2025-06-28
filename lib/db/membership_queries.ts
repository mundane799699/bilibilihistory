import { db } from "./index";
import { memberships, users, NewMembership, Membership } from "./schema";
import { eq, desc, and, like, or, sql, count } from "drizzle-orm";

type GetMembershipsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
};

// 获取会员列表（分页、搜索、过滤）
export async function getMemberships({
  page = 1,
  pageSize = 10,
  search,
  status,
}: GetMembershipsParams) {
  const whereClauses = [];
  if (status) {
    whereClauses.push(eq(memberships.status, status));
  }
  if (search) {
    whereClauses.push(
      or(
        like(users.name, `%${search}%`),
        like(memberships.email, `%${search}%`)
      )
    );
  }

  const offset = (page - 1) * pageSize;

  return await db
    .select({
      id: memberships.id,
      userId: memberships.userId,
      email: memberships.email,
      expiresAt: memberships.expiresAt,
      plan: memberships.plan,
      status: memberships.status,
      createdAt: memberships.createdAt,
      userName: users.name,
      userImage: users.image,
    })
    .from(memberships)
    .leftJoin(users, eq(memberships.userId, users.id))
    .where(and(...whereClauses))
    .orderBy(desc(memberships.createdAt))
    .limit(pageSize)
    .offset(offset);
}

// 获取会员总数（用于分页）
export async function getMembershipsCount({
  search,
  status,
}: {
  search?: string;
  status?: string;
}) {
  const whereClauses = [];
  if (status) {
    whereClauses.push(eq(memberships.status, status));
  }
  if (search) {
    whereClauses.push(
      or(
        like(users.name, `%${search}%`),
        like(memberships.email, `%${search}%`)
      )
    );
  }

  const result = await db
    .select({ count: count() })
    .from(memberships)
    .leftJoin(users, eq(memberships.userId, users.id))
    .where(and(...whereClauses));

  return result[0]?.count ?? 0;
}

// 根据用户ID获取会员信息
export async function getMembershipByUserId(userId: string) {
  const result = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .limit(1);
  return result[0];
}

// 通过 email 查找用户
export async function findUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0];
}

// 创建会员
export async function createMembership(data: NewMembership) {
  return (await db.insert(memberships).values(data).returning())[0];
}

// 根据ID获取会员信息
export async function getMembershipById(id: number) {
  const result = await db
    .select({
      id: memberships.id,
      userId: memberships.userId,
      email: memberships.email,
      expiresAt: memberships.expiresAt,
      plan: memberships.plan,
      status: memberships.status,
      createdAt: memberships.createdAt,
      userName: users.name,
    })
    .from(memberships)
    .leftJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.id, id));

  return result[0];
}

// 更新会员信息
export async function updateMembership(
  id: number,
  data: Partial<NewMembership>
) {
  return await db
    .update(memberships)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(memberships.id, id))
    .returning();
}

// 删除会员
export async function deleteMembership(id: number) {
  return await db.delete(memberships).where(eq(memberships.id, id)).returning();
}
