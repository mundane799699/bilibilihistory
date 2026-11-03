// 会员方案：价格与天数写在这里，改价只需要改这一个文件。
export type PlanId = "month" | "year";

export interface Plan {
  id: PlanId;
  title: string;
  price: number;
  days: number;
}

export const PLANS: Record<PlanId, Plan> = {
  month: { id: "month", title: "月度会员", price: 9.9, days: 30 },
  year: { id: "year", title: "年度会员", price: 99, days: 365 },
};

export function getPlan(planId: string): Plan | null {
  return (PLANS as Record<string, Plan>)[planId] ?? null;
}

/** 支付金额统一按「元、两位小数」的字符串处理，避免浮点误差 */
export function moneyOf(value: number): string {
  return value.toFixed(2);
}