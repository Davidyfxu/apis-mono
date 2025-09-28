import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { ReportCreate } from "./endpoints/reportCreate";
import { ReportDelete } from "./endpoints/reportDelete";
import { ReportFetch } from "./endpoints/reportFetch";
import { ReportList } from "./endpoints/reportList";
import { ReportFileUpload } from "./endpoints/reportFileUpload";
import { ReportFileDownload } from "./endpoints/reportFileDownload";
import { ReportFileDirectDownload } from "./endpoints/reportFileDirectDownload";

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
// Register Report endpoints
openapi.get("/api/reports", ReportList);
openapi.post("/api/reports", ReportCreate);
openapi.get("/api/reports/:reportId", ReportFetch);
openapi.delete("/api/reports/:reportId", ReportDelete);
openapi.post("/api/reports/upload", ReportFileUpload);
openapi.get("/api/reports/:reportId/download/:fileType", ReportFileDownload);
openapi.get("/api/reports/:reportId/file/:fileType", ReportFileDirectDownload);

// You may also register routes for non OpenAPI directly on Hono
app.get("/test", (c) => c.text("Hono!"));

// Export the Hono app
export default app;
