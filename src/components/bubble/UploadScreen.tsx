import { useRef, useState, type DragEvent } from "react";
import { parseBubbleXml, type ParsedMap } from "@/lib/bubble-parser";

export function UploadScreen({ onLoaded }: { onLoaded: (m: ParsedMap) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith(".xml")) {
      setError("Per favore carica un file .xml");
      return;
    }
    try {
      const text = await file.text();
      const map = parseBubbleXml(text);
      onLoaded(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore nel parsing");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-2 text-foreground">Bubble Explorer</h1>
        <p className="text-center text-muted-foreground mb-10">
          Carica un file XML per esplorare la mappa
        </p>

        <label
          onDragOver={(e: DragEvent) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e: DragEvent) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`block cursor-pointer rounded-3xl border-2 border-dashed p-16 text-center transition-all ${
            dragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xml,application/xml,text/xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <div className="text-6xl mb-4">🫧</div>
          <div className="text-lg font-medium text-foreground">
            Trascina qui il file XML
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            oppure clicca per sceglierlo
          </div>
        </label>

        {error && (
          <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
