import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { createDatabase } from "../db";
import { goldPrices } from "../db/schema";
import { desc } from "drizzle-orm";

export class GoldPriceList extends OpenAPIRoute {
  schema = {
    tags: ["Gold Price"],
    summary: "List gold prices",
    request: {
      query: z.object({
        limit: z
          .string()
          .optional()
          .default("10")
          .transform((val) => parseInt(val, 10))
          .pipe(z.number().min(1).max(100)),
      }),
    },
    responses: {
      "200": {
        description: "Successfully retrieved gold prices",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              data: z.array(
                z.object({
                  id: z.number(),
                  timestamp: z.number(),
                  price: z.number(),
                  change_percentage: z.number(),
                  change: z.number(),
                  open: z.number(),
                  high: z.number(),
                  low: z.number(),
                  prev: z.number(),
                  created_at: z.string(),
                })
              ),
              count: z.number(),
            }),
          },
        },
      },
      "500": {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
              error: z.string().optional(),
            }),
          },
        },
      },
    },
  };

  async handle(c: any) {
    try {
      const env = c.env as Env;
      const db = createDatabase(env);
      const data = await this.getValidatedData<typeof this.schema>();
      const limit = data.query.limit;

      // Query gold prices from database
      const prices = await db
        .select()
        .from(goldPrices)
        .orderBy(desc(goldPrices.createdAt))
        .limit(limit);

      const formattedPrices = prices.map((price) => ({
        id: price.id,
        timestamp: price.timestamp,
        price: price.price,
        change_percentage: price.changePercentage,
        change: price.change,
        open: price.open,
        high: price.high,
        low: price.low,
        prev: price.prev,
        created_at: price.createdAt,
      }));

      return c.json(
        {
          success: true,
          data: formattedPrices,
          count: formattedPrices.length,
        },
        200
      );
    } catch (error) {
      console.error("Error fetching gold prices:", error);
      return c.json(
        {
          success: false,
          message: "Failed to fetch gold prices",
          error: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  }
}
