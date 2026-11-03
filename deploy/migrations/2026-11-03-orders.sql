-- 支付订单表：配合 lib/pay/service.ts 使用
CREATE TABLE IF NOT EXISTS "orders" (
  "out_trade_no" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "user_email" text,
  "plan_id" text NOT NULL,
  "amount" numeric(10, 2) NOT NULL,
  "days" integer NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "channel" text DEFAULT 'wxpay' NOT NULL,
  "qr_url" text,
  "pay_no" text,
  "checked_at" timestamptz,
  "paid_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "orders_user_idx" ON "orders" ("user_id");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status");
