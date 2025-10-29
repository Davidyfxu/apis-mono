import { createHash, randomBytes } from "crypto";
import { type AppContext } from "../types";
import { createDatabase } from "../db";
import { eq } from "drizzle-orm";

/**
 * 创建标准响应格式
 */
export function createResponse(
  success: boolean,
  data?: any,
  error?: string,
  status = 200
) {
  if (success) {
    return Response.json({ success: true, ...data }, { status });
  } else {
    return Response.json({ success: false, error }, { status });
  }
}

/**
 * 创建错误响应
 */
export function createErrorResponse(error: string, status = 500) {
  return createResponse(false, undefined, error, status);
}

// Re-export email utilities
export {
  sendEmail,
  sendTextEmail,
  sendHtmlEmail,
  verifyEmailConfig,
  sendNotificationEmail,
  type EmailOptions,
  type EmailResult,
} from "./email";
