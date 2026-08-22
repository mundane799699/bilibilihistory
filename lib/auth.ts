import { betterAuth } from "better-auth";

import { pool } from "./db/pool";

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // 注册后自动登录
  },
});
