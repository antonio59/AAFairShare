import { supabase } from "@/lib/supabaseClient";
import { generateSettlementReportPDF } from "@/services/export/settlementReportService";
import { exportToCSV } from "@/services/export/csvExportService";
import type { MonthData, User } from "@/types";

// Helper to get environment variables
const SUPABASE_PROJECT_REF = "gsvyxsddmddipeoduyys"; // Provided by user
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const EDGE_FUNCTION_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/send-settlement-email`;

export const sendSettlementEmail = async (
  monthData: MonthData,
  year: number,
  month: number,
  users: User[]
): Promise<void> => {
  try {
    if (users.length < 2) {
      throw new Error("At least two users are required to send a settlement email.");
    }
    const user1 = users[0];
    const user2 = users[1];

    // Generate PDF report
    const pdfReport = generateSettlementReportPDF(
      {
        totalExpenses: monthData.totalExpenses,
        user1Paid: monthData.user1Paid,
        user2Paid: monthData.user2Paid,
        settlement: monthData.settlement,
        settlementDirection: monthData.settlementDirection,
      },
      monthData.expenses,
      year,
      month,
      user1.username, // Use username as per memory ee32a3f6
      user2.username, // Use username as per memory ee32a3f6
      user1.id,       // Pass user1.id
      user2.id        // Pass user2.id
    );
    
    // Generate CSV report
    const csvContent = exportToCSV(
      monthData.expenses, 
      year, 
      month, 
      user1.username, 
      user2.username,
      monthData.totalExpenses,
      monthData.user1Paid,
      monthData.user2Paid,
      monthData.settlement,
      monthData.settlementDirection,
      user1.id,      // Pass user1.id
      user2.id       // Pass user2.id
    );
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create FormData to send the reports
    const formData = new FormData();
    formData.append("year", year.toString());
    formData.append("month", month.toString());
    formData.append("user1Id", user1.id);
    formData.append("user2Id", user2.id);
    formData.append("user1Name", user1.username); // Send names for email content
    formData.append("user2Name", user2.username); // Send names for email content
    formData.append("settlementAmount", monthData.settlement.toString());
    formData.append("settlementDirection", monthData.settlementDirection);

    // Log and append PDF
    console.log("PDF Blob to append:", { size: pdfReport.size, type: pdfReport.type });
    formData.append("reportPdf", pdfReport, `settlement_${year}_${month}.pdf`);

    // Log and append CSV
    console.log("CSV Blob to append:", { size: csvBlob.size, type: csvBlob.type });
    formData.append("reportCsv", csvBlob, `expenses_${year}_${month}.csv`);

    console.log("Invoking edge function send-settlement-email with native fetch", {
      url: EDGE_FUNCTION_URL,
      year,
      month,
      user1Id: user1.id,
      user2Id: user2.id,
      settlementAmount: monthData.settlement,
      settlementDirection: monthData.settlementDirection,
      pdfAttached: !!pdfReport,
      csvAttached: !!csvBlob,
    });

    // Call Supabase Edge Function using native fetch
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      body: formData, // Native fetch handles Content-Type for FormData automatically
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY, // Supabase often expects apikey header as well for direct function calls
        // 'Request-Timeout': '30000ms' // Optional: if you need to extend timeout
      },
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json(); // Try to parse error response as JSON
      } catch (e) {
        // If response is not JSON, use text
        const textError = await response.text();
        throw new Error(`HTTP error ${response.status}: ${textError || response.statusText}`);
      }
      // Prefer error message from JSON if available
      const message = errorData?.error?.message || errorData?.message || errorData?.error || JSON.stringify(errorData);
      throw new Error(`Failed to send settlement email: ${message} (Status: ${response.status})`);
    }

    const result = await response.json();

    if (result.error || !result.success) {
      const errorMessage = result.error?.message || result.error || (typeof result.message === 'string' ? result.message : 'Unknown error from Edge Function');
      throw new Error(`Edge Function Error: ${errorMessage}`);
    }

    console.log("Settlement email sent successfully:", result);

  } catch (error) {
    console.error("Error in sendSettlementEmail:", error);
    // Let the calling component handle UI feedback (e.g., toast)
    if (error instanceof Error) {
      throw new Error(`Failed to send settlement email: ${error.message}`);
    } else {
      throw new Error("An unknown error occurred while sending the settlement email.");
    }
  }
};
