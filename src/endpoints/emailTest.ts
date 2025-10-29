import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import {
  sendEmail,
  sendTextEmail,
  sendHtmlEmail,
  sendNotificationEmail,
  verifyEmailConfig,
} from "../utils";

export class EmailTest extends OpenAPIRoute {
  schema = {
    tags: ["Email"],
    summary: "Send test email",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              to: z.string().email().describe("收件人邮箱地址"),
              subject: z.string().describe("邮件主题"),
              type: z
                .enum(["text", "html", "notification"])
                .default("text")
                .describe("邮件类型"),
              content: z.string().describe("邮件内容"),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Email sent successfully",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
              messageId: z.string().optional(),
            }),
          },
        },
      },
      "500": {
        description: "Failed to send email",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
              error: z.string().optional(),
            }),
          },
        },
      },
    },
  };

  async handle(c: any) {
    try {
      const data = await this.getValidatedData<typeof this.schema>();
      const {
        to = "82054510@qq.com",
        subject = "hello",
        type = "text",
        content = "hello world",
      } = data.body;

      let result;

      switch (type) {
        case "text":
          result = await sendTextEmail(to, subject, content);
          break;
        case "html":
          result = await sendHtmlEmail(to, subject, content);
          break;
        case "notification":
          result = await sendNotificationEmail(to, subject, content, {
            时间: new Date().toLocaleString("zh-CN"),
            类型: "测试通知",
          });
          break;
        default:
          result = await sendEmail({ to, subject, text: content });
      }

      if (result.success) {
        return c.json(
          {
            success: true,
            message: "邮件发送成功",
            messageId: result.messageId,
          },
          200
        );
      } else {
        return c.json(
          {
            success: false,
            message: "邮件发送失败",
            error: result.error,
          },
          500
        );
      }
    } catch (error) {
      console.error("Error in email test:", error);
      return c.json(
        {
          success: false,
          message: "邮件发送异常",
          error: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  }
}

export class EmailVerify extends OpenAPIRoute {
  schema = {
    tags: ["Email"],
    summary: "Verify email configuration",
    request: {},
    responses: {
      "200": {
        description: "Email configuration verification result",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
              config: z.object({
                host: z.string(),
                port: z.number(),
                secure: z.boolean(),
                from: z.string(),
              }),
            }),
          },
        },
      },
    },
  };

  async handle(c: any) {
    try {
      const isValid = await verifyEmailConfig();

      return c.json(
        {
          success: isValid,
          message: isValid ? "邮件配置验证成功" : "邮件配置验证失败",
          config: {
            host: "smtp.yeah.net",
            port: 465,
            secure: true,
            from: "offerexpertau@yeah.net",
          },
        },
        200
      );
    } catch (error) {
      console.error("Error verifying email config:", error);
      return c.json(
        {
          success: false,
          message: "邮件配置验证异常",
          error: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  }
}
