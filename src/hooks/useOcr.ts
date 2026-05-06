import { useState, useCallback } from "react";

interface OcrResult {
  amount?: number;
  date?: string;
  merchant?: string;
  confidence: number;
}

/**
 * Simple OCR placeholder that attempts basic extraction from filename.
 * In production, this would call an OCR API (e.g., Tesseract.js, Google Vision, AWS Textract).
 */
export function useOcr() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);

  const processImage = useCallback(async (file: File): Promise<OcrResult> => {
    setIsProcessing(true);
    try {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const filename = file.name.toLowerCase().replace(/\.[^/.]+$/, "");
      let amount: number | undefined;
      let date: string | undefined;
      let merchant: string | undefined;

      // Try to extract amount from filename (e.g., "receipt_45.50_tesco")
      const amountMatch = filename.match(/(\d+\.\d{2})/);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1]);
      }

      // Try to extract date from filename (e.g., "receipt_2025-12-01")
      const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        date = dateMatch[1];
      }

      // Use filename parts as merchant guess
      const parts = filename.split(/[_\s\-]/).filter((p) => p.length > 2 && !p.match(/^\d/));
      if (parts.length > 0) {
        merchant = parts[parts.length - 1];
      }

      const ocrResult: OcrResult = {
        amount,
        date,
        merchant,
        confidence: amount ? 0.6 : 0.2,
      };

      setResult(ocrResult);
      return ocrResult;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { processImage, isProcessing, result };
}
