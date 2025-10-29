import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { createDatabase } from "../db";
import { goldPrices } from "../db/schema";

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
      const apiKey = process.env.GOLD_API_KEY;

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
