export function envToCSV(val: string): string[] {
  return val.split(',').map(s => s.trim()).filter(Boolean);
}
