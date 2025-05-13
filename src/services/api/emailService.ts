import { getSupabase } from "@/integrations/supabase/client";
import { User, MonthData } from "@/types";
import { generateSettlementReportPDF } from "../export/settlementReportService";
import { exportToCSV } from "../export/csvExportService";

// Send settlement email to both users
export const sendSettlementEmail = async (
  monthData: MonthData,
  year: number,
  month: number,
  users: User[]
): Promise<void> => {
  try {
    if (users.length < 2) {
      throw new Error("Need at least two users to send settlement emails");
    }

    const supabase = await getSupabase();
    const user1 = users[0];
    const user2 = users[1];
    
    // TEST: Create a very simple FormData
    const testFormData = new FormData();
    testFormData.append("year", year.toString());
    testFormData.append("month", month.toString());
    testFormData.append("user1Id_test", user1.id);
    testFormData.append("user2Id_test", user2.id);
    testFormData.append("settlementAmount_test", monthData.settlement.toString());
    testFormData.append("settlementDirection_test", monthData.settlementDirection);
    // END TEST

    // Original FormData construction - temporarily commented out for testing
    /*
    // Generate PDF report
    const pdfReport = generateSettlementReportPDF(
      {
        totalExpenses: monthData.totalExpenses,
        user1Paid: monthData.user1Paid,
        user2Paid: monthData.user2Paid,
        settlement: monthData.settlement,
        settlementDirection: monthData.settlementDirection
      },
      year,
      month,
      user1.name,
      user2.name
    );
    
    // Generate CSV report
    const csvContent = exportToCSV(monthData.expenses, year, month);
    const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create FormData to send the reports
    const formData = new FormData();
    formData.append("year", year.toString());
    formData.append("month", month.toString());
    formData.append("user1", user1.id);
    formData.append("user2", user2.id);
    formData.append("settlementAmount", monthData.settlement.toString());
    formData.append("settlementDirection", monthData.settlementDirection);
    formData.append("reportPdf", pdfReport, `settlement_${year}_${month}.pdf`);
    formData.append("reportCsv", csvBlob, `expenses_${year}_${month}.csv`);
    */

    console.log("Invoking edge function send-settlement-email with TEST FormData", {
      year,
      month,
      user1Id: user1.id,
      user2Id: user2.id,
      // settlementAmount: monthData.settlement, // Commented for test
      // settlementDirection: monthData.settlementDirection, // Commented for test
      // pdfAttached: false, // Commented for test
      // csvAttached: false // Commented for test
    });

    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke("send-settlement-email", {
      body: testFormData // Use the simplified FormData for testing
    });

    if (error) {
      console.error("Supabase functions.invoke error:", error);
      throw new Error(`Edge function error: ${error.message || 'Unknown error'}`);
    }

    if (!data?.success) {
      console.error("Edge function returned error:", data?.error || "Unknown error");
      throw new Error(data?.error || "Unknown error from edge function");
    }

    console.log("Settlement email sent successfully", data);
    return data;
  } catch (error) {
    console.error("Error sending settlement email:", error);
    throw error;
  }
};
