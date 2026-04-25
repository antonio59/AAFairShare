import { Expense } from "@/types";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// Generate and download PDF using pdf-lib
export const downloadPDF = async (
  expenses: Expense[],
  year: number,
  month: number,
): Promise<void> => {
  try {
    const monthName = new Date(year, month - 1).toLocaleString("default", {
      month: "long",
    });
    const doc = await PDFDocument.create();
    const page = doc.addPage();
    const { height } = page.getSize();
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await doc.embedFont(StandardFonts.Helvetica);

    const lineHeight = 18;
    let y = height - 40;

    // Branding
    page.drawText("AAFairShare", {
      x: 40,
      y,
      size: 22,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight * 2;

    // Title
    page.drawText(`Expense Report - ${monthName} ${year}`, {
      x: 40,
      y,
      size: 16,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight * 2;

    // Date
    page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
      x: 40,
      y,
      size: 11,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight * 2;

    // Total
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    page.drawText(`Total Expenses: £${total.toFixed(2)}`, {
      x: 40,
      y,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight * 2;

    // Table header
    const headers = [
      "Date",
      "Category",
      "Location",
      "Description",
      "Amount",
      "Paid By",
      "Split",
    ];
    let x = 40;
    headers.forEach((h) => {
      page.drawText(h, {
        x,
        y,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0),
      });
      x += 80; // simple column width
    });
    y -= lineHeight;

    // Table rows
    expenses.forEach((exp) => {
      x = 40;
      const row = [
        new Date(exp.date).toLocaleDateString(),
        exp.category,
        exp.location || "-",
        exp.description || "-",
        `£${exp.amount.toFixed(2)}`,
        exp.paidBy || "Unknown",
        exp.split?.toString() || "-",
      ];
      row.forEach((cell) => {
        page.drawText(cell, {
          x,
          y,
          size: 9,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        x += 80;
      });
      y -= lineHeight;
      if (y < 50) {
        // add new page if needed
        const newPage = doc.addPage();
        const { height: h } = newPage.getSize();
        page = newPage;
        y = h - 40;
      }
    });

    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses_${monthName}_${year}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
