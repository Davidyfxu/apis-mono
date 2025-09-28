import { Bool, OpenAPIRoute, Num, Str } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { createDatabase, reports } from "../db";
import { eq } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";

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

  private async generateDownloadToken(
    fileKey: string,
    expiresAt: Date,
    c: AppContext
  ): Promise<string> {
    // Create a secure token for download access with better security
    const payload = {
      fileKey,
      expiresAt: expiresAt.getTime(),
      timestamp: Date.now(),
      // Add random nonce for additional security
      nonce: randomBytes(16).toString("hex"),
    };

    const secret = c.env.DOWNLOAD_SECRET;
    if (!secret) {
      throw new Error("DOWNLOAD_SECRET environment variable is not set");
    }

    // Create HMAC for better security than simple hash
    const payloadString = JSON.stringify(payload);
    const signature = createHash("sha256")
      .update(payloadString + secret)
      .digest("hex");

    // Encode the payload and signature
    const encodedPayload = Buffer.from(payloadString).toString("base64");

    return `${encodedPayload}.${signature}`;
  }

  async handle(c: AppContext) {
    try {
      // Get validated data
      const data = await this.getValidatedData<typeof this.schema>();
      const { reportId, fileType } = data.params;

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

      // Get report from database using Drizzle ORM
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

      // Get file URL based on file type
      const fileUrl =
        fileType === "word" ? report.word_file_url : report.mp3_file_url;

      if (!fileUrl) {
        return Response.json(
          {
            success: false,
            error: `${fileType} file not found for this report`,
          },
          { status: 404 }
        );
      }

      // Extract file key from URL
      // URL format: https://your-r2-domain.com/reports/${reportId}/${fileType}_${timestamp}.${extension}
      // We need to extract everything after the domain
      let fileKey: string;
      try {
        const url = new URL(fileUrl);
        fileKey = url.pathname.substring(1); // Remove leading slash
      } catch (error) {
        // Fallback: assume it's already a key or extract from path
        const urlParts = fileUrl.split("/");
        if (urlParts.length >= 3 && urlParts.includes("reports")) {
          const reportsIndex = urlParts.findIndex((part) => part === "reports");
          fileKey = urlParts.slice(reportsIndex).join("/");
        } else {
          fileKey = urlParts[urlParts.length - 1];
        }
      }

      if (!fileKey) {
        return Response.json(
          {
            success: false,
            error: "Invalid file URL",
          },
          { status: 400 }
        );
      }
      // Check if file exists in R2
      const fileObject = await c.env.REPORTS_BUCKET.head(fileKey);
      if (!fileObject) {
        return Response.json(
          {
            success: false,
            error: "File not found in storage",
          },
          { status: 404 }
        );
      }

      // Generate download URL with expiration
      const expirationTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // For R2, we'll create a temporary download endpoint
      // This approach uses a token-based system for secure downloads
      const downloadToken = await this.generateDownloadToken(
        fileKey,
        expirationTime,
        c
      );
      const baseUrl = new URL(c.req.url).origin;
      const signedUrl = `${baseUrl}/api/reports/${reportId}/file/${fileType}?token=${downloadToken}`;

      if (!signedUrl) {
        return Response.json(
          {
            success: false,
            error: "Failed to generate download URL",
          },
          { status: 500 }
        );
      }

      // Return signed URL
      return Response.json({
        success: true,
        downloadUrl: signedUrl,
        expiresAt: expirationTime.toISOString(),
      });
    } catch (error) {
      console.error("Error downloading file:", error);
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
