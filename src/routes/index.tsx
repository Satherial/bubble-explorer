import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UploadScreen } from "@/components/bubble/UploadScreen";
import { ExplorerScreen } from "@/components/bubble/ExplorerScreen";
import type { ParsedMap } from "@/lib/bubble-parser";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bubble Explorer" },
      {
        name: "description",
        content: "Carica un XML e naviga la mappa come bolle interattive.",
      },
      { property: "og:title", content: "Bubble Explorer" },
      {
        property: "og:description",
        content: "Carica un XML e naviga la mappa come bolle interattive.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [map, setMap] = useState<ParsedMap | null>(null);
  if (!map) return <UploadScreen onLoaded={setMap} />;
  return <ExplorerScreen map={map} onClear={() => setMap(null)} />;
}
