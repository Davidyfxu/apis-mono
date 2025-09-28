import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, Report } from "../types";
import { createDatabase, reports } from "../db";
import { and, gte, lte, desc, count } from "drizzle-orm";

export class ReportList extends OpenAPIRoute {
  schema = {
    tags: ["Reports"],
    summary: "List Reports",
    request: {
      query: z.object({
        page: Num({
          description: "Page number (0-based)",
          default: 0,
        }),
        limit: Num({
          description: "Number of reports per page",
          default: 10,
        }),
        date_from: z.string().optional(),
        date_to: z.string().optional(),
      }),
    },
    responses: {
      "200": {
        description: "Returns a list of reports",
        content: {
          "application/json": {
            schema: z.object({
              series: z.object({
                success: Bool(),
                result: z.object({
                  reports: Report.array(),
                  pagination: z.object({
                    page: z.number(),
                    limit: z.number(),
                    total: z.number(),
                    total_pages: z.number(),
                  }),
                }),
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
      const { page, limit, date_from, date_to } = data.query;

      // Create database connection
      const db = createDatabase(c.env);

      // Build WHERE conditions for date filtering
      const whereConditions = [];
      if (date_from) {
        whereConditions.push(gte(reports.date, date_from));
      }
      if (date_to) {
        whereConditions.push(lte(reports.date, date_to));
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get total count
      const [countResult] = await db
        .select({ total: count() })
        .from(reports)
        .where(whereClause);

      const total = countResult?.total || 0;
      const totalPages = Math.ceil(total / limit);

      // Get reports with pagination
      const offset = page * limit;
      const reportsList = await db
        .select()
        .from(reports)
        .where(whereClause)
        .orderBy(desc(reports.created_at))
        .limit(limit)
        .offset(offset);

      // Format reports
      const formattedReports = reportsList.map((report) => ({
        id: report.id,
        title: report.title,
        date: report.date,
        description: report.description,
        word_file_url: report.word_file_url,
        mp3_file_url: report.mp3_file_url,
        created_at: report.created_at,
        updated_at: report.updated_at,
      }));

      return {
        success: true,
        reports: formattedReports,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
        },
      };
    } catch (error) {
      console.error("Error listing reports:", error);
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
