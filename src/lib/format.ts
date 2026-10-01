import { FLAT_SHIPPING, FREE_SHIPPING_THRESHOLD, PRIORITY_SHIPPING } from "@/data/config";

export function money(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** Joins only the address parts that were filled in, so empty fields don't leave a leading comma. */
export function formatAddress(address: { line1?: string; line2?: string; city?: string; state?: string; zip?: string }) {
  const street = [address.line1, address.line2].map((part) => part?.trim()).filter(Boolean).join(", ");
  const region = [address.state, address.zip].map((part) => part?.trim()).filter(Boolean).join(" ");
  const city = [address.city?.trim(), region].filter(Boolean).join(", ");
  return [street, city].filter(Boolean).join(", ");
}

export function imageUrl(src: string | undefined, width: number) {
  if (!src) return "";
  try {
    const url = new URL(src.startsWith("//") ? `https:${src}` : src);
    url.searchParams.set("width", String(width));
    return url.toString();
  } catch {
    return src;
  }
}

export type Promo = { code: string; kind: "percent" | "amount"; value: number } | null;

const PROMOS: Record<string, Promo> = {
  HEAT10: { code: "HEAT10", kind: "percent", value: 10 },
  FIRE5: { code: "FIRE5", kind: "amount", value: 5 },
};

export function lookupPromo(code: string): Promo {
  return PROMOS[code.trim().toUpperCase()] ?? null;
}

export function discountFor(subtotal: number, promo: Promo) {
  if (!promo || subtotal <= 0) return 0;
  if (promo.kind === "percent") return Math.round(subtotal * (promo.value / 100) * 100) / 100;
  return Math.min(subtotal, promo.value);
}

/** Package-deal lines do not count toward free shipping (store policy). */
export function eligibleShippingSubtotal(lines: { price: number; qty: number; isBundle: boolean }[]) {
  return lines.reduce((sum, line) => (line.isBundle ? sum : sum + line.price * line.qty), 0);
}

export function shippingQuote(opts: {
  eligibleSubtotal: number;
  method: "ground" | "priority";
  percentOff: boolean;
}) {
  if (opts.method === "priority") {
    return { cost: PRIORITY_SHIPPING, free: false, label: "USPS Priority Mail" };
  }
  const free = !opts.percentOff && opts.eligibleSubtotal >= FREE_SHIPPING_THRESHOLD;
  return {
    cost: free ? 0 : FLAT_SHIPPING,
    free,
    label: free ? "Free USPS Ground Advantage" : "USPS Ground Advantage",
  };
}

export function addBusinessDays(start: Date, days: number) {
  const date = new Date(start);
  let left = days;
  while (left > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) left -= 1;
  }
  return date;
}

export function formatDay(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD",
  "TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export function luhn(num: string) {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
