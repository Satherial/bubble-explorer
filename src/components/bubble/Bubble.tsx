import type { BubbleNode } from "@/lib/bubble-parser";
import { cn } from "@/lib/utils";

const PALETTE = [
  "#e63946",
  "#f4a261",
  "#2a9d8f",
  "#264653",
  "#8ecae6",
  "#9d4edd",
  "#06a77d",
  "#d62828",
];

export function bubbleColor(node: BubbleNode, depth: number) {
  return node.color ?? PALETTE[depth % PALETTE.length];
}

export function Bubble({
  node,
  depth,
  onClick,
}: {
  node: BubbleNode;
  depth: number;
  onClick: () => void;
}) {
  const isLeaf = node.children.length === 0;
  const color = bubbleColor(node, depth);
  const size = Math.max(140, 240 - depth * 18);

  return (
    <button
      onClick={onClick}
      disabled={isLeaf}
      className={cn(
        "group relative rounded-full flex flex-col items-center justify-center text-center p-4 transition-all duration-300",
        "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)]",
        !isLeaf && "cursor-pointer hover:scale-105 active:scale-95",
        isLeaf && "cursor-default ring-2 ring-white/30 ring-offset-2 ring-offset-background opacity-90",
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${color}ee, ${color}aa 70%, ${color}88)`,
        color: "white",
      }}
    >
      <span
        className="font-semibold leading-tight drop-shadow"
        style={{ fontSize: Math.max(13, 18 - depth) }}
      >
        {node.label}
      </span>
      {node.value && (
        <span className="mt-1 text-xs opacity-90 font-medium">{node.value}</span>
      )}
    </button>
  );
}
