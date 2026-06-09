export interface BubbleNode {
  label: string;
  value: string | null;
  color: string | null;
  children: BubbleNode[];
}

export interface ParsedMap {
  title: string | null;
  roots: BubbleNode[];
}

function parseNode(el: Element): BubbleNode {
  const childEls = Array.from(el.children).filter((c) => c.tagName === "node");
  return {
    label: el.getAttribute("label") ?? "",
    value: el.getAttribute("value"),
    color: el.getAttribute("color"),
    children: childEls.map(parseNode),
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
