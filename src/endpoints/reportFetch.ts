import { Bool, OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { type AppContext, Report } from "../types";
import { getReportById, createResponse, createErrorResponse } from "../utils";

export class ReportFetch extends OpenAPIRoute {
  schema = {
    tags: ["Reports"],
    summary: "Get a single Report by ID",
    request: {
      params: z.object({
        reportId: Num({ description: "Report ID" }),
      }),
    },
    responses: {
      "200": {
        description: "Returns a single report if found",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              report: Report,
            }),
          },
        },
      },
      "404": {
        description: "Report not found",
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
      const { reportId } = data.params;

      // Fetch report from database
      const report = await getReportById(reportId, c);

      if (!report) {
        return createErrorResponse("Report not found", 404);
      }

      // Return the report
      return createResponse(true, {
        report: {
          id: report.id,
          title: report.title,
          date: report.date,
          description: report.description,
          word_file_url: report.word_file_url,
          mp3_file_url: report.mp3_file_url,
          created_at: report.created_at,
          updated_at: report.updated_at,
        },
      });
    } catch (error) {
      console.error("Error fetching report:", error);
      return createErrorResponse("Internal server error", 500);
    }
  }
}
