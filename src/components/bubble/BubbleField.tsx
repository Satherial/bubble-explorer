import { useEffect, useRef } from "react";
import type { BubbleNode } from "@/lib/bubble-parser";
import { Bubble } from "./Bubble";

export function BubbleField({
  nodes,
  depth,
  onSelect,
  onZoomOut,
  canZoomOut,
}: {
  nodes: BubbleNode[];
  depth: number;
  onSelect: (node: BubbleNode) => void;
  onZoomOut: () => void;
  canZoomOut: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (!canZoomOut) return;
      const el = ref.current;
      if (!el) return;
      if (window.scrollY <= 0 && e.deltaY < -10) {
        onZoomOut();
      }
    };
    window.addEventListener("wheel", handler, { passive: true });
    return () => window.removeEventListener("wheel", handler);
  }, [canZoomOut, onZoomOut]);

  return (
    <div
      ref={ref}
      key={depth}
      className="flex flex-wrap items-center justify-center gap-8 py-12 animate-in fade-in zoom-in-95 duration-300"
    >
      {nodes.map((n, i) => (
        <Bubble key={`${depth}-${i}-${n.label}`} node={n} depth={depth} onClick={() => onSelect(n)} />
      ))}
    </div>
  );
}
