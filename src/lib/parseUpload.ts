import * as XLSX from "xlsx";

export interface ParsedUpload {
  text: string;
  inputType: "text" | "document" | "excel";
}

export async function parseUploadedFile(file: File): Promise<ParsedUpload> {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value, inputType: "document" };
  }

  if (name.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return { text: result.text, inputType: "document" };
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheets = workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      return `Sheet: ${sheetName}\n${csv}`;
    });
    return { text: sheets.join("\n\n"), inputType: "excel" };
  }

  // Plain text / markdown / unknown - read as UTF-8 text.
  return { text: buffer.toString("utf-8"), inputType: "document" };
}
