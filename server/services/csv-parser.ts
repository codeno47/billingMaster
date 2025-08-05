import { parse } from 'csv-parse/sync';

export async function parseCSV(buffer: Buffer): Promise<any[]> {
  try {
    const csvString = buffer.toString('utf-8').trim();
    
    // Check if the CSV string is empty or only contains whitespace
    if (!csvString) {
      return [];
    }
    
    const records = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records || [];
  } catch (error: any) {
    throw new Error(`CSV parsing failed: ${error.message}`);
  }
}
