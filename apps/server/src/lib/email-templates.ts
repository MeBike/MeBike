type EmailShellOptions = {
  readonly title: string;
  readonly previewText?: string;
  readonly bodyHtml: string;
};

type AuthOtpEmailParams = {
  readonly kind: "auth.verifyOtp" | "auth.resetOtp";
  readonly fullName: string;
  readonly otp: string;
  readonly expiresInMinutes: number;
};

type SubscriptionCreatedEmailParams = {
  readonly fullName: string;
  readonly packageName: string;
  readonly price: number;
  readonly maxUsages: number | null;
  readonly createdOn: string;
  readonly callBackUrl?: string;
};

const BRAND_NAME = "MeBike";
const BRAND_COLOR = "#007bff";
const TEXT_COLOR = "#1f2933";
const MUTED_COLOR = "#667085";
const BG_COLOR = "#f5f5f5";

export function buildAuthOtpEmail({
  kind,
  fullName,
  otp,
  expiresInMinutes,
}: AuthOtpEmailParams): { subject: string; html: string } {
  const safeName = escapeHtml(fullName);
  const safeOtp = escapeHtml(otp);
  const expiryText = `${Math.max(1, Math.floor(expiresInMinutes))} phút`;
  const title
    = kind === "auth.verifyOtp"
      ? "Mã OTP xác thực email"
      : "Mã OTP đặt lại mật khẩu";
  const subject
    = kind === "auth.verifyOtp"
      ? "Xác thực email MeBike"
      : "Đặt lại mật khẩu MeBike";
  const accentColor = kind === "auth.verifyOtp" ? BRAND_COLOR : "#dc3545";
  const intro
    = kind === "auth.verifyOtp"
      ? "Cảm ơn bạn đã đăng ký. Dùng mã OTP bên dưới để xác thực email."
      : "Bạn đã yêu cầu đặt lại mật khẩu. Dùng mã OTP bên dưới để tiếp tục.";

  const body = `
    <p style="margin: 0 0 16px; color: ${TEXT_COLOR};">Xin chào ${safeName},</p>
    <p style="margin: 0 0 20px; color: ${TEXT_COLOR};">${intro}</p>
    <div style="text-align: center; margin: 24px 0;">
      <div style="display: inline-block; padding: 12px 20px; background: ${accentColor}; color: #fff; border-radius: 10px; font-size: 24px; letter-spacing: 6px; font-weight: 700;">
        ${safeOtp}
      </div>
    </div>
    <p style="margin: 0 0 20px; color: ${TEXT_COLOR};">
      Mã này sẽ hết hạn sau <strong>${expiryText}</strong>. Vui lòng không chia sẻ mã này.
    </p>
    <p style="margin: 0; color: ${MUTED_COLOR}; font-size: 14px;">
      Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email này hoặc liên hệ đội ngũ hỗ trợ.
    </p>
  `;

  return {
    subject,
    html: renderEmailShell({
      title,
      previewText: title,
      bodyHtml: body,
    }),
  };
}

export function buildSubscriptionCreatedEmail({
  fullName,
  packageName,
  price,
  maxUsages,
  createdOn,
  callBackUrl,
}: SubscriptionCreatedEmailParams): { subject: string; html: string } {
  const safeName = escapeHtml(fullName);
  const safePackage = escapeHtml(packageName);
  const safeDate = escapeHtml(createdOn);
  const safePrice = escapeHtml(price.toLocaleString("vi-VN"));
  const usageLine
    = maxUsages === null ? "<strong>Không giới hạn</strong>" : escapeHtml(String(maxUsages));
  const safeUrl = callBackUrl ? escapeHtml(callBackUrl) : "#";

  const body = `
    <p style="margin: 0 0 16px; color: ${TEXT_COLOR};">Xin chào ${safeName},</p>
    <p style="margin: 0 0 20px; color: ${TEXT_COLOR};">
      Cảm ơn bạn đã <strong>đăng ký gói tháng của ${BRAND_NAME}</strong>.
    </p>
    <div style="background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 14px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
      Gói <strong>${safePackage}</strong> của bạn đang chờ được kích hoạt ⏳
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: ${TEXT_COLOR};">
      <tr>
        <td style="padding: 8px 0; font-weight: 600;">Tên gói:</td>
        <td style="padding: 8px 0;">${safePackage}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600;">Số lượt đặt tối đa / tháng:</td>
        <td style="padding: 8px 0;">${usageLine}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600;">Giá gói:</td>
        <td style="padding: 8px 0;">${safePrice}₫</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600;">Ngày đăng ký:</td>
        <td style="padding: 8px 0;">${safeDate}</td>
      </tr>
    </table>
    <p style="margin: 20px 0 0; color: ${TEXT_COLOR};">
      Sau khi thanh toán được xác nhận, gói thuê xe của bạn sẽ được kích hoạt tự động theo lịch.
    </p>
    <div style="text-align: center; margin: 24px 0 0;">
      <a href="${safeUrl}" style="background: ${BRAND_COLOR}; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
        Kiểm tra trạng thái gói
      </a>
    </div>
  `;

  return {
    subject: "Đăng ký gói tháng MeBike",
    html: renderEmailShell({
      title: "Đăng ký gói tháng thành công",
      previewText: `Gói ${packageName} đang chờ kích hoạt`,
      bodyHtml: body,
    }),
  };
}

function renderEmailShell({ title, previewText, bodyHtml }: EmailShellOptions): string {
  const safeTitle = escapeHtml(title);
  const safePreview = previewText ? escapeHtml(previewText) : "";
  return `
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${safeTitle}</title>
      </head>
      <body style="margin: 0; padding: 24px 16px; font-family: Arial, sans-serif; background-color: ${BG_COLOR};">
        <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 10px 24px rgba(16, 24, 40, 0.08);">
          ${safePreview ? `<div style="display: none; max-height: 0; overflow: hidden;">${safePreview}</div>` : ""}
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 22px; font-weight: 700; color: ${BRAND_COLOR};">${BRAND_NAME}</div>
            <div style="font-size: 18px; font-weight: 600; color: ${TEXT_COLOR}; margin-top: 8px;">${safeTitle}</div>
          </div>
          <div style="font-size: 15px; line-height: 1.6; color: ${TEXT_COLOR};">
            ${bodyHtml}
          </div>
          <div style="border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 16px; font-size: 13px; color: ${MUTED_COLOR}; text-align: center;">
            Trân trọng, đội ngũ ${BRAND_NAME}
          </div>
        </div>
      </body>
    </html>
  `;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
