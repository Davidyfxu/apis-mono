import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import {
  getReportById,
  getFileContentType,
  createErrorResponse,
} from "../utils";
import { createHash } from "crypto";

export class ReportFileDirectDownload extends OpenAPIRoute {
  schema = {
    tags: ["Reports"],
    summary: "Direct file download with token verification",
    request: {
      params: z.object({
        reportId: z.number(),
        fileType: z.string(),
      }),
      query: z.object({
        token: z.string().min(1, "Download token is required"),
      }),
    },
    responses: {
      "200": {
        description: "File downloaded successfully",
        content: {
          "application/octet-stream": {
            schema: z.any(),
          },
        },
      },
      "400": {
        description: "Invalid or expired token",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              error: z.string(),
            }),
          },
        },
      },
      "404": {
        description: "File not found",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              error: z.string(),
            }),
          },
        },
      },
    },
  };

  private async verifyDownloadToken(
    token: string,
    c: AppContext
  ): Promise<{ fileKey: string; valid: boolean }> {
    try {
      const [encodedPayload, signature] = token.split(".");
      if (!encodedPayload || !signature) {
        return { fileKey: "", valid: false };
      }

      const secret = c.env.DOWNLOAD_SECRET;
      if (!secret) {
        return { fileKey: "", valid: false };
      }

      // Decode and verify
      const payloadString = Buffer.from(encodedPayload, "base64").toString();
      const expectedSignature = createHash("sha256")
        .update(payloadString + secret)
        .digest("hex");

      if (signature !== expectedSignature) {
        return { fileKey: "", valid: false };
      }

      const payload = JSON.parse(payloadString);

      // Check expiration
      if (Date.now() > payload.expiresAt) {
        return { fileKey: "", valid: false };
      }

      return { fileKey: payload.fileKey, valid: true };
    } catch (error) {
      console.error("Token verification failed:", error);
      return { fileKey: "", valid: false };
    }
  }

  async handle(c: AppContext) {
    try {
      const data = await this.getValidatedData<typeof this.schema>();
      const { reportId, fileType } = data.params;
      const { token } = data.query;

      // Additional validation for token
      if (!token || token.trim().length === 0) {
        return createErrorResponse(
          "Download token is required. Please obtain a download URL first.",
          400
        );
      }

      // Verify the download token
      const tokenVerification = await this.verifyDownloadToken(token, c);
      if (!tokenVerification.valid) {
        return createErrorResponse("Invalid or expired download token", 400);
      }

      // Get the file from R2 using the verified file key
      const fileObject = await c.env.REPORTS_BUCKET.get(
        tokenVerification.fileKey
      );

      if (!fileObject) {
        return createErrorResponse("File not found in storage", 404);
      }

      // Get report details for filename
      const report = await getReportById(reportId, c);

      // Determine content type and filename
      const contentType = getFileContentType(fileType as "word" | "mp3");

      const filename = report
        ? `${report.title}_${fileType}.${fileType === "word" ? "docx" : "mp3"}`
        : `report_${reportId}_${fileType}.${
            fileType === "word" ? "docx" : "mp3"
          }`;

      // Return the file with appropriate headers
      return new Response(fileObject.body, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "private, no-cache",
          "Content-Length": fileObject.size?.toString() || "",
        },
      });
    } catch (error) {
      console.error("Error in direct download:", error);

      // Check if it's a validation error (missing token)
      if (error instanceof Error && error.message.includes("token")) {
        return createErrorResponse(
          "Download token is required. Please obtain a download URL first.",
          400
        );
      }

      return createErrorResponse("Internal server error", 500);
    }
  }
}
