import nodemailer from "nodemailer";

/**
 * sendEmail - Sends an email using SMTP
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - Email HTML content
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    // 1️⃣ Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // e.g., smtp.gmail.com
      port: Number(process.env.SMTP_PORT) || 587, // default TLS port
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // SMTP username
        pass: process.env.SMTP_PASS, // SMTP password or app password
      },
    });

    // 2️⃣ Define email options
    const mailOptions = {
      from: `"Vibio Team" <${process.env.SMTP_USER}>`, // sender
      to,
      subject,
      html,
    };

    // 3️⃣ Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId} to ${to}`);

    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw new Error("Email sending failed");
  }
};
