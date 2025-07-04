import nodemailer from "nodemailer";
import { google } from "googleapis";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { generateOrderToken } from "../utils/helper.js";
import { Order } from "../model/order.js";
const route = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentials = {
  type: process.env.GOOGLE_TYPE,
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: process.env.GOOGLE_AUTH_URI,
  token_uri: process.env.GOOGLE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
  universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN,
};


const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function writeToSheet(formData, orderToken) {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: authClient });

  const spreadsheetId = "1WamlEguF30SA7HbtfYqXTH1TXNPXU4IkvGyoGkvPTVI";
  const range = "Sheet1!A1";

  const values = [
    [
      new Date().toLocaleString(),
      orderToken,
      formData.orderfor,
      formData.businessName,
      formData.ownerName,
      formData.domainName || "N/A",
      formData.businessType,
      formData.email,
      formData.contactNumber,
      formData.designType,
      formData.designPreferences || "N/A",
      formData.dynamicRequirements || "N/A",
      formData.totalPrice || "Pending Quote",
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    resource: { values },
  });
}
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

route.post("/submit-order", async (req, res) => {
  try {
    const formData = req.body;
    const orderToken = generateOrderToken(formData.orderfor);
    const newOrder = new Order({
      orderToken,
      orderfor: formData.orderfor,
      businessName: formData.businessName,
      ownerName: formData.ownerName,
      domainName: formData.domainName,
      businessType: formData.businessType,
      email: formData.email,
      contactNumber: formData.contactNumber,
      designPreferences: formData.designPreferences,
      designType: formData.designType,
      dynamicRequirements: formData.dynamicRequirements,
      totalPrice: formData.totalPrice,
    });
    const savedOrder = await newOrder.save();
    await writeToSheet(formData, orderToken);
    console.log("wokring")
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">New ${
          formData.orderfor
        } Development Order</h2>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Order Token: <span style="color: #dc2626; font-weight: bold;">${orderToken}</span></h3>
        </div>
        
        <h3 style="color: #374151;">Business Information:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Order For:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${
            formData.orderfor
          }</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Business Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${
            formData.businessName
          }</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Owner Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${
            formData.ownerName
          }</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Domain Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${
            formData.domainName || "Not specified"
          }</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Business Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${
            formData.businessType
          }</td></tr>
        </table>

        
        <h3 style="color: #374151;">Contact Information:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${
            formData.email
          }</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Contact Number:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${
            formData.contactNumber
          }</td></tr>
        </table>
        
        <h3 style="color: #374151;">Design Preferences:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Design Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${
            formData.designType
          }</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Design Preferences:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${
            formData.designPreferences || "Not specified"
          }</td></tr>
          ${
            formData.designType === "dynamic"
              ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Dynamic Requirements:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formData.dynamicRequirements}</td></tr>`
              : ""
          }
        </table>
        
        <h3 style="color: #374151;">Pricing:</h3>
        <p style="background-color: #fef3c7; padding: 10px; border-radius: 6px;"><strong>Total Price:</strong> ${
          formData.totalPrice || "Custom pricing for dynamic ${Fr}"
        }</p>
        
        <p style="color: #6b7280;"><strong>Submission Date:</strong> ${new Date().toLocaleString()}</p>
        <p style="color: #6b7280;"><strong>Order ID:</strong> ${
          savedOrder._id
        }</p>
      </div>
    `;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && newOrder.email) {
      const adminMailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `New ${formData.orderfor} Order #${orderToken} from ${formData.businessName}`,
        html: emailContent,
      };

      const customerMailOptions = {
        from: process.env.EMAIL_USER,
        to: formData.email,
        subject: `${formData.orderfor} Development Order Confirmation - Token: ${orderToken}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Thank you for your ${
              formData.orderfor
            } development order!</h2>
            <p>Dear ${formData.ownerName},</p>
            <p>We have received your ${
              formData.orderfor
            } development order for <strong>${
          formData.businessName
        }</strong>.</p>
            
            <div style="background-color: #ecfdf5; border: 2px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #065f46; margin-top: 0;">Your Order Token</h3>
              <p style="font-size: 24px; font-weight: bold; color: #dc2626; margin: 10px 0; letter-spacing: 2px;">${orderToken}</p>
              <p style="color: #374151; font-size: 14px; margin-bottom: 0;">Please save this token for future reference</p>
            </div>
            
            <p>Our team will review your requirements and get back to you within 24 hours.</p>
            
            <h3 style="color: #374151;">Order Summary:</h3>
            <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
              <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>Order For:</strong></td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
                formData.orderfor
              }</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>Design Type:</strong></td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
                formData.designType
              }</td></tr>
              <tr><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;"><strong>Total Price:</strong></td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${
                formData.totalPrice ||
                "Custom pricing - we will send you a detailed quote"
              }</td></tr>
              <tr><td style="padding: 12px;"><strong>Status:</strong></td><td style="padding: 12px;"><span style="background-color: #fbbf24; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Pending Review</span></td></tr>
            </table>
            
            <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #1e40af; margin-top: 0;">What's Next?</h4>
              <ul style="color: #374151; margin-bottom: 0;">
                <li>Our team will review your requirements within 24 hours</li>
                <li>You'll receive a detailed project proposal via email</li>
                <li>We'll schedule a consultation call to discuss your project</li>
                <li>Development will begin once the proposal is approved</li>
              </ul>
            </div>
            
            <p>If you have any questions, please don't hesitate to contact us and mention your order token: <strong>${orderToken}</strong></p>
            <p>Best regards,<br>${formData.orderfor} Development Team</p>
          </div>
        `,
      };

      try {
        await Promise.all([
          transporter.sendMail(adminMailOptions),
          transporter.sendMail(customerMailOptions),
        ]);
        console.log("Emails sent successfully");
      } catch (emailError) {
        console.error("Error sending emails:", emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Order submitted successfully! Confirmation email sent.",
      orderToken: orderToken,
      orderId: savedOrder._id,
      orderData: savedOrder,
    });
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process order. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

route.post("/contact", async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: `New Contact Message: ${subject}`,
    html: `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; background: #f9f9f9; border: 1px solid #eee;">
      <h2 style="color: #333; border-bottom: 2px solid #ec4899; padding-bottom: 10px;">📬 New Contact Message</h2>
      <p style="font-size: 16px; color: #555;"><strong>Name:</strong> ${name}</p>
      <p style="font-size: 16px; color: #555;"><strong>Email:</strong> ${email}</p>
      <p style="font-size: 16px; color: #555;"><strong>Phone:</strong> ${
        phone || "Not provided"
      }</p>
      <p style="font-size: 16px; color: #555;"><strong>Subject:</strong> ${subject}</p>
      <div style="margin-top: 20px;">
        <p style="font-size: 16px; color: #555;"><strong>Message:</strong></p>
        <div style="padding: 15px; background: #fff; border-left: 4px solid #ec4899; color: #333; border-radius: 5px; font-size: 15px; white-space: pre-line;">
          ${message}
        </div>
      </div>
      <p style="margin-top: 30px; font-size: 13px; color: #999; text-align: center;">This message was sent from your portfolio/contact form.</p>
    </div>
  `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Mail error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

export default route;
