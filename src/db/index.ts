import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function createDatabase(env: any) {
  // 使用 Cloudflare D1 数据库
  return drizzle(env.DB, { schema });
}
