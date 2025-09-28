import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Report } from "../types";
import { createDatabase, reports } from "../db";

export class ReportCreate extends OpenAPIRoute {
  schema = {
    tags: ["Reports"],
    summary: "Create a new Report",
    request: {
      body: {
        content: {
          "application/json": {
            schema: Report.omit({
              id: true,
              created_at: true,
              updated_at: true,
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the created report",
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
    },
  };

  async handle(c: AppContext) {
    try {
      // Get validated data
      const data = await this.getValidatedData<typeof this.schema>();
      const reportData = data.body;

      // Validate required fields
      if (!reportData.title || !reportData.date) {
        return Response.json(
          {
            success: false,
            error: "Title and date are required",
          },
          { status: 400 }
        );
      }

      // Create database connection
      const db = createDatabase(c.env);

      // Insert report into database using Drizzle ORM
      const [insertedReport] = await db
        .insert(reports)
        .values({
          title: reportData.title,
          date: reportData.date,
          description: reportData.description || null,
          word_file_url: reportData.word_file_url || null,
          mp3_file_url: reportData.mp3_file_url || null,
        })
        .returning();

      if (!insertedReport) {
        return Response.json(
          {
            success: false,
            error: "Failed to create report",
          },
          { status: 400 }
        );
      }

      // Return the created report
      return {
        success: true,
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
      };
    } catch (error) {
      console.error("Error creating report:", error);
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
