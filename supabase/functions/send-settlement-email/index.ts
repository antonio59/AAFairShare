import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getUsersData } from "./userService.ts";
import { generateEmailContent } from "./emailTemplates.ts";
import { processAttachments } from "./attachmentHandler.ts";
import { corsHeaders } from "./corsConfig.ts";

Deno.serve(async (req) => {
  console.log("Settlement email function called");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request (CORS preflight)");
    return new Response(null, { 
      status: 204, // Explicitly use 204 No Content for OPTIONS
      headers: corsHeaders 
    });
  }

  try {
    // Initialize Supabase client with environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      throw new Error("Supabase URL or service key is not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize email sender with API key from environment
    const resendApiKey = Deno.env.get('SMTP_PASS');
    if (!resendApiKey) {
      console.error("SMTP_PASS (Resend API key) not set");
      throw new Error("SMTP_PASS (Resend API key) is not set");
    }
    
    // Get SMTP from address from environment variables
    const smtpFrom = Deno.env.get('SMTP_FROM');
    if (!smtpFrom) {
      console.error("SMTP_FROM variable not set");
      throw new Error("SMTP_FROM environment variable is not set");
    }
    
    console.log("Initializing Resend with API key");
    const resend = new Resend(resendApiKey);

    // Get form data
    console.log("Parsing form data from request");
    const formData = await req.formData();
    
    // Extract data from form submission
    const settlementData = {
      year: formData.get('year') as string,
      month: formData.get('month') as string,
      user1Id: formData.get('user1') as string,
      user2Id: formData.get('user2') as string,
      settlementAmount: formData.get('settlementAmount') as string,
      settlementDirection: formData.get('settlementDirection') as string,
      pdfAttachment: formData.get('reportPdf'),
      csvAttachment: formData.get('reportCsv')
    };

    // Log received data for debugging
    console.log("Form data received:", {
      year: settlementData.year,
      month: settlementData.month,
      user1Id: settlementData.user1Id,
      user2Id: settlementData.user2Id,
      settlementAmount: settlementData.settlementAmount,
      settlementDirection: settlementData.settlementDirection,
      pdfAttachment: settlementData.pdfAttachment ? "Present" : "Missing",
      csvAttachment: settlementData.csvAttachment ? "Present" : "Missing",
    });

    // Validate inputs
    if (!settlementData.year || !settlementData.month || !settlementData.user1Id || 
        !settlementData.user2Id || !settlementData.settlementAmount || !settlementData.settlementDirection) {
      console.error("Missing required fields:", {
        year: !settlementData.year,
        month: !settlementData.month,
        user1Id: !settlementData.user1Id,
        user2Id: !settlementData.user2Id,
        settlementAmount: !settlementData.settlementAmount,
        settlementDirection: !settlementData.settlementDirection,
      });
      throw new Error("Missing required fields for settlement email");
    }

    // Get user data from Supabase
    const users = await getUsersData(supabase, settlementData.user1Id, settlementData.user2Id);
    console.log("User data found:", { user1: users.user1.name, user2: users.user2.name });

    // Format month name
    const monthName = new Date(Number(settlementData.year), Number(settlementData.month) - 1)
      .toLocaleString('default', { month: 'long' });
    
    // Process attachments
    const attachments = await processAttachments(
      settlementData.pdfAttachment, 
      settlementData.csvAttachment, 
      settlementData.year, 
      settlementData.month
    );

    // Generate email content
    const { htmlContent, settlementMessage } = generateEmailContent(
      users.user1, 
      users.user2, 
      settlementData.settlementDirection, 
      settlementData.settlementAmount, 
      monthName, 
      settlementData.year
    );

    // Log important information for debugging
    console.log("Sending email with Resend");
    console.log(`From: ${smtpFrom}`);
    console.log(`To: ${users.user1.email}, ${users.user2.email}`);
    console.log(`Attachments count: ${attachments.length}`);

    // Send the email with Resend
    const emailResponse = await resend.emails.send({
      from: smtpFrom,
      to: [users.user1.email, users.user2.email],
      subject: `AAFairShare: Settlement Complete for ${monthName} ${settlementData.year}`,
      html: htmlContent,
      attachments: attachments.length > 0 ? attachments : undefined
    });

    console.log("Email sent successfully:", emailResponse);

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Settlement email sent successfully" 
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );

  } catch (error) {
    console.error("Error in send-settlement-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
});
