import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import {
  type AppContext,
  Report,
  ReportCreateSchema,
  ReportUpdateSchema,
} from "../types";
import { createDatabase, reports } from "../db";
import { eq } from "drizzle-orm";
import { createResponse, createErrorResponse } from "../utils";
import { get, set } from "lodash-es";
export class ReportCreate extends OpenAPIRoute {
  schema = {
    tags: ["Reports"],
    summary: "Create or Update a Report",
    request: {
      body: {
        content: {
          "application/json": {
            schema: ReportCreateSchema,
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the created or updated report",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              report: Report,
            }),
          },
        },
      },
      "400": {
        description: "Bad request",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              error: z.string(),
            }),
          },
        },
      },
      "404": {
        description: "Report not found (for update)",
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
      const reportData = data.body;

      // Validate required fields
      if (!reportData.title || !reportData.date) {
        return createErrorResponse("Title and date are required", 400);
      }

      // Create database connection
      const db = createDatabase(c.env);

      console.info('Report data received:', reportData);
      // Check if this is an update (has id) or create (no id)
      const isUpdate = Boolean(get(reportData, "id"));

      if (isUpdate) {
        // Update existing report
        const reportId = reportData.id;

        // Check if report exists
        const [existingReport] = await db
          .select()
          .from(reports)
          .where(eq(reports.id, reportId))
          .limit(1);

        if (!existingReport) {
          return createErrorResponse("Report not found", 404);
        }

        // Update the report
        const updateData: any = {
          ...existingReport,
          title: reportData.title,
          date: reportData.date,
        };
        reportData?.description &&
          set(updateData, "description", reportData.description);
        reportData?.word_file_url &&
          set(updateData, "word_file_url", reportData.word_file_url);
        reportData?.mp3_file_url &&
          set(updateData, "mp3_file_url", reportData.mp3_file_url);

        const [updatedReport] = await db
          .update(reports)
          .set(updateData)
          .where(eq(reports.id, reportId))
          .returning();

        if (!updatedReport) {
          return createErrorResponse("Failed to update report", 400);
        }

        return createResponse(true, {
          report: {
            id: updatedReport.id,
            title: updatedReport.title,
            date: updatedReport.date,
            description: updatedReport.description,
            word_file_url: updatedReport.word_file_url,
            mp3_file_url: updatedReport.mp3_file_url,
            created_at: updatedReport.created_at,
            updated_at: updatedReport.updated_at,
          },
        });
      } else {
        // Create new report
        const insertData: any = {
          title: reportData.title,
          date: reportData.date,
        };
        reportData.description &&
          set(insertData, "description", reportData.description);
        reportData.word_file_url &&
          set(insertData, "word_file_url", reportData.word_file_url);
        reportData.mp3_file_url &&
          set(insertData, "mp3_file_url", reportData.mp3_file_url);

        const [insertedReport] = await db
          .insert(reports)
          .values(insertData)
          .returning();

        if (!insertedReport) {
          return createErrorResponse("Failed to create report", 400);
        }

        return createResponse(true, {
          report: {
            id: insertedReport.id,
            title: insertedReport.title,
            date: insertedReport.date,
            description: insertedReport.description,
            word_file_url: insertedReport.word_file_url,
            mp3_file_url: insertedReport.mp3_file_url,
            created_at: insertedReport.created_at,
            updated_at: insertedReport.updated_at,
          },
        });
      }
    } catch (error) {
      console.error("Error creating/updating report:", error);
      return createErrorResponse("Internal server error", 500);
    }
  }
}
