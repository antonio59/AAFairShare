
import { Expense } from "@/types";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Generate and download PDF
export const downloadPDF = (expenses: Expense[], year: number, month: number): void => {
  try {
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    const doc = new jsPDF();
    
    // Add branding
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0); // Black text
    doc.setFont("helvetica", "bold");
    doc.text("AAFairShare", 14, 20);
    
    // Add title
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(`Expense Report - ${monthName} ${year}`, 14, 30);
    
    // Add horizontal line
    doc.setDrawColor(0);
    doc.line(14, 35, doc.internal.pageSize.width - 14, 35);
    
    // Add date
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 45);
    
    // Calculate total
    const total = parseFloat(expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2));
    
    // Summary section
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text('Summary:', 14, 55);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Total Expenses: £${total.toFixed(2)}`, 14, 63);
    doc.text(`Total Items: ${expenses.length}`, 14, 70);
    
    // Prepare data for table
    const tableColumn = ['Date', 'Category', 'Location', 'Description', 'Amount', 'Paid By', 'Split Type'];
    const tableRows = expenses.map(expense => [
      new Date(expense.date).toLocaleDateString(),
      expense.category,
      expense.location,
      expense.description || '-',
      `£${expense.amount.toFixed(2)}`,
      expense.paidBy || 'Unknown',
      expense.split
    ]);
    
    // Add table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      theme: 'plain',
      headStyles: {
        fillColor: [255, 255, 255], // White background
        textColor: [0, 0, 0], // Black text
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      styles: {
        textColor: [0, 0, 0], // Black text
        fontSize: 10,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Date
        1: { cellWidth: 25 }, // Category
        2: { cellWidth: 25 }, // Location
        3: { cellWidth: 40 }, // Description
        4: { cellWidth: 20 }, // Amount
        5: { cellWidth: 20 }, // Paid By
        6: { cellWidth: 20 }  // Split Type
      },
      margin: { top: 10 },
      alternateRowStyles: {
        fillColor: [240, 240, 240] // Light gray for alternate rows
      }
    });
    
    // Add footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128); // Gray text
      doc.text('The AAFairShare Team', 14, doc.internal.pageSize.height - 10);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }
    
    // Save the PDF
    doc.save(`expenses_${monthName}_${year}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
