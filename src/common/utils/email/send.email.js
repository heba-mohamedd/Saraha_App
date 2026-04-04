import nodemailer from "nodemailer";
import { EMAIL, PASSWORD } from "../../../../config/config.service.js";

export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL,
      pass: PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `"Saraha App" <${EMAIL}>`,
    to: to,
    subject: subject || "Hello",
    html: html || "<b>Hello</b>",
    attachments: attachments || [],
  });

  console.log("Message sent:", info.messageId);

  return info.accepted.length > 0 ? true : false;
};

export const generateOtp = async () => {
  return Math.floor(Math.random() * 900000 + 100000);
};
