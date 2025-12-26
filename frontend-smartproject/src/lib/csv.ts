import { z } from "zod";
import { csvImportSchema } from "@/types";

export async function parseCsvFile(file: File): Promise<{ data: any[]; errors: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csvData = event.target?.result as string;
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });

        const validatedData = csvImportSchema.parse(data);
        resolve({ data: validatedData, errors: [] });
      } catch (error) {
        if (error instanceof z.ZodError) {
          resolve({
            data: [],
            errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          });
        } else {
          reject(error);
        }
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

export function parseCsvText(text: string): { data: any[]; errors: string[] } {
  try {
    // Remove Byte Order Mark (BOM) if present
    const cleanText = text.replace(/^\uFEFF/, '');

    // Split by any line ending and filter empty lines
    const lines = cleanText.split(/\r?\n/).filter(line => line.trim() !== "");

    if (lines.length === 0) {
      return {
        data: [],
        errors: ["CSV file is empty or contains no valid data"]
      };
    }

    const headers = lines[0].split(",").map(header => header.trim());

    // Check if required columns exist
    const requiredColumns = ["wbsCode", "wbsName", "wbsType"];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
      return {
        data: [],
        errors: [`Missing required columns: ${missingColumns.join(", ")}`]
      };
    }

    const data = [];
    const errors = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",").map(value => value.trim());

      // Skip if number of values doesn't match headers
      if (values.length !== headers.length) {
        errors.push(`Line ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
        continue;
      }

      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      // Basic validation for required fields
      if (!row.wbsCode) {
        errors.push(`Line ${i + 1}: Missing WBS code`);
        continue;
      }

      if (!row.wbsName) {
        errors.push(`Line ${i + 1}: Missing WBS name`);
        continue;
      }

      if (!row.wbsType || !["Summary", "WorkPackage", "Activity"].includes(row.wbsType)) {
        errors.push(`Line ${i + 1}: Invalid WBS type - must be Summary, WorkPackage, or Activity`);
        continue;
      }

      // Type-specific validations
      if (row.wbsType === "Summary" || row.wbsType === "WorkPackage") {
        // Check for budget amount
        if (!row.amount || isNaN(Number(row.amount))) {
          errors.push(`Line ${i + 1}: ${row.wbsType} type must have a valid budget amount`);
          continue;
        }
      }

      if (row.wbsType === "Activity") {
        // Activities can't have budget
        if (row.amount && Number(row.amount) !== 0) {
          errors.push(`Line ${i + 1}: Activity type cannot have a budget amount (must be 0 or empty)`);
          continue;
        }
      }

      data.push(row);
    }

    return { data, errors };
  } catch (error) {
    console.error("CSV parsing error:", error);
    return {
      data: [],
      errors: [(error instanceof Error) ? error.message : "Unknown error parsing CSV"]
    };
  }
}

export function generateCsvTemplate(): string {
  return "wbsCode,wbsName,wbsType,wbsDescription,amount\n" +
    "1,Engineering & Design,Summary,Engineering and design phase,5000\n" +
    "1.1,Preliminary Design,WorkPackage,Initial design work,2000\n" +
    "1.1.1,Requirements Analysis,Activity,Gather requirements,\n" +
    "2,Procurement & Construction,Summary,Procurement and construction,85000\n" +
    "2.1,Material Procurement,WorkPackage,Purchase materials,15000\n" +
    "2.1.1,Vendor Selection,Activity,Select vendors,\n" +
    "3,Testing & Commissioning,Summary,Testing and commissioning,10000";
}

export function downloadCsvTemplate(): void {
  const csvContent = generateCsvTemplate();
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "wbs_import_template.csv");
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function validateCsvData(data: any[]): any {
  return csvImportSchema.parse(data);
}

