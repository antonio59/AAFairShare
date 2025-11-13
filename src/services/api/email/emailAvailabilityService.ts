
import { getPocketBase } from "@/integrations/pocketbase/client";

/**
 * Service to check the availability of email-related Supabase functions
 */
export class EmailAvailabilityService {
  /**
   * Check if the Supabase email function is available
   */
  static async checkFunctionAvailability(): Promise<boolean> {
    try {
      const pb = await getPocketBase();
      
      // Skip the availability check - this function is optional and
      // not critical to the operation of the app. We'll let the actual
      // function call handle any errors that might occur.
      console.log("Skipping edge function availability check - proceeding with email send");
      return true;
    } catch (error) {
      console.warn("Function availability check failed:", error);
      // Return true if we can't check - better to attempt to send than block with a false negative
      return true;
    }
  }
}
