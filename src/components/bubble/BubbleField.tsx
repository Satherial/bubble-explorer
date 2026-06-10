import { useEffect, useMemo, useRef, useState, memo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";
import {
  Users,
  Youtube,
  Tv,
  Radio,
  Newspaper,
  Eye,
  UserCheck,
  Hash,
  AlertTriangle,
  CheckCircle2,
  Layers,
  type LucideIcon,
} from "lucide-react";
import type { BubbleNode, BubbleCategory } from "@/lib/bubble-parser";
import { formatCompact } from "@/lib/bubble-parser";
import { bubbleColor } from "./Bubble";

const CATEGORY_META: Record<BubbleCategory, { icon: LucideIcon; label: string }> = {
  followers: { icon: Users, label: "follower" },
  subscribers: { icon: Youtube, label: "iscritti" },
  viewers: { icon: Tv, label: "spettatori" },
  listeners: { icon: Radio, label: "ascoltatori" },
  readers: { icon: Newspaper, label: "lettori" },
  visits: { icon: Eye, label: "visite" },
  members: { icon: UserCheck, label: "membri" },
  generic: { icon: Hash, label: "totale" },
};

function radiusForDepth(depth: number, leafCount: number = 1) {
  // Base radius based on depth
  const baseRadius = depth === 0 ? 2.5 : depth === 1 ? 1.8 : depth === 2 ? 1.3 : 1.0;

  // Scale factor based on leaf count (using log to prevent overly large bubbles)
  // Minimum scale is 1.0, maximum is around 2.5 for very large counts
  const scaleFactor = Math.max(1.0, Math.log(leafCount + 1) * 0.5);

  return baseRadius * scaleFactor;
}

// Deterministic pseudo-random in [-0.5, 0.5) from integer seed
function seeded(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x) - 0.5;
}

function computePositions(count: number): [number, number, number][] {
  if (count === 1) return [[0, 0, 0]];
  const radius = count < 4 ? 4 : count < 7 ? 5.5 : count < 12 ? 7 : 9;
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const jitterZ = seeded(i + 1) * 3;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius, jitterZ];
  });
}

function ContextLossLogger() {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (e: Event) => {
      e.preventDefault();
      console.error("[BubbleField] WebGL context LOST", e);
    };
    const onRestored = () => console.warn("[BubbleField] WebGL context restored");
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, [gl]);
  return null;
}

function Bubble3D({
  node,
  position,
  depth,
  onSelect,
  index,
}: {
  node: BubbleNode;
  position: [number, number, number];
  depth: number;
  onSelect: (n: BubbleNode) => void;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const isLeaf = node.children.length === 0;
  const color = bubbleColor(node, depth);
  const radius = radiusForDepth(depth, node.leafCount);

  const { scale } = useSpring({
    from: { scale: 0 },
    to: { scale: hovered && !isLeaf ? 1.12 : 1 },
    config: { tension: 180, friction: 18 },
  });

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = position[1] + Math.sin(t * 0.5 + position[0]) * 0.15;
    meshRef.current.rotation.y += 0.003;
  });

  return (
    <animated.mesh
      ref={meshRef as never}
      position={position}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        if (!isLeaf) onSelect(node);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        if (!isLeaf) document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.2} />

      <Html
        center
        distanceFactor={6}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {(() => {
          const meta = CATEGORY_META[node.category];
          const Icon = meta.icon;
          const primaryValue = isLeaf && node.numericValue != null ? node.numericValue : node.sum;
          const showPrimary = primaryValue > 0;
          return (
            <div
              className="flex flex-col items-center gap-2 text-white text-center"
              style={{ width: Math.max(180, radius * 90), transform: "translateZ(0)" }}
            >
              <div
                className="font-extrabold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                style={{ fontSize: Math.max(15, 22 - depth * 2) }}
              >
                {node.label}
              </div>
              {showPrimary && (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-black/55 backdrop-blur-md px-4 py-2 shadow-lg ring-1 ring-white/15">
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                  <span className="text-2xl font-black tabular-nums leading-none">
                    {formatCompact(primaryValue)}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider opacity-80 leading-none">
                    {meta.label}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold">
                {!isLeaf && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur px-2.5 py-1">
                    <Layers className="h-3 w-3" />
                    {node.leafCount} elementi
                  </span>
                )}
                {node.missingCount > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-amber-950 px-2.5 py-1">
                    <AlertTriangle className="h-3 w-3" />
                    {node.missingCount} n.d.
                  </span>
                ) : (
                  !isLeaf && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400 text-emerald-950 px-2.5 py-1">
                      <CheckCircle2 className="h-3 w-3" />
                      completo
                    </span>
                  )
                )}
              </div>
            </div>
          );
        })()}
      </Html>
    </animated.mesh>
  );
}

export function BubbleField({
  nodes,
  depth,
  onSelect,
}: {
  nodes: BubbleNode[];
  depth: number;
  onSelect: (node: BubbleNode) => void;
}) {
  const positions = useMemo(() => computePositions(nodes.length), [nodes.length]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  return (
    <div className="w-full" style={{ height: "calc(100vh - 120px)", background: "#0a0a0f" }}>
      <Canvas
        camera={{ position: [0, 0, 16], fov: 50 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
        }}
      >
        <color attach="background" args={["#0a0a0f"]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[-8, -5, 5]} intensity={0.4} color="#8ecae6" />
        <pointLight position={[0, 0, 10]} intensity={0.5} />
        <ContextLossLogger />
        {nodes.map((n, i) => (
          <Bubble3D
            key={`${depth}-${i}-${n.label}`}
            node={n}
            position={positions[i]}
            depth={depth}
            onSelect={onSelect}
            index={i}
          />
        ))}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.5}
          minPolarAngle={Math.PI / 2 - 0.4}
          maxPolarAngle={Math.PI / 2 + 0.4}
          minAzimuthAngle={-0.5}
          maxAzimuthAngle={0.5}
        />
      </Canvas>
    </div>
  );
}

// Prevent unnecessary re-renders that cause WebGL context loss
export default memo(BubbleField);
