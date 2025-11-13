import type { Handler } from "@netlify/functions"
import { Resend } from "resend"
import PocketBase from "pocketbase"
import multipart from "parse-multipart-data"

const pb = new PocketBase(process.env.POCKETBASE_URL || "https://pb.aafairshare.online")

export const handler: Handler = async (event) => {
  console.log("Settlement email function called. Method:", event.httpMethod)
  
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" }
    }

    // Check for Resend API key (will support USESEND_API_KEY in future)
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured")
      return { 
        statusCode: 501, 
        body: JSON.stringify({ success: false, error: "Email service not configured" }) 
      }
    }

    const from = process.env.EMAIL_FROM || "no-reply@aafairshare.online"
    const resend = new Resend(resendApiKey)

    // Parse multipart form data
    const contentType = event.headers["content-type"] || event.headers["Content-Type"] || ""
    const boundary = contentType.split("boundary=")[1]
    
    if (!boundary) {
      throw new Error("Missing boundary in content-type header")
    }

    const parts = multipart.parse(Buffer.from(event.body!, "base64"), boundary)
    
    // Extract form fields
    const formData: Record<string, any> = {}
    const attachments: Array<{ filename: string; content: Buffer }> = []

    for (const part of parts) {
      const name = part.name
      if (!name) continue

      if (part.filename) {
        // This is a file attachment
        attachments.push({
          filename: part.filename,
          content: part.data
        })
      } else {
        // This is a form field
        formData[name] = part.data.toString("utf-8")
      }
    }

    console.log("Form data received:", {
      year: formData.year,
      month: formData.month,
      user1Id: formData.user1Id,
      user2Id: formData.user2Id,
      settlementAmount: formData.settlementAmount,
      settlementDirection: formData.settlementDirection,
      attachmentsCount: attachments.length
    })

    // Validate required fields
    if (!formData.year || !formData.month || !formData.user1Id || !formData.user2Id || 
        !formData.settlementAmount || !formData.settlementDirection) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ success: false, error: "Missing required fields" }) 
      }
    }

    // Fetch user data from Pocketbase
    let user1, user2
    try {
      user1 = await pb.collection("users").getOne(formData.user1Id, { fields: "id,username,email" })
      user2 = await pb.collection("users").getOne(formData.user2Id, { fields: "id,username,email" })
    } catch (err: any) {
      console.error("Error fetching users from Pocketbase:", err)
      return { 
        statusCode: 500, 
        body: JSON.stringify({ success: false, error: "Failed to fetch user data" }) 
      }
    }

    if (!user1.email || !user2.email) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ success: false, error: "User email addresses not found" }) 
      }
    }

    // Determine who owes whom
    const monthName = new Date(Number(formData.year), Number(formData.month) - 1)
      .toLocaleString("default", { month: "long" })
    
    let settlementMessage = ""
    if (formData.settlementDirection === "user1_owes") {
      settlementMessage = `${user1.username} owes ${user2.username} €${formData.settlementAmount}`
    } else {
      settlementMessage = `${user2.username} owes ${user1.username} €${formData.settlementAmount}`
    }

    // Generate HTML email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; }
            .settlement { background-color: #dbeafe; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>AAFairShare Settlement Report</h1>
              <p>${monthName} ${formData.year}</p>
            </div>
            <div class="content">
              <p>Hello ${user1.username} and ${user2.username},</p>
              <p>Your monthly settlement for ${monthName} ${formData.year} has been calculated.</p>
              <div class="settlement">
                <h2>Settlement Details</h2>
                <p><strong>${settlementMessage}</strong></p>
              </div>
              <p>Please find the detailed expense report and CSV export attached to this email.</p>
              <p>Thank you for using AAFairShare!</p>
            </div>
            <div class="footer">
              <p>This is an automated email from AAFairShare. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Prepare Resend attachments
    const resendAttachments = attachments.map(att => ({
      filename: att.filename,
      content: att.content
    }))

    console.log("Sending email via Resend to:", [user1.email, user2.email])

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from,
      to: [user1.email, user2.email],
      subject: `AAFairShare: Settlement Complete for ${monthName} ${formData.year}`,
      html: htmlContent,
      attachments: resendAttachments.length > 0 ? resendAttachments : undefined
    })

    console.log("Email sent successfully:", emailResponse)

    return { 
      statusCode: 200, 
      body: JSON.stringify({ success: true, message: "Settlement email sent successfully", data: emailResponse }) 
    }

  } catch (e: any) {
    console.error("Error in send-settlement-email function:", e)
    return { 
      statusCode: 500, 
      body: JSON.stringify({ success: false, error: e?.message || "Server error" }) 
    }
  }
}

export default handler
