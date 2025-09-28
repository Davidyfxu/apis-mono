import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import {
  validateFileType,
  generateFileKey,
  getFileContentType,
  createResponse,
  createErrorResponse,
} from "../utils";

export class ReportFileUpload extends OpenAPIRoute {
  schema = {
    tags: ["Reports"],
    summary: "Upload a file (Word or MP3)",
    request: {
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
              success: Bool(),
              file_url: z.string(),
              file_type: z.string(),
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
    },
  };

  async handle(c: AppContext) {
    try {
      // Handle multipart form data
      const formData = await c.req.formData();
      const file = formData.get("file") as File;
      const fileType = formData.get("fileType") as string;

      // Validate file and file type
      if (!file) {
        return createErrorResponse("No file provided", 400);
      }

      if (!validateFileType(fileType)) {
        return createErrorResponse(
          "Invalid file type. Must be 'word' or 'mp3'",
          400
        );
      }

      // Generate unique file key
      const fileKey = generateFileKey(fileType);

      // Upload file to R2
      await c.env.REPORTS_BUCKET.put(fileKey, file, {
        httpMetadata: {
          contentType: getFileContentType(fileType),
        },
      });

      return createResponse(true, {
        file_url: fileKey,
        file_type: fileType,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      return createErrorResponse("Internal server error", 500);
    }
  }
}
