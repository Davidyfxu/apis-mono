import { Bool, OpenAPIRoute, Num, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { createDatabase, reports } from "../db";
import { eq } from "drizzle-orm";

export class ReportFileUpload extends OpenAPIRoute {
  schema = {
    tags: ["Reports"],
    summary: "Upload a file (Word or MP3) for a report",
    request: {
      params: z.object({
        reportId: Num({ description: "Report ID" }),
      }),
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              file: z.any().describe("File to upload (Word or MP3)"),
              fileType: z
                .enum(["word", "mp3"])
                .describe("Type of file being uploaded"),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "File uploaded successfully",
        content: {
          "application/json": {
            schema: z.object({
              series: z.object({
                success: Bool(),
                result: z.object({
                  file_url: z.string(),
                  file_type: z.string(),
                  report_id: z.number(),
                }),
              }),
            }),
          },
        },
      },
      "400": {
        description: "Bad request",
        content: {
          "application/json": {
            schema: z.object({
              series: z.object({
                success: Bool(),
                error: z.string(),
              }),
            }),
          },
        },
      },
      "404": {
        description: "Report not found",
        content: {
          "application/json": {
            schema: z.object({
              series: z.object({
                success: Bool(),
                error: z.string(),
              }),
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
      const { reportId } = data.params;

      // Handle multipart form data
      const formData = await c.req.formData();
      const file = formData.get("file") as File;
      const fileType = formData.get("fileType") as string;

      // Validate file type
      if (!["word", "mp3"].includes(fileType)) {
        return Response.json(
          {
            success: false,
            error: "Invalid file type. Must be 'word' or 'mp3'",
          },
          { status: 400 }
        );
      }

      // Create database connection
      const db = createDatabase(c.env);

      // Check if report exists using Drizzle ORM
      const [report] = await db
        .select()
        .from(reports)
        .where(eq(reports.id, reportId))
        .limit(1);

      if (!report) {
        return Response.json(
          {
            success: false,
            error: "Report not found",
          },
          { status: 404 }
        );
      }

      // Generate unique file key
      const timestamp = Date.now();
      const fileExtension = fileType === "word" ? "docx" : "mp3";
      const fileKey = `reports/${reportId}/${fileType}_${timestamp}.${fileExtension}`;

      // Upload file to R2
      await c.env.REPORTS_BUCKET.put(fileKey, file, {
        httpMetadata: {
          contentType:
            fileType === "word"
              ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              : "audio/mpeg",
        },
      });

      // Generate public URL (you might want to use a custom domain)
      const fileUrl = `https://your-r2-domain.com/${fileKey}`;

      // Update report with file URL using Drizzle ORM
      if (fileType === "word") {
        await db
          .update(reports)
          .set({
            word_file_url: fileUrl,
            updated_at: new Date().toISOString(),
          })
          .where(eq(reports.id, reportId));
      } else {
        await db
          .update(reports)
          .set({
            mp3_file_url: fileUrl,
            updated_at: new Date().toISOString(),
          })
          .where(eq(reports.id, reportId));
      }

      return {
        success: true,
        file_url: fileUrl,
        file_type: fileType,
        report_id: reportId,
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      return Response.json(
        {
          success: false,
          error: "Internal server error",
        },
        { status: 500 }
      );
    }
  }
}
