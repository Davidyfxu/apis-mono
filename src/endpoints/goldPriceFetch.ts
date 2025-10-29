import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { createDatabase } from "../db";
import { goldPrices } from "../db/schema";
import { sendNotificationEmail } from "../utils/email";

// Response schema for gold price API
const GoldPriceAPIResponse = z.object({
  status: z.string(),
  data: z.object({
    timestamp: z.number(),
    base_currency: z.string(),
    metals: z.string(),
    weight_unit: z.string(),
    weight_name: z.string(),
    metal_prices: z.object({
      XAU: z.object({
        open: z.number(),
        high: z.number(),
        low: z.number(),
        prev: z.number(),
        change: z.number(),
        change_percentage: z.number(),
        price: z.number(),
        ask: z.number(),
        bid: z.number(),
        price_24k: z.number(),
        price_22k: z.number(),
        price_21k: z.number(),
        price_20k: z.number(),
        price_18k: z.number(),
        price_16k: z.number(),
        price_14k: z.number(),
        price_10k: z.number(),
      }),
    }),
    currency_rates: z.object({
      CNY: z.number(),
    }),
  }),
});

export class GoldPriceFetch extends OpenAPIRoute {
  schema = {
    tags: ["Gold Price"],
    summary: "Fetch and store current gold price",
    request: {},
    responses: {
      "200": {
        description: "Successfully fetched and stored gold price",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
              data: z.object({
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
              }),
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

      // Fetch gold price from API
      const apiUrl =
        "https://gold.g.apised.com/v1/latest?metals=XAU&base_currency=CNY&currencies=CNY&weight_unit=gram";
      const apiKey = env.GOLD_API_KEY;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const jsonData = await response.json();
      const apiData = GoldPriceAPIResponse.parse(jsonData);

      // Extract XAU data
      const xauData = apiData.data.metal_prices.XAU;

      // Insert into database
      const result = await db
        .insert(goldPrices)
        .values({
          timestamp: apiData.data.timestamp,
          price: xauData.price,
          changePercentage: xauData.change_percentage,
          change: xauData.change,
          open: xauData.open,
          high: xauData.high,
          low: xauData.low,
          prev: xauData.prev,
        })
        .returning();

      const insertedRecord = result[0];

      // 如果涨幅超过 0.1%，发送邮件通知
      if (insertedRecord.changePercentage > 0.1) {
        const emailResult = await sendNotificationEmail(
          "82054510@qq.com",
          "金价异常涨幅提醒",
          `金价涨幅超过 0.1%，当前涨幅为 ${insertedRecord.changePercentage}%，请及时关注！`,
          {
            当前价格: `¥${insertedRecord.price.toFixed(2)}/克`,
            涨幅百分比: `${insertedRecord.changePercentage}%`,
            涨幅金额: `¥${insertedRecord.change.toFixed(2)}`,
            开盘价: `¥${insertedRecord.open.toFixed(2)}`,
            最高价: `¥${insertedRecord.high.toFixed(2)}`,
            最低价: `¥${insertedRecord.low.toFixed(2)}`,
            昨日收盘价: `¥${insertedRecord.prev.toFixed(2)}`,
            更新时间: new Date(insertedRecord.timestamp * 1000).toLocaleString(
              "zh-CN"
            ),
          }
        );

        if (emailResult.success) {
          console.log("邮件通知发送成功:", emailResult.messageId);
        } else {
          console.error("邮件通知发送失败:", emailResult.error);
        }
      }

      return c.json(
        {
          success: true,
          message: "Gold price fetched and stored successfully",
          data: {
            id: insertedRecord.id,
            timestamp: insertedRecord.timestamp,
            price: insertedRecord.price,
            change_percentage: insertedRecord.changePercentage,
            change: insertedRecord.change,
            open: insertedRecord.open,
            high: insertedRecord.high,
            low: insertedRecord.low,
            prev: insertedRecord.prev,
            created_at: insertedRecord.createdAt,
          },
        },
        200
      );
    } catch (error) {
      console.error("Error fetching/storing gold price:", error);
      return c.json(
        {
          success: false,
          message: "Failed to fetch or store gold price",
          error: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  }
}
