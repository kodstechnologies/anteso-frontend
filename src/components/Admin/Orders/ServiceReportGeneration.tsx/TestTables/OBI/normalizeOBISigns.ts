/** Mammography-style helpers: fix corrupted DB signs and unicode variants. */
import { normalizePlusMinusSign as sharedNormalizePlusMinusSign } from "../shared/mainTestTableDisplay";

export function normalizeComparisonOperator(raw: any): "<" | ">" | "<=" | ">=" | "=" {
  const s = String(raw ?? "<=")
    .trim()
    .toLowerCase()
    .replace(/\uFFFD/g, "")
    .replace(/â‰¤/g, "<=")
    .replace(/â‰¥/g, ">=")
    .replace(/Â±/g, "")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=");
  if (s === "<=" || s === "less than or equal to" || s === "lessthanorequalto") return "<=";
  if (s === "<" || s === "less than" || s === "lessthan") return "<";
  if (s === ">=" || s === "greater than or equal to" || s === "greaterthanorequalto") return ">=";
  if (s === ">" || s === "greater than" || s === "greaterthan") return ">";
  if (s === "=" || s === "equal" || s === "equals") return "=";
  return "<=";
}

export const normalizePlusMinusSign = sharedNormalizePlusMinusSign;
