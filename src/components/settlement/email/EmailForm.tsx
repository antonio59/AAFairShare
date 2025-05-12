import { useState } from "react";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Check, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmailSendingService } from "@/services/api/email";
import { TestEmailConfig } from "@/services/api/email/types";

interface EmailFormProps {
  users: User[];
  testConfig: TestEmailConfig;
  isSupabaseReady: boolean;
  isSending: boolean;
  isLoadingUsers: boolean;
  success: boolean;
  onSuccess: () => void;
  onError: (errorMessage: string, errorTrace?: string) => void;
  onSendStart: () => void;
}

export const EmailForm = ({
  users,
  testConfig,
  isSupabaseReady,
  isSending,
  isLoadingUsers,
  success,
  onSuccess,
  onError,
  onSendStart,
}: EmailFormProps) => {
  const { toast } = useToast();
  const [retryCount, setRetryCount] = useState(0);
  const [showDebugging, setShowDebugging] = useState(false);

  const handleSendTest = async () => {
    // Validate that we have at least two users
    if (users.length < 2) {
      toast({
        title: "Error",
        description: "Need at least two users to send test email",
        variant: "destructive",
      });
      return;
    }

    // Check if users have email property
    const usersWithEmail = users.filter(user => 'email' in user && user.email);
    if (usersWithEmail.length < 2) {
      toast({
        title: "Error",
        description: "Both users must have email addresses in the database. Please ensure the users have valid email addresses.",
        variant: "destructive",
      });
      return;
    }

    onSendStart();
    setRetryCount(prev => prev + 1);

    try {
      // Pass only the first two users with emails
      const result = await EmailSendingService.sendTestEmail(
        usersWithEmail.slice(0, 2),
        testConfig
      );
      
      if (result.success) {
        toast({
          title: "Email Sent Successfully",
          description: result.message,
        });
        onSuccess();
      } else {
        throw new Error(result.errorMessage || "Failed to send email");
      }
      
    } catch (error: unknown) {
      console.error("Error sending test email:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      // Provide more helpful error message for common issues
      let userFriendlyMessage = errorMessage;
      
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("network") || 
          errorMessage.includes("connect") || errorMessage.includes("Failed to send a request") || 
          errorMessage.includes("unavailable")) {
        userFriendlyMessage = "Unable to connect to the email service. This could be due to network issues or the edge function may be unavailable. Please check that the edge function is properly deployed in the Supabase dashboard.";
      } else if (errorMessage.includes("timeout")) {
        userFriendlyMessage = "The request timed out while trying to send the email. The server might be busy or experiencing issues.";
      }
      
      // Store stack trace if available
      if (error instanceof Error && error.stack) {
        onError(userFriendlyMessage, error.stack);
      } else {
        onError(userFriendlyMessage);
      }
      
      toast({
        title: "Failed to Send Email",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    }
  };

  const handleSetMaxRetryAttempt = () => {
    // Force a retry with a high count to attempt to trigger a different behavior
    setRetryCount(10);
    toast({
      title: "Reset Retry Count",
      description: "Retry count has been reset to maximum. Try sending the email again.",
    });
  };
  
  const toggleDebugging = () => {
    setShowDebugging(prev => !prev);
    if (!showDebugging) {
      toast({
        title: "Debugging Mode Enabled",
        description: "Advanced debugging options are now available.",
      });
    }
  };

  return (
    <div className="space-y-2">
      <Button 
        onClick={handleSendTest} 
        disabled={!isSupabaseReady || isSending || isLoadingUsers || users.length < 2}
        className="w-full"
      >
        {isSending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending Email...
          </>
        ) : success ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            Send Another Test Email
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Send Test Email {retryCount > 1 ? `(Attempt ${retryCount})` : ''}
          </>
        )}
      </Button>

      {retryCount > 1 && (
        <div className="flex flex-col gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSetMaxRetryAttempt} 
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Edge Function Connection
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDebugging}
            className="w-full text-xs"
          >
            <AlertTriangle className="mr-2 h-3 w-3" />
            {showDebugging ? "Hide Debugging Info" : "Show Debugging Info"}
          </Button>
          
          {showDebugging && (
            <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded border">
              <p className="font-semibold mb-1">Edge Function Debug Tips:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>The function may not be deployed or configured correctly</li>
                <li>Check the Supabase dashboard for function logs</li>
                <li>Verify CORS settings in the function</li>
                <li>Ensure required environment variables are set</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
