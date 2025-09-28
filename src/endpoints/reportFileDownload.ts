import { Bool, OpenAPIRoute, Num, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import {
  validateFileType,
  generateDownloadToken,
  getReportById,
  extractFileKey,
  createResponse,
  createErrorResponse,
} from "../utils";

export class ReportFileDownload extends OpenAPIRoute {
  schema = {
    tags: ["Reports"],
    summary: "Get a signed download URL for a report file",
    request: {
      params: z.object({
        reportId: Num({ description: "Report ID" }),
        fileType: Str({
          description: "Type of file to download (word or mp3)",
        }),
      }),
    },
    responses: {
      "200": {
        description: "Signed URL generated successfully",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              downloadUrl: z.string(),
              expiresAt: z.string(),
            }),
          },
        },
      },
      "404": {
        description: "Report or file not found",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              error: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    try {
      // Get validated data
      const data = await this.getValidatedData<typeof this.schema>();
      const { reportId, fileType } = data.params;

      // Validate file type
      if (!validateFileType(fileType)) {
        return createErrorResponse(
          "Invalid file type. Must be 'word' or 'mp3'",
          400
        );
      }

      // Get report from database
      const report = await getReportById(reportId, c);
      if (!report) {
        return createErrorResponse("Report not found", 404);
      }

      // Get file URI based on file type (数据库存储的是URI，不是完整URL)
      const fileUri =
        fileType === "word" ? report.word_file_url : report.mp3_file_url;

      if (!fileUri) {
        return createErrorResponse(
          `${fileType} file not found for this report`,
          404
        );
      }

      // 直接使用URI作为fileKey，因为数据库存储的就是key
      const fileKey = extractFileKey(fileUri);

      if (!fileKey) {
        return createErrorResponse("Invalid file URI", 400);
      }

      // Check if file exists in R2
      const fileObject = await c.env.REPORTS_BUCKET.head(fileKey);
      if (!fileObject) {
        return createErrorResponse("File not found in storage", 404);
      }

      // Generate download URL with expiration
      const expirationTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Generate download token
      const downloadToken = await generateDownloadToken(
        fileKey,
        expirationTime,
        c
      );
      const baseUrl = new URL(c.req.url).origin;
      const signedUrl = `${baseUrl}/api/reports/${reportId}/file/${fileType}?token=${downloadToken}`;

      if (!signedUrl) {
        return createErrorResponse("Failed to generate download URL", 500);
      }

      // Return signed URL
      return createResponse(true, {
        downloadUrl: signedUrl,
        expiresAt: expirationTime.toISOString(),
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      return createErrorResponse("Internal server error", 500);
    }
  }
}
