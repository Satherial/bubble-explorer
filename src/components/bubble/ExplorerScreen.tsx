import { useCallback, useEffect, useMemo, useState } from "react";
import { X, ChevronRight } from "lucide-react";
import type { BubbleNode, ParsedMap } from "@/lib/bubble-parser";
import { BubbleField } from "./BubbleField";

export function ExplorerScreen({ map, onClear }: { map: ParsedMap; onClear: () => void }) {
  // Path is an array of nodes from root selection down to current parent.
  // The displayed bubbles are the children of the last entry in `path`, OR
  // if path is empty, we show map.roots (or its only root's children).
  const initialPath: BubbleNode[] = useMemo(() => {
    if (map.roots.length === 1) return [map.roots[0]];
    return [];
  }, [map]);

  const [path, setPath] = useState<BubbleNode[]>(initialPath);

  const currentNodes: BubbleNode[] = useMemo(() => {
    if (path.length === 0) return map.roots;
    return path[path.length - 1].children;
  }, [path, map.roots]);

  const zoomOut = useCallback(() => {
    setPath((p) => (p.length > initialPath.length ? p.slice(0, -1) : p));
  }, [initialPath.length]);

  const canZoomOut = path.length > initialPath.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") zoomOut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomOut]);

  const select = (node: BubbleNode) => {
    if (node.children.length === 0) return;
    setPath((p) => [...p, node]);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 backdrop-blur bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {map.title && (
              <h1 className="text-xl font-bold text-foreground truncate">{map.title}</h1>
            )}
            <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap mt-1">
              <button
                onClick={() => setPath(initialPath)}
                className="hover:text-foreground transition-colors"
              >
                Home
              </button>
              {path.slice(initialPath.length).map((n, i) => {
                const absoluteIdx = initialPath.length + i;
                return (
                  <span key={absoluteIdx} className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    <button
                      onClick={() => setPath(path.slice(0, absoluteIdx + 1))}
                      className="hover:text-foreground transition-colors"
                    >
                      {n.label}
                    </button>
                  </span>
                );
              })}
            </nav>
          </div>
          <button
            onClick={onClear}
            className="shrink-0 inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
            aria-label="Rimuovi file"
          >
            <X className="h-4 w-4" /> Rimuovi file
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <BubbleField
          nodes={currentNodes}
          depth={path.length}
          onSelect={select}
        />
      </main>
    </div>
  );
}
