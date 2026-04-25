import { Expense } from "@/types";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
// PDF generation using pdf-lib – safe alternative to jsPDF

// Generate settlement report PDF
export const generateSettlementReportPDF = async (
  monthData: {
    totalExpenses: number;
    user1Paid: number;
    user2Paid: number;
    settlement: number;
    settlementDirection: "owes" | "owed" | "even";
  },
  expenses: Expense[],
  year: number,
  month: number,
  user1Name: string,
  user2Name: string,
  user1Id: string, // Added user1Id
  user2Id: string, // Added user2Id
): Promise<Blob> => {
  try {
    const monthName = new Date(year, month - 1).toLocaleString("default", {
      month: "long",
    });
    const doc = await PDFDocument.create();
    const page = doc.addPage();
    const { height } = page.getSize();
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const lineHeight = 18;
    let y = height - 40;

    // Branding
    page.drawText("AAFairShare", {
      x: 40,
      y,
      size: 22,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight * 2;

    // Title
    page.drawText(`Settlement Report - ${monthName} ${year}`, {
      x: 40,
      y,
      size: 16,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight * 2;

    // Summary
    page.drawText(`Total Expenses: £${monthData.totalExpenses.toFixed(2)}`, {
      x: 40,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;
    page.drawText(
      `User1 (${user1Name}) Paid: £${monthData.user1Paid.toFixed(2)}`,
      { x: 40, y, size: 12, font, color: rgb(0, 0, 0) },
    );
    y -= lineHeight;
    page.drawText(
      `User2 (${user2Name}) Paid: £${monthData.user2Paid.toFixed(2)}`,
      { x: 40, y, size: 12, font, color: rgb(0, 0, 0) },
    );
    y -= lineHeight;
    page.drawText(`Settlement: ${monthData.settlementDirection}`, {
      x: 40,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight;
    page.drawText(`Amount: £${monthData.settlement.toFixed(2)}`, {
      x: 40,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    y -= lineHeight * 2;

    // Table header
    const headers = [
      "Date",
      "Category",
      "Location",
      "Description",
      "Paid By",
      "Amount",
    ];
    let x = 40;
    headers.forEach((h) => {
      page.drawText(h, { x, y, size: 10, font, color: rgb(0, 0, 0) });
      x += 80;
    });
    y -= lineHeight;

    // Rows
    expenses.forEach((exp) => {
      x = 40;
      const row = [
        new Date(exp.date).toLocaleDateString(),
        exp.category,
        exp.location || "-",
        exp.description || "-",
        exp.paidBy === user1Id
          ? user1Name
          : exp.paidBy === user2Id
            ? user2Name
            : "Unknown",
        `£${exp.amount.toFixed(2)}`,
      ];
      row.forEach((cell) => {
        page.drawText(cell, { x, y, size: 9, font, color: rgb(0, 0, 0) });
        x += 80;
      });
      y -= lineHeight;
      if (y < 50) {
        const newPage = doc.addPage();
        const { height: h } = newPage.getSize();
        y = h - 40;
      }
    });

    const pdfBytes = await doc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
  } catch (error) {
    console.error("Error generating settlement report PDF:", error);
    throw error;
  }
};
