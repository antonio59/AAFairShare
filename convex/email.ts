import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";

export const sendSettlementEmail = action({
  args: {
    fromUserEmail: v.string(),
    fromUserName: v.string(),
    toUserEmail: v.string(),
    toUserName: v.string(),
    amount: v.number(),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    return await sendEmail(args);
  },
});

export const sendSettlementEmailInternal = internalAction({
  args: {
    fromUserEmail: v.string(),
    fromUserName: v.string(),
    toUserEmail: v.string(),
    toUserName: v.string(),
    amount: v.number(),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    return await sendEmail(args);
  },
});

async function sendEmail(args: {
  fromUserEmail: string;
  fromUserName: string;
  toUserEmail: string;
  toUserName: string;
  amount: number;
  month: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.error("RESEND_API_KEY not configured");
    return { success: false, error: "Email not configured" };
  }

  if (!args.toUserEmail) {
    console.error("No recipient email address");
    return { success: false, error: "No recipient email" };
  }

  const emailFrom = process.env.EMAIL_FROM || "AAFairShare <noreply@aafairshare.online>";

  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Settlement Completed</h2>
      <p>Hi ${args.toUserName},</p>
      <p><strong>${args.fromUserName}</strong> has marked the settlement for <strong>${args.month}</strong> as complete.</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;">Amount settled:</p>
        <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: bold; color: #2563eb;">£${args.amount.toFixed(2)}</p>
      </div>
      <p>You can view the settlement details in <a href="https://aafairshare.online/settlement" style="color: #2563eb;">AAFairShare</a>.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #9ca3af;">This is an automated email from AAFairShare.</p>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [args.toUserEmail],
        subject: `Settlement Complete - ${args.month}`,
        html: emailBody,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      return { success: false, error };
    }

    const result = await response.json();
    console.log("Settlement email sent:", result.id);
    return { success: true, id: result.id };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: String(error) };
  }
}
