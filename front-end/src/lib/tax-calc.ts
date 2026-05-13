import type { TaxRow } from "@/lib/api";

export type TaxLine = {
  tax_id: number;
  code: string;
  name: string;
  rate_percent: number;
  apply_on: "base" | "base_plus_previous";
  amount: number;
};

export function calculateTaxes(baseAmount: number, taxes: TaxRow[]) {
  const base = Number.isFinite(baseAmount) ? baseAmount : 0;
  const active = (taxes ?? []).filter((t) => (t as any)?.is_active !== 0);
  const sorted = [...active].sort((a, b) => (Number(a.sort_order ?? 100) - Number(b.sort_order ?? 100)) || String(a.code).localeCompare(String(b.code)));

  const lines: TaxLine[] = [];
  let prevTaxes = 0;

  for (const t of sorted) {
    const rate = (Number(t.rate_percent ?? 0) || 0) / 100;
    const taxable =
      t.apply_on === "base_plus_previous"
        ? base + prevTaxes
        : base;

    const amount = taxable * rate;
    prevTaxes += amount;
    lines.push({
      tax_id: t.id,
      code: String(t.code ?? ""),
      name: String(t.name ?? ""),
      rate_percent: Number(t.rate_percent ?? 0) || 0,
      apply_on: (t.apply_on as any) === "base_plus_previous" ? "base_plus_previous" : "base",
      amount,
    });
  }

  const totalTax = Math.round(prevTaxes * 100) / 100;
  const grandTotal = Math.round((base + totalTax) * 100) / 100;
  return { base, lines, totalTax, grandTotal };
}

