import { parse } from 'csv-parse/sync';

export async function parseCSV(buffer: Buffer): Promise<any[]> {
  try {
    const csvString = buffer.toString('utf-8');
    
    const records = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records;
  } catch (error) {
    throw new Error(`CSV parsing failed: ${error.message}`);
  }
}
