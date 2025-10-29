# Email 工具函数使用文档

## 概述

提供了完整的邮件发送工具函数，基于 nodemailer 库，使用 smtp.yeah.net 邮件服务器。

## 安装依赖

首先安装所需的依赖包：

```bash
pnpm install
```

## 邮件配置

邮件配置已内置在 `src/utils/email.ts` 中：

- **SMTP服务器**: smtp.yeah.net
- **端口**: 465
- **SSL**: 启用
- **发件邮箱**: offerexpertau@yeah.net

## 核心功能

### 1. 基础邮件发送函数

#### `sendEmail(options: EmailOptions)`

最完整的邮件发送函数，支持所有选项。

**参数**:

```typescript
interface EmailOptions {
  to: string | string[]; // 收件人（必填）
  subject: string; // 主题（必填）
  text?: string; // 纯文本内容
  html?: string; // HTML内容
  from?: string; // 发件人（可选）
  cc?: string | string[]; // 抄送（可选）
  bcc?: string | string[]; // 密送（可选）
  attachments?: Array<{
    // 附件（可选）
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;
}
```

**示例**:

```typescript
import { sendEmail } from "./utils";

const result = await sendEmail({
  to: "recipient@example.com",
  subject: "测试邮件",
  html: "<h1>Hello</h1><p>这是一封测试邮件</p>",
  cc: ["cc1@example.com", "cc2@example.com"],
});

if (result.success) {
  console.log("邮件发送成功:", result.messageId);
} else {
  console.error("邮件发送失败:", result.error);
}
```

### 2. 快捷方法

#### `sendTextEmail(to, subject, text)`

发送纯文本邮件的快捷方法。

```typescript
import { sendTextEmail } from "./utils";

await sendTextEmail("user@example.com", "通知", "这是一条纯文本通知消息");
```

#### `sendHtmlEmail(to, subject, html)`

发送 HTML 邮件的快捷方法。

```typescript
import { sendHtmlEmail } from "./utils";

await sendHtmlEmail(
  "user@example.com",
  "欢迎",
  "<h1>欢迎！</h1><p>感谢注册我们的服务。</p>"
);
```

#### `sendNotificationEmail(to, title, message, data?)`

发送带有精美模板的通知邮件。

```typescript
import { sendNotificationEmail } from "./utils";

await sendNotificationEmail("admin@example.com", "系统通知", "用户注册成功", {
  用户名: "张三",
  邮箱: "zhangsan@example.com",
  注册时间: new Date().toLocaleString("zh-CN"),
});
```

### 3. 验证邮件配置

#### `verifyEmailConfig()`

验证邮件配置是否正确。

```typescript
import { verifyEmailConfig } from "./utils";

const isValid = await verifyEmailConfig();
if (isValid) {
  console.log("邮件配置正常");
} else {
  console.error("邮件配置有误");
}
```

## API 端点

### 1. 发送测试邮件

**POST** `/api/email/test`

**请求体**:

```json
{
  "to": "recipient@example.com",
  "subject": "测试邮件",
  "type": "text",
  "content": "这是邮件内容"
}
```

**参数说明**:

- `to`: 收件人邮箱
- `subject`: 邮件主题
- `type`: 邮件类型（`text` | `html` | `notification`）
- `content`: 邮件内容

**响应**:

```json
{
  "success": true,
  "message": "邮件发送成功",
  "messageId": "<message-id@yeah.net>"
}
```

**使用示例**:

```bash
# 发送纯文本邮件
curl -X POST http://localhost:8787/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "测试邮件",
    "type": "text",
    "content": "这是一封测试邮件"
  }'

# 发送HTML邮件
curl -X POST http://localhost:8787/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "HTML邮件",
    "type": "html",
    "content": "<h1>欢迎</h1><p>这是HTML邮件</p>"
  }'

# 发送通知邮件（使用模板）
curl -X POST http://localhost:8787/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "系统通知",
    "type": "notification",
    "content": "您的操作已成功完成"
  }'
```

### 2. 验证邮件配置

**GET** `/api/email/verify`

**响应**:

```json
{
  "success": true,
  "message": "邮件配置验证成功",
  "config": {
    "host": "smtp.yeah.net",
    "port": 465,
    "secure": true,
    "from": "offerexpertau@yeah.net"
  }
}
```

**使用示例**:

```bash
curl http://localhost:8787/api/email/verify
```

## 完整使用示例

### 在端点中使用

```typescript
import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { sendNotificationEmail } from "../utils";

export class UserRegister extends OpenAPIRoute {
  async handle(c: any) {
    // ... 用户注册逻辑 ...

    // 发送欢迎邮件
    await sendNotificationEmail(
      userEmail,
      "欢迎注册",
      "感谢您注册我们的服务！",
      {
        用户名: username,
        注册时间: new Date().toLocaleString("zh-CN"),
      }
    );

    return c.json({ success: true });
  }
}
```

### 发送带附件的邮件

```typescript
import { sendEmail } from "./utils";

await sendEmail({
  to: "user@example.com",
  subject: "报告文件",
  html: "<p>请查收附件中的报告文件。</p>",
  attachments: [
    {
      filename: "report.pdf",
      path: "/path/to/report.pdf",
    },
    {
      filename: "data.json",
      content: JSON.stringify({ data: "example" }),
    },
  ],
});
```

### 发送给多个收件人

```typescript
import { sendEmail } from "./utils";

await sendEmail({
  to: ["user1@example.com", "user2@example.com", "user3@example.com"],
  subject: "群发通知",
  text: "这是一条群发消息",
});
```

## 返回值

所有邮件发送函数都返回 `EmailResult` 类型：

```typescript
interface EmailResult {
  success: boolean; // 是否成功
  messageId?: string; // 邮件ID（成功时）
  error?: string; // 错误信息（失败时）
}
```

## 错误处理

```typescript
import { sendEmail } from "./utils";

const result = await sendEmail({
  to: "invalid-email",
  subject: "测试",
  text: "测试内容",
});

if (!result.success) {
  console.error("邮件发送失败:", result.error);
  // 处理错误...
}
```

## 注意事项

1. **邮件配置安全性**: 生产环境建议将邮件密码等敏感信息存储在环境变量中
2. **发送频率**: 注意邮件服务商的发送频率限制
3. **收件人验证**: 建议在发送前验证收件人邮箱格式
4. **错误处理**: 始终检查返回的 `success` 字段并处理错误
5. **异步操作**: 所有邮件发送函数都是异步的，需要使用 `await`

## OpenAPI 文档

启动服务后访问 `http://localhost:8787/` 查看完整的 OpenAPI 文档和交互式 API 测试界面。
