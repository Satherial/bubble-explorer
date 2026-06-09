import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Environment } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";
import type { BubbleNode } from "@/lib/bubble-parser";
import { formatCompact } from "@/lib/bubble-parser";
import { bubbleColor } from "./Bubble";

function radiusForDepth(depth: number) {
  if (depth === 0) return 2.5;
  if (depth === 1) return 1.8;
  if (depth === 2) return 1.3;
  return 1.0;
}

// Deterministic pseudo-random in [-0.5, 0.5) from integer seed
function seeded(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return (x - Math.floor(x)) - 0.5;
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
  const radius = radiusForDepth(depth);

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
      <sphereGeometry args={[radius, 48, 48]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.25}
        metalness={0.15}
        clearcoat={0.8}
        clearcoatRoughness={0.2}
        transmission={0.05}
        reflectivity={0.6}
      />
      <Html
        center
        distanceFactor={10}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          className="flex flex-col items-center gap-1 text-white text-center"
          style={{ width: radius * 60, transform: "translateZ(0)" }}
        >
          <div
            className="font-bold leading-tight drop-shadow-lg"
            style={{ fontSize: Math.max(11, 16 - depth) }}
          >
            {node.label}
          </div>
          <div className="flex flex-col items-center gap-0.5 text-[10px] font-medium">
            {!isLeaf && (
              <span className="rounded-full bg-white/25 backdrop-blur px-2 py-0.5">
                {node.leafCount} elementi
              </span>
            )}
            {node.sum > 0 && (
              <span className="rounded-full bg-white/25 backdrop-blur px-2 py-0.5">
                Σ {formatCompact(node.sum)}
              </span>
            )}
            {isLeaf && node.numericValue != null && node.sum === 0 && (
              <span className="rounded-full bg-white/25 backdrop-blur px-2 py-0.5">
                {formatCompact(node.numericValue)}
              </span>
            )}
            {node.missingCount > 0 ? (
              <span className="rounded-full bg-amber-400/90 text-amber-950 px-2 py-0.5">
                ⚠️ {node.missingCount} n.d.
              </span>
            ) : (
              !isLeaf && (
                <span className="rounded-full bg-emerald-400/90 text-emerald-950 px-2 py-0.5">
                  ✓ completo
                </span>
              )
            )}
          </div>
        </div>
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const positions = useMemo(() => computePositions(nodes.length), [nodes.length]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  if (!mounted) {
    return <div className="h-[calc(100vh-120px)] w-full" />;
  }

  return (
    <div
      className="w-full"
      style={{ height: "calc(100vh - 120px)", background: "#0a0a0f" }}
    >
      <Canvas
        key={depth}
        camera={{ position: [0, 0, 16], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#0a0a0f"]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[-8, -5, 5]} intensity={0.4} color="#8ecae6" />
        <Environment preset="city" />
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
