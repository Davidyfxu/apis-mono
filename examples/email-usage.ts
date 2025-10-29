/**
 * Email 工具函数使用示例
 *
 * 此文件展示了如何使用邮件发送功能
 */

import {
  sendEmail,
  sendTextEmail,
  sendHtmlEmail,
  sendNotificationEmail,
  verifyEmailConfig,
} from "../src/utils";

// ============================================
// 示例 1: 发送简单文本邮件
// ============================================
async function example1() {
  console.log("\n=== 示例 1: 发送简单文本邮件 ===");

  const result = await sendTextEmail(
    "recipient@example.com",
    "测试邮件",
    "这是一封简单的文本邮件。"
  );

  if (result.success) {
    console.log("✅ 邮件发送成功！");
    console.log("MessageID:", result.messageId);
  } else {
    console.error("❌ 邮件发送失败:", result.error);
  }
}

// ============================================
// 示例 2: 发送 HTML 格式邮件
// ============================================
async function example2() {
  console.log("\n=== 示例 2: 发送 HTML 格式邮件 ===");

  const html = `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h1 style="color: #4CAF50;">欢迎!</h1>
        <p>感谢您注册我们的服务。</p>
        <p>
          <a href="https://example.com" 
             style="background-color: #4CAF50; 
                    color: white; 
                    padding: 10px 20px; 
                    text-decoration: none; 
                    border-radius: 5px;">
            立即开始
          </a>
        </p>
      </body>
    </html>
  `;

  const result = await sendHtmlEmail("recipient@example.com", "欢迎注册", html);

  if (result.success) {
    console.log("✅ HTML邮件发送成功！");
  } else {
    console.error("❌ HTML邮件发送失败:", result.error);
  }
}

// ============================================
// 示例 3: 发送通知邮件（带数据）
// ============================================
async function example3() {
  console.log("\n=== 示例 3: 发送通知邮件 ===");

  const result = await sendNotificationEmail(
    "admin@example.com",
    "新用户注册通知",
    "系统检测到新用户注册",
    {
      用户名: "张三",
      邮箱: "zhangsan@example.com",
      注册时间: new Date().toLocaleString("zh-CN"),
      IP地址: "192.168.1.1",
    }
  );

  if (result.success) {
    console.log("✅ 通知邮件发送成功！");
  } else {
    console.error("❌ 通知邮件发送失败:", result.error);
  }
}

// ============================================
// 示例 4: 发送给多个收件人
// ============================================
async function example4() {
  console.log("\n=== 示例 4: 发送给多个收件人 ===");

  const result = await sendEmail({
    to: ["user1@example.com", "user2@example.com", "user3@example.com"],
    subject: "群发通知",
    text: "这是一条群发消息，所有收件人都会收到。",
  });

  if (result.success) {
    console.log("✅ 群发邮件发送成功！");
  } else {
    console.error("❌ 群发邮件发送失败:", result.error);
  }
}

// ============================================
// 示例 5: 发送带抄送和密送的邮件
// ============================================
async function example5() {
  console.log("\n=== 示例 5: 发送带抄送和密送的邮件 ===");

  const result = await sendEmail({
    to: "primary@example.com",
    cc: ["cc1@example.com", "cc2@example.com"],
    bcc: "bcc@example.com",
    subject: "重要通知",
    html: "<p>这是一封带有抄送和密送的邮件。</p>",
  });

  if (result.success) {
    console.log("✅ 邮件发送成功（含抄送、密送）！");
  } else {
    console.error("❌ 邮件发送失败:", result.error);
  }
}

// ============================================
// 示例 6: 发送带附件的邮件
// ============================================
async function example6() {
  console.log("\n=== 示例 6: 发送带附件的邮件 ===");

  const result = await sendEmail({
    to: "recipient@example.com",
    subject: "文件报告",
    html: "<p>请查收附件中的报告文件。</p>",
    attachments: [
      {
        filename: "report.txt",
        content: "这是报告内容...",
      },
      {
        filename: "data.json",
        content: JSON.stringify(
          {
            date: new Date().toISOString(),
            data: [1, 2, 3, 4, 5],
          },
          null,
          2
        ),
      },
    ],
  });

  if (result.success) {
    console.log("✅ 带附件的邮件发送成功！");
  } else {
    console.error("❌ 带附件的邮件发送失败:", result.error);
  }
}

// ============================================
// 示例 7: 验证邮件配置
// ============================================
async function example7() {
  console.log("\n=== 示例 7: 验证邮件配置 ===");

  const isValid = await verifyEmailConfig();

  if (isValid) {
    console.log("✅ 邮件配置验证成功！可以正常发送邮件。");
  } else {
    console.error("❌ 邮件配置验证失败！请检查配置。");
  }
}

// ============================================
// 示例 8: 实际业务场景 - 用户注册
// ============================================
async function example8() {
  console.log("\n=== 示例 8: 用户注册场景 ===");

  // 模拟用户注册数据
  const user = {
    name: "李四",
    email: "lisi@example.com",
    registeredAt: new Date(),
  };

  // 发送欢迎邮件给用户
  const userEmail = await sendHtmlEmail(
    user.email,
    "欢迎加入我们！",
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4CAF50;">欢迎，${user.name}！</h1>
      <p>感谢您注册我们的服务。</p>
      <p>您的账户已经创建成功，现在可以开始使用了。</p>
      <div style="margin: 20px 0;">
        <a href="https://example.com/login" 
           style="background-color: #4CAF50; 
                  color: white; 
                  padding: 12px 24px; 
                  text-decoration: none; 
                  border-radius: 5px;
                  display: inline-block;">
          立即登录
        </a>
      </div>
      <p style="color: #666; font-size: 12px;">
        如果您没有注册账户，请忽略此邮件。
      </p>
    </div>
    `
  );

  // 发送通知邮件给管理员
  const adminEmail = await sendNotificationEmail(
    "admin@example.com",
    "新用户注册通知",
    `用户 ${user.name} 已成功注册`,
    {
      用户名: user.name,
      邮箱: user.email,
      注册时间: user.registeredAt.toLocaleString("zh-CN"),
    }
  );

  console.log("用户邮件:", userEmail.success ? "✅ 成功" : "❌ 失败");
  console.log("管理员通知:", adminEmail.success ? "✅ 成功" : "❌ 失败");
}

// ============================================
// 示例 9: 实际业务场景 - 订单通知
// ============================================
async function example9() {
  console.log("\n=== 示例 9: 订单通知场景 ===");

  // 模拟订单数据
  const order = {
    id: "ORD-12345",
    customer: "王五",
    email: "wangwu@example.com",
    total: 299.99,
    items: ["商品A", "商品B"],
    createdAt: new Date(),
  };

  const result = await sendHtmlEmail(
    order.email,
    `订单确认 - ${order.id}`,
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2196F3;">订单确认</h1>
      <p>尊敬的 ${order.customer}，</p>
      <p>您的订单已成功创建！</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">订单详情</h3>
        <p><strong>订单号:</strong> ${order.id}</p>
        <p><strong>订单时间:</strong> ${order.createdAt.toLocaleString("zh-CN")}</p>
        <p><strong>商品:</strong> ${order.items.join(", ")}</p>
        <p><strong>总金额:</strong> ¥${order.total}</p>
      </div>
      
      <p>我们会尽快处理您的订单，感谢您的购买！</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          如有任何问题，请随时联系我们的客服。
        </p>
      </div>
    </div>
    `
  );

  if (result.success) {
    console.log("✅ 订单确认邮件发送成功！");
  } else {
    console.error("❌ 订单确认邮件发送失败:", result.error);
  }
}

// ============================================
// 运行所有示例（取消注释以运行）
// ============================================
async function runAllExamples() {
  console.log("📧 开始运行邮件发送示例...\n");

  // 首先验证配置
  await example7();

  // 然后运行其他示例（实际使用时请替换为真实邮箱）
  // await example1();
  // await example2();
  // await example3();
  // await example4();
  // await example5();
  // await example6();
  // await example8();
  // await example9();

  console.log("\n✨ 示例运行完成！");
}

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  example1,
  example2,
  example3,
  example4,
  example5,
  example6,
  example7,
  example8,
  example9,
};
