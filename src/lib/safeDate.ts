// FILE: src/lib/safeDate.ts
// Parse ngay an toan: tra Date hop le hoac fallback (mac dinh null) — tranh "Invalid Date" lot vao Prisma gay 500.
export function safeDate(value: unknown, fallback: Date | null = null): Date | null {
  if (value === null || value === undefined || value === "") return fallback;
  if (value instanceof Date) return isNaN(value.getTime()) ? fallback : value;
  const d = new Date(value as string | number);
  return isNaN(d.getTime()) ? fallback : d;
}
