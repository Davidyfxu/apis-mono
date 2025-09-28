import { Bool, OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { type AppContext, Report } from "../types";
import { createDatabase, reports } from "../db";
import { eq } from "drizzle-orm";

export class ReportDelete extends OpenAPIRoute {
  schema = {
    tags: ["Reports"],
    summary: "Delete a Report",
    request: {
      params: z.object({
        reportId: Num({ description: "Report ID" }),
      }),
    },
    responses: {
      "200": {
        description: "Returns if the report was deleted successfully",
        content: {
          "application/json": {
            schema: z.object({
              series: z.object({
                success: Bool(),
                result: z.object({
                  report: Report,
                }),
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

      // Create database connection
      const db = createDatabase(c.env);

      // First, fetch the report to get file URLs for cleanup
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

      // Delete files from R2 if they exist
      try {
        if (report.word_file_url) {
          const wordKey = (report.word_file_url as string).split("/").pop();
          if (wordKey) {
            await c.env.REPORTS_BUCKET.delete(wordKey);
          }
        }
        if (report.mp3_file_url) {
          const mp3Key = (report.mp3_file_url as string).split("/").pop();
          if (mp3Key) {
            await c.env.REPORTS_BUCKET.delete(mp3Key);
          }
        }
      } catch (fileError) {
        console.warn("Error deleting files from R2:", fileError);
        // Continue with database deletion even if file deletion fails
      }

      // Delete the report from database using Drizzle ORM
      const [deletedReport] = await db
        .delete(reports)
        .where(eq(reports.id, reportId))
        .returning();

      if (!deletedReport) {
        return Response.json(
          {
            success: false,
            error: "Failed to delete report",
          },
          { status: 400 }
        );
      }

      // Return the deleted report for confirmation
      return {
        success: true,
        report: {
          id: deletedReport.id,
          title: deletedReport.title,
          date: deletedReport.date,
          description: deletedReport.description,
          word_file_url: deletedReport.word_file_url,
          mp3_file_url: deletedReport.mp3_file_url,
          created_at: deletedReport.created_at,
          updated_at: deletedReport.updated_at,
        },
      };
    } catch (error) {
      console.error("Error deleting report:", error);
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
