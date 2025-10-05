import fs from "node:fs";
import path from "node:path";

type TemplateData = {
  [key: string]: string;
};

const MBIKE_PRIMARY_COLOR = "#007bff";

const FALLBACK_TEMPLATES: Record<string, (data: TemplateData) => string> = {
  "verify-email.html": data => `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác nhận đăng ký - MeBike</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
        <h1 style="color: ${MBIKE_PRIMARY_COLOR}; text-align: center;">MeBike</h1>
        <h2>Xin chào ${data.fullname || "bạn"},</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản MeBike. Vui lòng nhấn vào nút bên dưới để xác nhận email của bạn:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verifyURL || "#"}" style="background: ${MBIKE_PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Xác nhận đăng ký</a>
        </div>
        <p style="color: #666; font-size: 14px;">Trân trọng,<br>Đội ngũ MeBike</p>
      </div>
    </body>
    </html>
  `,

  "forgot-password.html": data => `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Quên mật khẩu - MeBike</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
        <h1 style="color: ${MBIKE_PRIMARY_COLOR}; text-align: center;">MeBike</h1>
        <h2>Xin chào ${data.fullname || "bạn"},</h2>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào nút bên dưới để tiếp tục:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetURL || "#"}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Đặt lại mật khẩu</a>
        </div>
        <p style="color: #666; font-size: 14px;">Trân trọng,<br>Đội ngũ MeBike</p>
      </div>
    </body>
    </html>
  `,

  "google-register-success.html": data => `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Chào mừng bạn đến với MeBike</title>
    </head>
    <body>
      <p>Xin chào ${data.fullname || "bạn"},</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản MeBike qua Google.</p>
      <p>Đây là thông tin đăng nhập của bạn:</p>
      <ul>
        <li><strong>Email:</strong> ${data.email || ""}</li>
        <li><strong>Mật khẩu tạm thời:</strong> ${data.password || ""}</li>
      </ul>
      <p>Vui lòng đổi mật khẩu sau khi đăng nhập. Một email xác thực cũng đã được gửi đến bạn.</p>
      <a href="${data.loginURL || "#"}">Đăng nhập ngay</a>
    </body>
    </html>
  `,

  "resend-verify-email.html": data => `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Gửi lại email xác thực - MeBike</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
        <h1 style="color: ${MBIKE_PRIMARY_COLOR}; text-align: center;">MeBike</h1>
        <h2>Xin chào ${data.fullname || "bạn"},</h2>
        <p>Bạn đã yêu cầu gửi lại email xác thực. Vui lòng nhấn vào nút bên dưới để hoàn tất việc xác thực tài khoản:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verifyURL || "#"}" style="background: ${MBIKE_PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Xác thực tài khoản</a>
        </div>
        <p style="color: #666; font-size: 14px;">Trân trọng,<br>Đội ngũ MeBike</p>
      </div>
    </body>
    </html>
  `,
};

export function readEmailTemplate(templateName: string, data: TemplateData): string {
  try {
    const templatePath = path.join(__dirname, "templates", templateName);
    let htmlContent = fs.readFileSync(templatePath, "utf-8");
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      htmlContent = htmlContent.replace(regex, data[key]);
    });
    return htmlContent;
  }
  catch (error) {
    console.error(`Error reading email template ${templateName}:`, error);
    const fallbackTemplate = FALLBACK_TEMPLATES[templateName];
    if (fallbackTemplate) {
      return fallbackTemplate(data);
    }
    // fallback chung nếu không có template cụ thể
    return `Xin chào ${data.fullname || "bạn"}, cảm ơn bạn đã sử dụng dịch vụ của MeBike.`;
  }
}
