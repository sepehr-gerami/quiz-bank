import { number } from "zod";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function faDigits(input: string | number | null | undefined) : string 
{
    if(input === null || input === undefined) return ''
     return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

export function faPercent (ratio: number | null | undefined):string 
{
    if(ratio === null || ratio === undefined || Number.isNaN(ratio)) return "--";
      return `${faDigits(Math.round(ratio * 100))}`;
}

export function faNumber (n: number | null | undefined): string 
{
    if(n === null || n === undefined || Number.isNaN(n)) return "--";
    
     const rounded = Math.round(n * 10) / 10;
  return faDigits(rounded.toString().replace(/\.0$/, ""));
}

export function faDate(d: Date | string | null | undefined): string {
  if (!d) return "--";

  const date = typeof d === "string" ? new Date(d) : d;

  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function faDuration(minutes: number | null | undefined): string {
  if (!minutes) return "بدون محدودیت";
  return `${faDigits(minutes)} دقیقه`;
}

export function faClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;

  return faDigits(
    `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`,
  );
}