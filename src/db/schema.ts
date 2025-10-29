import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Gold prices table
export const goldPrices = sqliteTable("gold_prices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  timestamp: integer("timestamp", { mode: "number" }).notNull(),
  price: real("price").notNull(),
  changePercentage: real("change_percentage").notNull(),
  change: real("change").notNull(),
  open: real("open").notNull(),
  high: real("high").notNull(),
  low: real("low").notNull(),
  prev: real("prev").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const schema = {
  goldPrices,
};
