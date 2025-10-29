import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { GoldPriceFetch } from "./endpoints/goldPriceFetch";
import { GoldPriceList } from "./endpoints/goldPriceList";
import { EmailTest, EmailVerify } from "./endpoints/emailTest";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Configure CORS
app.use(
  "*",
  cors({
    origin: "*", // 允许所有域名，生产环境建议指定具体域名
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/",
});

// Register gold price endpoints
openapi.post("/api/gold/fetch", GoldPriceFetch);
openapi.get("/api/gold/list", GoldPriceList);

// Register email endpoints
openapi.post("/api/email/test", EmailTest);
openapi.get("/api/email/verify", EmailVerify);

// You may also register routes for non OpenAPI directly on Hono
app.get("/test", (c) => c.text("Hono!"));

// Export the Hono app
export default app;

// Export scheduled event handler for cron triggers
export async function scheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  console.log(
    "Cron trigger fired at:",
    new Date(event.scheduledTime).toISOString()
  );

  try {
    // 创建一个模拟的 Request 对象来调用现有的 API
    const request = new Request("/api/gold/fetch", {
      method: "POST",
    });

    // 调用现有的 fetch handler
    const response = await app.fetch(request, env, ctx);
    const result = await response.json();

    console.log("Gold price fetch result:", result);
  } catch (error) {
    console.error("Error in scheduled gold price fetch:", error);
  }
}
