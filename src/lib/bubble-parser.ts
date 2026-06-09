export interface BubbleNode {
  label: string;
  value: string | null;
  color: string | null;
  children: BubbleNode[];
  // Aggregated stats (computed)
  leafCount: number;
  sum: number;
  missingCount: number;
  numericValue: number | null;
  isMissing: boolean;
}

export interface ParsedMap {
  title: string | null;
  roots: BubbleNode[];
}

const MISSING_TOKENS = new Set(["n.d.", "nd", "n/a", "na", "-", "?", ""]);

export function parseValue(raw: string | null): { num: number | null; missing: boolean } {
  if (raw == null) return { num: null, missing: false };
  const trimmed = raw.trim();
  if (MISSING_TOKENS.has(trimmed.toLowerCase())) return { num: null, missing: true };
  // normalize: remove spaces, replace comma with dot
  const cleaned = trimmed.replace(/\s+/g, "").replace(",", ".");
  const m = cleaned.match(/^([+-]?\d+(?:\.\d+)?)([kKmMbB])?$/);
  if (!m) {
    const n = parseFloat(cleaned);
    return isNaN(n) ? { num: null, missing: false } : { num: n, missing: false };
  }
  let n = parseFloat(m[1]);
  const suf = m[2]?.toLowerCase();
  if (suf === "k") n *= 1e3;
  else if (suf === "m") n *= 1e6;
  else if (suf === "b") n *= 1e9;
  return { num: n, missing: false };
}

export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(Math.round(n));
}

function parseNode(el: Element): BubbleNode {
  const childEls = Array.from(el.children).filter((c) => c.tagName === "node");
  const children = childEls.map(parseNode);
  const rawValue = el.getAttribute("value");
  const { num, missing } = parseValue(rawValue);

  let leafCount: number;
  let sum: number;
  let missingCount: number;

  if (children.length === 0) {
    leafCount = 1;
    sum = num ?? 0;
    missingCount = missing || num == null ? 1 : 0;
  } else {
    leafCount = children.reduce((a, c) => a + c.leafCount, 0);
    sum = children.reduce((a, c) => a + c.sum, 0);
    missingCount = children.reduce((a, c) => a + c.missingCount, 0);
  }

  return {
    label: el.getAttribute("label") ?? "",
    value: rawValue,
    color: el.getAttribute("color"),
    children,
    leafCount,
    sum,
    missingCount,
    numericValue: num,
    isMissing: missing || (children.length === 0 && num == null),
  };
}

export function parseBubbleXml(xml: string): ParsedMap {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) throw new Error("XML non valido");
  const root = doc.documentElement;
  if (!root || root.tagName !== "map") {
    throw new Error("L'elemento radice deve essere <map>");
  }
  const title = root.getAttribute("title");
  const roots = Array.from(root.children)
    .filter((c) => c.tagName === "node")
    .map(parseNode);
  if (roots.length === 0) throw new Error("Nessun <node> trovato");
  return { title, roots };
}
