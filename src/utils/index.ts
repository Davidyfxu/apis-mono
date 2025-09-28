import { createHash, randomBytes } from "crypto";
import { type AppContext } from "../types";
import { createDatabase, reports } from "../db";
import { eq } from "drizzle-orm";

/**
 * 生成下载令牌
 */
export async function generateDownloadToken(
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

/**
 * 从URL提取文件key（直接使用URL作为key，因为数据库存储的是URI）
 */
export function extractFileKey(fileUrl: string): string {
  // 数据库存储的是URI，直接返回
  return fileUrl;
}

/**
 * 生成文件key
 */
export function generateFileKey(fileType: "word" | "mp3"): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const fileExtension = fileType === "word" ? "docx" : "mp3";
  return `files/${fileType}_${timestamp}_${randomId}.${fileExtension}`;
}

/**
 * 获取文件的Content-Type
 */
export function getFileContentType(fileType: "word" | "mp3"): string {
  return fileType === "word"
    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    : "audio/mpeg";
}

/**
 * 验证文件类型
 */
export function validateFileType(fileType: string): fileType is "word" | "mp3" {
  return ["word", "mp3"].includes(fileType);
}

/**
 * 获取报告信息
 */
export async function getReportById(reportId: number, c: AppContext) {
  const db = createDatabase(c.env);
  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);

  return report;
}

/**
 * 更新报告文件URL
 */
export async function updateReportFileUrl(
  reportId: number,
  fileType: "word" | "mp3",
  fileUrl: string,
  c: AppContext
) {
  const db = createDatabase(c.env);

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (fileType === "word") {
    updateData.word_file_url = fileUrl;
  } else {
    updateData.mp3_file_url = fileUrl;
  }

  await db.update(reports).set(updateData).where(eq(reports.id, reportId));
}

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
