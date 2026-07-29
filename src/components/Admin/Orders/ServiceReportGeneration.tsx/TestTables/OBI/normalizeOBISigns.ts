/** Mammography-style helpers: fix corrupted DB signs (�) and unicode variants. */

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

export function normalizePlusMinusSign(raw: any): "+" | "-" | "±" {
  const s = String(raw ?? "both")
    .trim()
    .toLowerCase()
    .replace(/\uFFFD/g, "")
    .replace(/Â±/g, "±")
    .replace(/\u00b1/g, "±");
  if (s === "plus" || s === "+") return "+";
  if (s === "minus" || s === "-") return "-";
  if (s === "both" || s === "±" || s === "+/-" || s === "+-" || s === "plusminus" || s === "plus/minus") return "±";
  return "±";
}
