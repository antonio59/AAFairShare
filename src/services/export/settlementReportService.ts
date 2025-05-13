import { Expense, User } from "@/types";
import { jsPDF } from "jspdf";
import autoTable, { UserOptions, applyPlugin as applyAutoTable } from 'jspdf-autotable'; // Import UserOptions

// Apply the plugin to jsPDF
applyAutoTable(jsPDF);

// Extend jsPDF with autoTable and lastAutoTable property
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDFWithAutoTable; // Use UserOptions
  lastAutoTable?: { // Make optional as it only exists after autoTable is called
    finalY: number;
    // Add other properties of lastAutoTable if known/needed
  };
}

// Generate settlement report PDF
export const generateSettlementReportPDF = (
  monthData: {
    totalExpenses: number;
    user1Paid: number;
    user2Paid: number;
    settlement: number;
    settlementDirection: 'owes' | 'owed' | 'even';
  },
  expenses: Expense[],
  year: number,
  month: number,
  user1Name: string,
  user2Name: string,
  user1Id: string, // Added user1Id
  user2Id: string  // Added user2Id
): Blob => {
  try {
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    const monthString = `${year}-${month.toString().padStart(2, '0')}`;
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    let currentY = 20;

    // Add branding
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0); // Black text
    doc.setFont("helvetica", "bold");
    doc.text("AAFairShare", 14, currentY);
    currentY += 10;
    
    // Add title
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(`Settlement Report - ${monthName} ${year}`, 14, currentY);
    currentY += 10;
    
    // Add horizontal line
    doc.setDrawColor(0); // Black line
    doc.line(14, currentY - 5, doc.internal.pageSize.width - 14, currentY - 5);
    
    // Greeting
    doc.setFontSize(12);
    doc.setTextColor(0,0,0);
    doc.text(`Hi ${user1Name} and ${user2Name},`, 14, currentY);
    currentY += 10;
    
    doc.text(`Here's the settlement summary for ${monthString}:`, 14, currentY);
    currentY += 5;
    
    // Draw settlement summary box and text
    const summaryBoxStartY = currentY;
    const summaryBoxHeight = 48; // Adjusted height for content
    doc.setFillColor(245, 245, 245); // Light gray fill
    doc.rect(14, summaryBoxStartY, doc.internal.pageSize.width - 28, summaryBoxHeight, 'F');

    let textY = summaryBoxStartY + 7;
    doc.setTextColor(0,0,0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`${user1Name} Paid: £${monthData.user1Paid.toFixed(2)}`, 20, textY); textY += 7;
    doc.text(`${user2Name} Paid: £${monthData.user2Paid.toFixed(2)}`, 20, textY); textY += 7;
    doc.text(`Total Expenses: £${monthData.totalExpenses.toFixed(2)}`, 20, textY); textY += 7;
    
    doc.setFont("helvetica", "bold");
    doc.text("Settlement:", 20, textY);
    
    let settlementText = "";
    if (monthData.settlementDirection === 'owes') {
      settlementText = `${user1Name} paid ${user2Name} £${monthData.settlement.toFixed(2)}`;
    } else if (monthData.settlementDirection === 'owed') {
      settlementText = `${user2Name} paid ${user1Name} £${monthData.settlement.toFixed(2)}`;
    } else {
      settlementText = `No payment needed - expenses already balanced`;
    }
    doc.setFont("helvetica", "normal");
    doc.text(settlementText, 60, textY);

    currentY = summaryBoxStartY + summaryBoxHeight + 10; // Update currentY to be after the summary box

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Detailed Expenses:", 14, currentY);
    currentY += 8;

    const tableColumn = ["Date", "Category", "Location", "Description", "Paid By", "Amount"];
    const tableRows = expenses.map(exp => [
      exp.date,
      exp.category,
      exp.location || "-", // Add Location
      exp.description || "-",
      exp.paidBy === user1Id ? user1Name : (exp.paidBy === user2Id ? user2Name : 'Unknown'), // Correct Paid By
      `£${exp.amount.toFixed(2)}`
    ]);

    const totalExpensesAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    doc.autoTable({
      startY: currentY,
      head: [tableColumn],
      body: tableRows,
      foot: [ // Add footer for totals
        ['', '', '', 'Total', '', `£${totalExpensesAmount.toFixed(2)}`]
      ],
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2, textColor: [0,0,0], lineColor: [200,200,200] },
      headStyles: { fillColor: [230, 230, 230], textColor: [0,0,0], fontStyle: 'bold', lineColor: [150,150,150] },
      footStyles: { fillColor: [230, 230, 230], textColor: [0,0,0], fontStyle: 'bold', lineColor: [150,150,150] },
      margin: { top: currentY, left: 14, right: 14 }, 
      tableWidth: 'auto',
      didDrawPage: (data) => {
        // currentY = data.cursor.y; 
      }
    });
    
    currentY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : currentY + 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Thanks,", 14, currentY);
    currentY += 5;
    doc.text("The AAFairShare Team", 14, currentY);
    
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  } catch (error) {
    console.error("Error generating settlement report PDF:", error);
    throw error;
  }
};
