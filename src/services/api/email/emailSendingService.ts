import { User } from "@/types";
import { getPocketBase } from "@/integrations/pocketbase/client";
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

      const { formData, html, text } = await EmailFormDataService.prepareFormData(users, config);
      const to = users.slice(0, 2).map(u => ('email' in u && u.email ? u.email : '')).filter(Boolean);
      const subject = "AAFairShare Settlement"

      const res = await fetch('/.netlify/functions/send-settlement-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html, text })
      })
      if (!res.ok) {
        const errText = await res.text()
        return { success: false, errorMessage: errText }
      }
      const data = await res.json()
      if (!data?.success) {
        return { success: false, errorMessage: data?.error || 'Unknown error' }
      }
      const emailAddresses = to.join(' and ')
      return { success: true, message: `Test settlement email was sent to ${emailAddresses}` }
      
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
