import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";

/**
 * Standard Helvetica uses WinAnsi encoding. Replace common non-WinAnsi
 * punctuation/symbols (like ×, —, smart quotes, emojis) so pdf-lib never throws.
 */
function sanitizePdfText(text: string): string {
  return text
    .replace(/\u00d7/g, "x")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u2022/g, "*")
    .replace(/\u00b7/g, "|")
    .replace(/[^\x20-\x7e\u00a3\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wrapPdfLines(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const safe = sanitizePdfText(text);
  if (!safe) return [];
  const words = safe.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export class PdfReportBuilder {
  doc!: PDFDocument;
  bold!: PDFFont;
  regular!: PDFFont;
  page!: PDFPage;
  y = 0;
  readonly margin = 44;
  readonly pageWidth = 595.28; // A4
  readonly pageHeight = 841.89;

  get contentWidth() {
    return this.pageWidth - this.margin * 2;
  }

  async init() {
    this.doc = await PDFDocument.create();
    this.bold = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.regular = await this.doc.embedFont(StandardFonts.Helvetica);
    this.addPage();
  }

  addPage() {
    this.page = this.doc.addPage([this.pageWidth, this.pageHeight]);
    this.y = this.pageHeight - this.margin;
  }

  ensureSpace(needed: number) {
    if (this.y - needed < this.margin) {
      this.addPage();
    }
  }

  drawText(
    text: string,
    options: {
      size?: number;
      bold?: boolean;
      color?: ReturnType<typeof rgb>;
      indent?: number;
      lineGap?: number;
    } = {},
  ) {
    const size = options.size ?? 10;
    const font = options.bold ? this.bold : this.regular;
    const color = options.color ?? rgb(0.08, 0.1, 0.14);
    const indent = options.indent ?? 0;
    const lineGap = options.lineGap ?? size + 4;
    const lines = wrapPdfLines(text, font, size, this.contentWidth - indent);

    for (const line of lines) {
      this.ensureSpace(lineGap);
      this.page.drawText(line, {
        x: this.margin + indent,
        y: this.y,
        size,
        font,
        color,
      });
      this.y -= lineGap;
    }
  }

  drawRule(gapBefore = 4, gapAfter = 10) {
    this.y -= gapBefore;
    this.ensureSpace(gapAfter + 4);
    this.page.drawLine({
      start: { x: this.margin, y: this.y },
      end: { x: this.pageWidth - this.margin, y: this.y },
      thickness: 0.75,
      color: rgb(0.84, 0.87, 0.91),
    });
    this.y -= gapAfter;
  }

  async download(filename: string) {
    const bytes = await this.doc.save();
    const blob = new Blob([bytes as unknown as BlobPart], {
      type: "application/pdf",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
