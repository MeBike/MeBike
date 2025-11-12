import fs from 'node:fs'
import path from 'node:path'

type TemplateData = {
  [key: string]: string
}

const MBIKE_PRIMARY_COLOR = '#007bff'

const FALLBACK_TEMPLATES: Record<string, (data: TemplateData) => string> = {
  'verify-email.html': (data) => `
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
        <h2>Xin chào ${data.fullname || 'bạn'},</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản MeBike. Vui lòng nhấn vào nút bên dưới để xác nhận email của bạn:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verifyURL || '#'}" style="background: ${MBIKE_PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Xác nhận đăng ký</a>
        </div>
        <p style="color: #666; font-size: 14px;">Trân trọng,<br>Đội ngũ MeBike</p>
      </div>
    </body>
    </html>
  `,

  'forgot-password.html': (data) => `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Quên mật khẩu - MeBike</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
        <h1 style="color: ${MBIKE_PRIMARY_COLOR}; text-align: center;">MeBike</h1>
        <h2>Xin chào ${data.fullname || 'bạn'},</h2>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào nút bên dưới để tiếp tục:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetURL || '#'}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Đặt lại mật khẩu</a>
        </div>
        <p style="color: #666; font-size: 14px;">Trân trọng,<br>Đội ngũ MeBike</p>
      </div>
    </body>
    </html>
  `,

  'google-register-success.html': (data) => `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Chào mừng bạn đến với MeBike</title>
    </head>
    <body>
      <p>Xin chào ${data.fullname || 'bạn'},</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản MeBike qua Google.</p>
      <p>Đây là thông tin đăng nhập của bạn:</p>
      <ul>
        <li><strong>Email:</strong> ${data.email || ''}</li>
        <li><strong>Mật khẩu tạm thời:</strong> ${data.password || ''}</li>
      </ul>
      <p>Vui lòng đổi mật khẩu sau khi đăng nhập. Một email xác thực cũng đã được gửi đến bạn.</p>
      <a href="${data.loginURL || '#'}">Đăng nhập ngay</a>
    </body>
    </html>
  `,

  'resend-verify-email.html': (data) => `
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
        <h2>Xin chào ${data.fullname || 'bạn'},</h2>
        <p>Bạn đã yêu cầu gửi lại email xác thực. Vui lòng nhấn vào nút bên dưới để hoàn tất việc xác thực tài khoản:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verifyURL || '#'}" style="background: ${MBIKE_PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Xác thực tài khoản</a>
        </div>
        <p style="color: #666; font-size: 14px;">Trân trọng,<br>Đội ngũ MeBike</p>
      </div>
    </body>
    </html>
  `,

  'neer-expiry-reservation.html': (data) => `
    <!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cảnh báo Đặt trước Gần Hết Hạn - MeBike</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
        <h1 style="color: ${MBIKE_PRIMARY_COLOR}; text-align: center; margin-bottom: 20px;">MeBike</h1>
        
        <h2 style="font-size: 18px; color: #333333; margin-top: 0;">Xin chào ${data.fullname},</h2>
        
        <p style="color: #333333; line-height: 1.5;">Đây là lời nhắc nhở từ MeBike:</p>

        <div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <p style="font-size: 16px; font-weight: bold; margin: 0;">Phiên đặt trước xe đạp của bạn sắp <span style="color: #dc3545;">HẾT HẠN TRONG VÒNG 15 PHÚT</span>.</p>
        </div>

        <p style="color: #333333; line-height: 1.5;">Để bắt đầu chuyến đi, vui lòng đến trạm xe và mở khóa xe đạp đã đặt bằng ứng dụng của bạn ngay lập tức.</p>
        
        <p style="color: #333333; line-height: 1.5;">Nếu bạn không mở khóa xe trước thời điểm hết hạn, phiên đặt trước sẽ **tự động bị hủy**.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.callBackUrl || '#'}" style="background: ${MBIKE_PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Mở Ứng Dụng để Mở Khóa</a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">Trân trọng,<br>Đội ngũ MeBike</p>
    </div>
</body>
</html>

  `,
  'success-reservation.html': (data) => `
    <!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đặt Trước Xe Đạp Thành Công - MeBike</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
        <h1 style="color: ${MBIKE_PRIMARY_COLOR}; text-align: center; margin-bottom: 20px;">MeBike</h1>
        
        <h2 style="font-size: 18px; color: #333333; margin-top: 0;">Xin chào ${data.fullname},</h2>
        
        <p style="color: #333333; line-height: 1.5;">Chúc mừng! Bạn đã <strong>đặt trước xe đạp thành công</strong>.</p>

        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <p style="font-size: 16px; font-weight: bold; margin: 0;">
                Xe <strong>#${data.bike_id}</strong> đã được giữ cho bạn tại <strong>${data.station_name}</strong>
            </p>
        </div>

        <table style="width: 100%; margin: 20px 0; font-size: 15px; color: #333333;">
            <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 40%;">Mã xe:</td>
                <td style="padding: 8px 0;">#${data.bike_id}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Trạm xe:</td>
                <td style="padding: 8px 0;">${data.station_name}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Thời gian đặt:</td>
                <td style="padding: 8px 0;">${data.start_time}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #dc3545;">Hạn mở khóa:</td>
                <td style="padding: 8px 0; color: #dc3545;"><strong>${data.end_time}</strong></td>
            </tr>
        </table>

        <p style="color: #333333; line-height: 1.5;">
            Vui lòng đến trạm xe và <strong>mở khóa xe trước ${data.end_time}</strong> để bắt đầu chuyến đi.
        </p>
        
        <p style="color: #333333; line-height: 1.5;">
            Nếu không mở khóa kịp thời, phiên đặt trước sẽ <strong>tự động bị hủy</strong> và xe sẽ được giải phóng.
        </p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.callBackUrl || '#'}" 
               style="background: ${MBIKE_PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
               Mở Ứng Dụng để Mở Khóa
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
            <strong>Mẹo:</strong> Mở ứng dụng để xem vị trí trạm xe và hướng dẫn chi tiết.<br><br>
            Trân trọng,<br><strong>Đội ngũ MeBike</strong>
        </p>
    </div>
</body>
</html>
`,
'no-bike-available.html': (data) => `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Không Có Xe Khả Dụng - MeBike</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
        <h1 style="color: ${MBIKE_PRIMARY_COLOR}; text-align: center; margin-bottom: 20px;">MeBike</h1>
        
        <h2 style="font-size: 18px; color: #333333; margin-top: 0;">Xin chào ${data.fullname},</h2>
        
        <p style="color: #333333; line-height: 1.5;">
            Rất tiếc! Hiện tại <strong>không có xe khả dụng</strong> cho khung giờ cố định bạn đã đăng ký.
        </p>

        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <p style="font-size: 16px; font-weight: bold; margin: 0;">
                Không có xe tại <strong>${data.station_name}</strong> cho khung giờ <strong>${data.slot_time} ${data.date}</strong>.
            </p>
        </div>

        <table style="width: 100%; margin: 20px 0; font-size: 15px; color: #333333;">
            <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 40%;">Trạm xe:</td>
                <td style="padding: 8px 0;">${data.station_name}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Khung giờ:</td>
                <td style="padding: 8px 0;">${data.slot_time}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; font-weight: bold;">Ngày:</td>
                <td style="padding: 8px 0;">${data.date}</td>
            </tr>
        </table>

        <p style="color: #333333; line-height: 1.5;">
            Bạn có thể thử chọn <strong>khung giờ khác</strong> hoặc <strong>liên hệ đội ngũ MeBike</strong> để được hỗ trợ sắp xếp lại lịch.
        </p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.callBackUrl || '#'}" 
               style="background: ${MBIKE_PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
               Chọn Lại Khung Giờ
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
            <strong>Mẹo:</strong> Truy cập ứng dụng MeBike để xem trạm xe gần nhất còn xe khả dụng.<br><br>
            Trân trọng,<br><strong>Đội ngũ MeBike</strong>
        </p>
    </div>
</body>
</html>
`,

'success-subscription.html': (data) => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Đăng Ký Gói Tháng - MeBike</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
    <h1 style="color: ${MBIKE_PRIMARY_COLOR}; text-align: center; margin-bottom: 20px;">MeBike</h1>

    <h2 style="font-size: 18px; color: #333; margin-top: 0;">Xin chào ${data.fullname},</h2>

    <p style="color: #333; line-height: 1.5;">
      Cảm ơn bạn đã <strong>đăng ký gói tháng của MeBike</strong>!
    </p>

    <div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
      <p style="font-size: 16px; font-weight: bold; margin: 0;">
        Gói <strong>${data.package_name}</strong> của bạn đang chờ được kích hoạt ⏳
      </p>
    </div>

    <table style="width: 100%; margin: 20px 0; font-size: 15px; color: #333;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 45%;">Tên gói:</td>
        <td style="padding: 8px 0;">${data.package_name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Số lượt đặt tối đa / tháng:</td>
        <td style="padding: 8px 0;">
          ${data.max_reservations_per_month ? data.max_reservations_per_month : '<strong>Không giới hạn</strong>'}
        </td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Giá gói:</td>
        <td style="padding: 8px 0;">${data.price}₫</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Ngày đăng ký:</td>
        <td style="padding: 8px 0;">${data.created_at}</td>
      </tr>
    </table>

    <p style="color: #333; line-height: 1.5;">
      Sau khi thanh toán được xác nhận, gói thuê xe của bạn sẽ được <strong>kích hoạt tự động sau 10 ngày</strong>.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.callBackUrl || '#'}"
         style="background: ${MBIKE_PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
         Kiểm Tra Trạng Thái Gói
      </a>
    </div>

    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      <strong>Lưu ý:</strong> Nếu bạn gặp vấn đề trong quá trình thanh toán, vui lòng liên hệ với đội ngũ hỗ trợ của MeBike để được giúp đỡ.<br><br>
      Trân trọng,<br><strong>Đội ngũ MeBike</strong>
    </p>
  </div>
</body>
</html>
`
,
  "verify-otp.html": data => `
    <!DOCTYPE html>
    <html lang="vi">
    <head><meta charset="UTF-8"><title>Mã OTP xác thực - MeBike</title></head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Xin chào ${data.fullname || "bạn"},</h2>
      <p>Mã OTP để xác thực email MeBike của bạn là:</p>
      <p style="font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 20px 0;">${data.otp || "######"}</p>
      <p>Mã này sẽ hết hạn sau ${data.expiryMinutes || "vài"} phút.</p>
      <p style="color: #666;">Trân trọng,<br>Đội ngũ MeBike</p>
    </body>
    </html>
  `,

  "forgot-password-otp.html": data => `
    <!DOCTYPE html>
    <html lang="vi">
    <head><meta charset="UTF-8"><title>Mã OTP đặt lại mật khẩu - MeBike</title></head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Xin chào ${data.fullname || "bạn"},</h2>
      <p>Bạn đã yêu cầu đặt lại mật khẩu. Mã OTP của bạn là:</p>
      <p style="font-size: 24px; font-weight: bold; color: #dc3545; letter-spacing: 5px; margin: 20px 0;">${data.otp || "######"}</p>
      <p>Mã này sẽ hết hạn sau ${data.expiryMinutes || "vài"} phút. Vui lòng không chia sẻ mã này.</p>
      <p style="color: #666;">Trân trọng,<br>Đội ngũ MeBike</p>
    </body>
    </html>
  `,
};

export function readEmailTemplate(templateName: string, data: TemplateData): string {
  // try {
  //   const templatePath = path.join(__dirname, "templates", templateName);
  //   let htmlContent = fs.readFileSync(templatePath, "utf-8");
  //   Object.keys(data).forEach((key) => {
  //     const regex = new RegExp(`{{${key}}}`, "g");
  //     htmlContent = htmlContent.replace(regex, data[key]);
  //   });
  //   return htmlContent;
  // }
  // catch (error) {
  //   console.error(`Error reading email template ${templateName}:`, error);
  //   const fallbackTemplate = FALLBACK_TEMPLATES[templateName];
  //   if (fallbackTemplate) {
  //     return fallbackTemplate(data);
  //   }
  //   // fallback chung nếu không có template cụ thể
  //   return `Xin chào ${data.fullname || "bạn"}, cảm ơn bạn đã sử dụng dịch vụ của MeBike.`;
  // }
  const fallbackTemplate = FALLBACK_TEMPLATES[templateName];

  if (fallbackTemplate) {
    return fallbackTemplate(data);
  }
  console.error(`Email template ${templateName} not found in FALLBACK_TEMPLATES.`);
  return `Xin chào ${data.fullname || "bạn"}, cảm ơn bạn đã sử dụng dịch vụ của MeBike.`;
}
