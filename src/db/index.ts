import { drizzle } from "drizzle-orm/d1";

export function createDatabase(env: any) {
  // 使用 Cloudflare D1 数据库
  return drizzle(env.DB);
}

export { reports } from "./schema";
export type { Report, NewReport } from "./schema";
