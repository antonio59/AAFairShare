import { generateSettlementReportPDF } from "@/services/export/settlementReportService";
import { exportToCSV } from "@/services/export/csvExportService";
import type { MonthData, User } from "@/types";

// Netlify function URL - deployed alongside the app
const NETLIFY_FUNCTION_URL = '/.netlify/functions/send-settlement-email';

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

    console.log("Invoking Netlify function send-settlement-email", {
      url: NETLIFY_FUNCTION_URL,
      year,
      month,
      user1Id: user1.id,
      user2Id: user2.id,
      settlementAmount: monthData.settlement,
      settlementDirection: monthData.settlementDirection,
      pdfAttached: !!pdfReport,
      csvAttached: !!csvBlob,
    });

    // Call Netlify Function
    const response = await fetch(NETLIFY_FUNCTION_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        const textError = await response.text();
        throw new Error(`HTTP error ${response.status}: ${textError || response.statusText}`);
      }
      const message = errorData?.error?.message || errorData?.message || errorData?.error || JSON.stringify(errorData);
      throw new Error(`Failed to send settlement email: ${message} (Status: ${response.status})`);
    }

    const result = await response.json();

    if (result.error || !result.success) {
      const errorMessage = result.error?.message || result.error || (typeof result.message === 'string' ? result.message : 'Unknown error from Netlify Function');
      throw new Error(`Netlify Function Error: ${errorMessage}`);
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
