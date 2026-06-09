import type { BubbleNode } from "@/lib/bubble-parser";
import { formatCompact } from "@/lib/bubble-parser";
import { cn } from "@/lib/utils";
import { AlertTriangle, Check, Sigma, Layers } from "lucide-react";

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
  const hasMissing = node.missingCount > 0;

  return (
    <button
      onClick={onClick}
      disabled={isLeaf}
      className={cn(
        "group relative rounded-2xl flex flex-col items-stretch text-left p-5 transition-all duration-300 w-64 min-h-[180px]",
        "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)] text-white overflow-hidden",
        !isLeaf && "cursor-pointer hover:scale-[1.03] active:scale-[0.98]",
        isLeaf && "cursor-default ring-2 ring-white/30 opacity-95",
      )}
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      }}
    >
      <div className="flex-1 flex items-center justify-center px-2">
        <span
          className="font-bold leading-tight drop-shadow text-center"
          style={{ fontSize: Math.max(15, 22 - depth) }}
        >
          {node.label}
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        {!isLeaf && (
          <StatPill icon={<Layers className="h-3.5 w-3.5" />}>
            {node.leafCount} elementi
          </StatPill>
        )}
        {node.sum > 0 && (
          <StatPill icon={<Sigma className="h-3.5 w-3.5" />}>
            Σ {formatCompact(node.sum)}
          </StatPill>
        )}
        {isLeaf && node.numericValue != null && node.sum === 0 && (
          <StatPill icon={<Sigma className="h-3.5 w-3.5" />}>
            {formatCompact(node.numericValue)}
          </StatPill>
        )}
        <StatPill
          icon={
            hasMissing ? (
              <AlertTriangle className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )
          }
          tone={hasMissing ? "warn" : "ok"}
        >
          {hasMissing
            ? `${node.missingCount} n.d.${!isLeaf ? " da compilare" : ""}`
            : isLeaf
              ? "compilato"
              : "0 n.d."}
        </StatPill>
      </div>
    </button>
  );
}

function StatPill({
  icon,
  children,
  tone = "default",
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  tone?: "default" | "warn" | "ok";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm",
        tone === "warn" && "bg-amber-400/90 text-amber-950",
        tone === "ok" && "bg-emerald-400/90 text-emerald-950",
        tone === "default" && "bg-white/20 text-white",
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </div>
  );
}
