"use server";

import nodemailer from "nodemailer";

export async function sendContactEmail(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !subject || !message) {
    throw new Error("All required fields must be filled");
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_APP,
        pass: process.env.EMAIL_PASSWORD_APP,
      },
    });

    const htmlContent = `
      <h2>Liên hệ từ khách hàng</h2>
      <p><strong>Họ và tên:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Số điện thoại:</strong> ${phone || "Không cung cấp"}</p>
      <p><strong>Chủ đề:</strong> ${subject}</p>
      <p><strong>Nội dung:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    `;

    const mailOptions = {
      from: `"MeBike Contact" <${process.env.EMAIL_APP}>`,
      to: email,
      bcc: "nguyennvse173423@fpt.edu.vn",
      subject: `Liên hệ từ ${name}: ${subject}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending contact email:", error);
    throw new Error("Failed to send email");
  }
}