import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// Email configuration
const EMAIL_CONFIG = {
  host: "smtp.yeah.net",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

const DEFAULT_FROM_EMAIL = process.env.EMAIL_USER;

// Create reusable transporter
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
  }
  return transporter;
}

/**
 * Email options interface
 */
export interface EmailOptions {
  to: string | string[]; // 收件人邮箱（单个或多个）
  subject: string; // 邮件主题
  text?: string; // 纯文本内容
  html?: string; // HTML内容
  from?: string; // 发件人（可选，默认使用配置的邮箱）
  cc?: string | string[]; // 抄送（可选）
  bcc?: string | string[]; // 密送（可选）
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>; // 附件（可选）
}

/**
 * Email result interface
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 发送邮件
 * @param options - 邮件选项
 * @returns Promise<EmailResult> - 发送结果
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const mailOptions = {
      from: options.from || DEFAULT_FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      cc: options.cc
        ? Array.isArray(options.cc)
          ? options.cc.join(", ")
          : options.cc
        : undefined,
      bcc: options.bcc
        ? Array.isArray(options.bcc)
          ? options.bcc.join(", ")
          : options.bcc
        : undefined,
      attachments: options.attachments,
    };

    const transport = getTransporter();
    const info = await transport.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 发送简单文本邮件（快捷方法）
 * @param to - 收件人
 * @param subject - 主题
 * @param text - 文本内容
 * @returns Promise<EmailResult>
 */
export async function sendTextEmail(
  to: string | string[],
  subject: string,
  text: string
): Promise<EmailResult> {
  return sendEmail({ to, subject, text });
}

/**
 * 发送HTML邮件（快捷方法）
 * @param to - 收件人
 * @param subject - 主题
 * @param html - HTML内容
 * @returns Promise<EmailResult>
 */
export async function sendHtmlEmail(
  to: string | string[],
  subject: string,
  html: string
): Promise<EmailResult> {
  return sendEmail({ to, subject, html });
}

/**
 * 验证邮件配置是否正常
 * @returns Promise<boolean>
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log("Email configuration is valid");
    return true;
  } catch (error) {
    console.error("Email configuration error:", error);
    return false;
  }
}

/**
 * 发送通知邮件模板
 * @param to - 收件人
 * @param title - 通知标题
 * @param message - 通知消息
 * @param data - 附加数据（可选）
 * @returns Promise<EmailResult>
 */
export async function sendNotificationEmail(
  to: string | string[],
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: #f9f9f9;
          padding: 20px;
          border: 1px solid #ddd;
          border-top: none;
        }
        .message {
          background-color: white;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .data-table td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
        .data-table td:first-child {
          font-weight: bold;
          width: 30%;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 12px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
      </div>
      <div class="content">
        <div class="message">
          <p>${message}</p>
        </div>
        ${
          data
            ? `
        <table class="data-table">
          ${Object.entries(data)
            .map(
              ([key, value]) => `
            <tr>
              <td>${key}</td>
              <td>${value}</td>
            </tr>
          `
            )
            .join("")}
        </table>
        `
            : ""
        }
      </div>
      <div class="footer">
        <p>此邮件由系统自动发送，请勿回复。</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: title,
    html,
  });
}
