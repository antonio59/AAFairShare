import { User } from "@/types";
import { getSupabase } from "@/integrations/supabase/client";
import { TestEmailConfig, EmailSendingResult } from "./types";
import { EmailAvailabilityService } from "./emailAvailabilityService";
import { EmailFormDataService } from "./emailFormDataService";

/**
 * Service for sending settlement emails
 */
export class EmailSendingService {
  /**
   * Send test email to users
   */
  static async sendTestEmail(users: User[], config?: TestEmailConfig): Promise<EmailSendingResult> {
    try {
      if (users.length < 2) {
        return {
          success: false,
          errorMessage: "Need at least two users to send test email"
        };
      }

      // Check if all users have email addresses
      const usersWithEmail = users.filter(user => 'email' in user && user.email);
      if (usersWithEmail.length < 2) {
        return {
          success: false,
          errorMessage: "Both users must have email addresses"
        };
      }

      // Get Supabase client first so we fail early if there's an authentication issue
      const supabase = await getSupabase();
      if (!supabase) {
        throw new Error("Failed to initialize Supabase client");
      }
      
      console.log("Supabase client initialized successfully");
      
      // Prepare form data
      console.log("Preparing form data...");
      const { formData } = await EmailFormDataService.prepareFormData(users, config);
      
      console.log("Invoking edge function send-settlement-email");

      // Call the edge function with proper headers and longer timeout
      const { data, error } = await supabase.functions.invoke("send-settlement-email", {
        body: formData,
        headers: {
          'Request-Timeout': '120000ms', // Increased to 2 minutes timeout
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      });

      if (error) {
        console.error("Edge function error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
          context: error.context
        });
        
        // Provide more specific error message for edge function availability issues
        if (error.message.includes("Failed to send a request") || error.message.includes("fetch")) {
          throw new Error(`Edge function unavailable: The send-settlement-email function appears to be unavailable. This could be due to deployment issues or temporary service disruption. Error: ${error.message}`);
        }
        
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data?.success) {
        console.error("Edge function returned error:", data?.error || "Unknown error");
        throw new Error(data?.error || "Unknown error from edge function");
      }

      console.log("Email sent successfully:", data);
      const emailAddresses = users.slice(0, 2).map(user => 
        'email' in user && user.email ? user.email : 'No email'
      ).join(' and ');
      
      return {
        success: true,
        message: `Test settlement email was sent to ${emailAddresses}`
      };
      
    } catch (error: unknown) {
      console.error("Error sending test email:", error);
      
      let errorMessage = "Unknown error occurred";
      let errorCode: string | undefined = undefined;

      if (error instanceof Error) {
        errorMessage = error.message;
        if (typeof error === 'object' && error !== null && 'code' in error) {
            errorCode = (error as { code: string }).code;
        }
        
        // Provide more helpful error message for common issues
        if (errorMessage.includes("Failed to fetch") || errorMessage.includes("network") || errorCode === 'ECONNREFUSED') {
          errorMessage = "Network connection problem. Please check your internet connection and try again.";
        } else if (errorMessage.includes("Email address is not confirmed")) {
          errorMessage = "Email address is not confirmed. Please confirm your email address and try again.";
        } else if (errorMessage.includes("timeout")) {
          errorMessage = "The request timed out while trying to send the email. The server might be busy or experiencing issues.";
        }
      }
      
      // Return error details
      return {
        success: false,
        errorMessage,
        errorTrace: error instanceof Error ? error.stack : undefined
      };
    }
  }
}
