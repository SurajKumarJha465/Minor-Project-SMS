import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * downloadMockPdf — generates a lightweight placeholder PDF file in the browser
 * and triggers a download. Used for "Download Report / Marksheet" style buttons
 * where there's no real backend to generate a PDF from.
 */
export function downloadMockPdf(filename: string, lines: string[]) {
  const textOps = lines
    .map(
      (line, i) =>
        `BT /F1 12 Tf 40 ${760 - i * 18} Td (${line.replace(/[()\\]/g, (c) => `\\${c}`)}) Tj ET`,
    )
    .join("\n");
  const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length ${textOps.length}>>stream
${textOps}
endstream
endobj
xref
trailer<</Size 6/Root 1 0 R>>
%%EOF`;
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
