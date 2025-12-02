import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";

// Goal completion email
export const sendGoalCompletionEmailInternal = internalAction({
  args: {
    goalName: v.string(),
    goalIcon: v.string(),
    targetAmount: v.number(),
    totalSaved: v.number(),
    completedAt: v.string(),
    contributions: v.array(v.object({
      userName: v.string(),
      amount: v.number(),
    })),
    recipients: v.array(v.object({
      email: v.string(),
      name: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      console.error("RESEND_API_KEY not configured");
      return { success: false, error: "Email not configured" };
    }

    const emailFrom = process.env.EMAIL_FROM || "AAFairShare <noreply@aafairshare.online>";
    
    const iconEmoji = args.goalIcon === 'home' ? '🏠' : 
                      args.goalIcon === 'car' ? '🚗' : 
                      args.goalIcon === 'plane' ? '✈️' : '🎯';

    const contributionRows = args.contributions
      .map(c => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${c.userName}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #059669;">£${c.amount.toFixed(2)}</td>
        </tr>
      `)
      .join('');

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <div style="font-size: 64px; margin-bottom: 10px;">🎉</div>
          <h1 style="color: white; margin: 0; font-size: 28px;">Goal Completed!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">You did it together!</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background-color: #ecfdf5; padding: 20px 40px; border-radius: 12px;">
              <span style="font-size: 32px;">${iconEmoji}</span>
              <h2 style="margin: 10px 0 5px 0; color: #1f2937; font-size: 24px;">${args.goalName}</h2>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Completed on ${new Date(args.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;">
            <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">Total Saved</p>
            <p style="margin: 0; font-size: 42px; font-weight: bold; color: #059669;">£${args.totalSaved.toFixed(2)}</p>
            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">of £${args.targetAmount.toFixed(2)} target</p>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">🏆 Contribution Breakdown</h3>
            <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 600;">Team Member</th>
                  <th style="padding: 12px; text-align: right; color: #6b7280; font-weight: 600;">Contributed</th>
                </tr>
              </thead>
              <tbody>
                ${contributionRows}
              </tbody>
            </table>
          </div>

          <div style="text-align: center; padding: 20px; background-color: #fef3c7; border-radius: 8px;">
            <p style="margin: 0; color: #92400e; font-size: 16px;">
              ⭐ Amazing teamwork! Keep saving together! ⭐
            </p>
          </div>
        </div>

        <div style="padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <a href="https://aafairshare.online/savings-goals" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Your Goals</a>
        </div>

        <div style="padding: 20px; text-align: center;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">This is an automated celebration email from AAFairShare.</p>
        </div>
      </div>
    `;

    const results = [];
    for (const recipient of args.recipients) {
      if (!recipient.email) continue;
      
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [recipient.email],
            subject: `🎉 Goal Achieved: ${args.goalName}!`,
            html: emailBody,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error("Resend API error for", recipient.email, ":", error);
          results.push({ email: recipient.email, success: false, error });
        } else {
          const result = await response.json();
          console.log("Goal completion email sent to", recipient.email, ":", result.id);
          results.push({ email: recipient.email, success: true, id: result.id });
        }
      } catch (error) {
        console.error("Failed to send email to", recipient.email, ":", error);
        results.push({ email: recipient.email, success: false, error: String(error) });
      }
    }

    return { success: true, results };
  },
});

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
