import { createHash } from "node:crypto";

/**
 * 蓝兔支付（ltzf.cn）微信 Native 下单。
 *
 * 签名规则：只取必填字段，按 key 升序拼成 `k=v&k=v`，末尾追加 `&key=<商户密钥>`，
 * MD5 后转大写。回调通知用同样的规则验签。
 */

const API = "https://api.ltzf.cn";

const mchId = () => (process.env.LTZF_MCH_ID ?? "").trim();
const secretKey = () => (process.env.LTZF_KEY ?? "").trim();

/** 没有配置商户号和密钥时不能发起真实支付 */
export function ltzfReady(): boolean {
  return Boolean(mchId() && secretKey());
}

export function sign(fields: Record<string, string>): string {
  const text =
    Object.keys(fields)
      .sort()
      .map((k) => `${k}=${fields[k]}`)
      .join("&") + `&key=${secretKey()}`;
  return createHash("md5").update(text, "utf8").digest("hex").toUpperCase();
}

const now = () => String(Math.floor(Date.now() / 1000));

async function call(
  path: string,
  fields: Record<string, string>,
  extra: Record<string, string> = {}
): Promise<any> {
  const body = new URLSearchParams({
    ...fields,
    ...extra,
    sign: sign(fields),
  });
  const res = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  return res.json();
}

export interface NativeOrderResult {
  ok: boolean;
  qrUrl?: string;
  message?: string;
}

/** 微信 Native 下单，返回二维码图片地址 */
export async function createNativeOrder(input: {
  outTradeNo: string;
  amount: string;
  subject: string;
  notifyUrl: string;
}): Promise<NativeOrderResult> {
  try {
    const result = await call(
      "/api/wxpay/native",
      {
        mch_id: mchId(),
        out_trade_no: input.outTradeNo,
        total_fee: input.amount,
        body: input.subject.slice(0, 100),
        timestamp: now(),
        notify_url: input.notifyUrl,
      },
      { time_expire: "15m" }
    );
    if (result?.code !== 0) {
      return { ok: false, message: result?.msg || "微信支付下单失败" };
    }
    return { ok: true, qrUrl: result.data?.QRcode_url };
  } catch (error) {
    console.error("[pay] ltzf native failed", (error as Error).message);
    return { ok: false, message: "微信支付下单失败，请稍后重试" };
  }
}

export interface QueryResult {
  /** 0 = 查询成功；非 0 时看 msg（例如「请降低请求接口频率」） */
  code?: number;
  msg?: string;
  /** 1 = 已支付 */
  payStatus?: number;
  payNo?: string;
  totalFee?: number;
}

/** 主动查单（回调没到或本地收不到回调时兜底） */
export async function queryNativeOrder(
  outTradeNo: string
): Promise<QueryResult | null> {
  try {
    const result = await call("/api/wxpay/get_pay_order", {
      mch_id: mchId(),
      out_trade_no: outTradeNo,
      timestamp: now(),
    });
    if (result?.code !== 0) {
      return { code: result?.code, msg: result?.msg };
    }
    return {
      code: result.code,
      payStatus: result.data?.pay_status,
      payNo: result.data?.pay_no,
      totalFee: result.data?.total_fee,
    };
  } catch (error) {
    console.error("[pay] ltzf query failed", (error as Error).message);
    return null;
  }
}

/** 回调通知需要参与签名的字段（与蓝兔文档一致） */
const NOTIFY_FIELDS = [
  "code",
  "timestamp",
  "mch_id",
  "order_no",
  "out_trade_no",
  "pay_no",
  "total_fee",
] as const;

export interface NotifyPayload {
  valid: boolean;
  outTradeNo?: string;
  payNo?: string;
  amount?: number;
  paid: boolean;
}

/** 校验微信回调：验签 + 商户号 + 支付状态 */
export function verifyNotify(form: Record<string, string>): NotifyPayload {
  const fields: Record<string, string> = {};
  for (const k of NOTIFY_FIELDS) fields[k] = form[k] ?? "";

  if (!ltzfReady()) return { valid: false, paid: false };
  if (form.sign !== sign(fields)) return { valid: false, paid: false };
  if (fields.mch_id !== mchId()) return { valid: false, paid: false };

  return {
    valid: true,
    paid: fields.code === "1" || form.pay_status === "1",
    outTradeNo: fields.out_trade_no,
    payNo: fields.pay_no,
    amount: Number(fields.total_fee),
  };
}

export const notifyConfigured = ltzfReady;