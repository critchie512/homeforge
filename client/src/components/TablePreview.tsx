import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { TableParams } from "@shared/tableDesign";

interface TablePreviewProps {
  params: TableParams;
  laminateColor: string;
}

const MM_TO_M = 1 / 1000;

/**
 * Procedurally draws a bump/roughness map for the 3-D printed center
 * section so the preview reads as a textured relief pattern rather than a
 * flat slab. Pattern varies by centerDesignId so "Flowing Waves" /
 * "Concentric Rings" / "Geometric Facets" are visually distinguishable —
 * this is a rendering approximation, not the real print-ready geometry.
 */
function createCenterTexture(designId: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);

  if (designId === "concentric-rings") {
    const cx = size / 2;
    const cy = size / 2;
    for (let r = 6; r < size; r += 10) {
      const t = (r / size) * 0.5 + 0.15;
      ctx.strokeStyle = `rgba(255,255,255,${t})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (designId === "geometric-facets") {
    const cell = 22;
    for (let y = 0; y < size; y += cell) {
      for (let x = 0; x < size; x += cell) {
        const shade = ((x / cell + y / cell) % 2 === 0) ? 0.55 : 0.25;
        ctx.fillStyle = `rgba(255,255,255,${shade})`;
        ctx.beginPath();
        ctx.moveTo(x, y + cell);
        ctx.lineTo(x + cell / 2, y);
        ctx.lineTo(x + cell, y + cell);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else {
    // flowing-waves (default) — sine ripple bands, matches the sculptural
    // wave pattern in the reference mockups.
    for (let y = 0; y < size; y += 6) {
      ctx.beginPath();
      for (let x = 0; x <= size; x += 4) {
        const wave = Math.sin(x * 0.06 + y * 0.12) * 10 + Math.sin(x * 0.02) * 6;
        const yy = y + wave;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      const t = 0.25 + 0.35 * Math.abs(Math.sin(y * 0.05));
      ctx.strokeStyle = `rgba(255,255,255,${t})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Renders the base table (fixed frame + shelf, from the selected curated
 * base table), two laminate end panels, and the 3-D printed center section
 * — directly from TableParams, the exact same object the manufacturability
 * validator receives. There is no second "display" representation.
 */
function TableMesh({ params, laminateColor }: TablePreviewProps) {
  const widthM = params.widthMm * MM_TO_M;
  const depthM = params.depthMm * MM_TO_M;
  const heightM = params.heightMm * MM_TO_M;
  const centerWidthM = params.centerSectionWidthMm * MM_TO_M;
  const endWidthM = Math.max((widthM - centerWidthM) / 2, 0.02);
  const topThicknessM = 0.03;
  const legInsetM = 0.05;
  const legThicknessM = 0.045;
  const shelfThicknessM = 0.018;

  const laminateMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: laminateColor, roughness: 0.5, metalness: 0.05 }),
    [laminateColor],
  );
  const frameMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#141210", roughness: 0.6, metalness: 0.1 }),
    [],
  );
  const centerTexture = useMemo(() => createCenterTexture(params.centerDesignId), [
    params.centerDesignId,
  ]);
  const centerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#232019",
        roughness: 0.65,
        metalness: 0.12,
        bumpMap: centerTexture,
        bumpScale: 0.004,
      }),
    [centerTexture],
  );

  const topPositionY = heightM - topThicknessM / 2;
  const legHeight = heightM - topThicknessM;
  const legY = legHeight / 2;
  const legX = widthM / 2 - legInsetM;
  const legZ = depthM / 2 - legInsetM;
  const legPositions: [number, number][] = [
    [-legX, -legZ],
    [legX, -legZ],
    [-legX, legZ],
    [legX, legZ],
  ];

  const leftEndX = -(centerWidthM / 2 + endWidthM / 2);
  const rightEndX = centerWidthM / 2 + endWidthM / 2;

  return (
    <group>
      {/* Laminate end panels */}
      <mesh
        position={[leftEndX, topPositionY, 0]}
        castShadow
        material={laminateMaterial}
      >
        <boxGeometry args={[endWidthM, topThicknessM, depthM]} />
      </mesh>
      <mesh
        position={[rightEndX, topPositionY, 0]}
        castShadow
        material={laminateMaterial}
      >
        <boxGeometry args={[endWidthM, topThicknessM, depthM]} />
      </mesh>
      {/* 3-D printed center section — three interlocking tiles, rendered as
          one textured slab for the preview. */}
      <mesh position={[0, topPositionY, 0]} castShadow material={centerMaterial}>
        <boxGeometry args={[centerWidthM, topThicknessM, depthM]} />
      </mesh>
      {/* Frame legs (curated base tables are all four-leg frames) */}
      {legPositions.map(([x, z], i) => (
        <mesh key={i} position={[x, legY, z]} castShadow material={frameMaterial}>
          <boxGeometry args={[legThicknessM, legHeight, legThicknessM]} />
        </mesh>
      ))}
      {/* Lower storage shelf */}
      <mesh position={[0, legHeight * 0.32, 0]} material={frameMaterial}>
        <boxGeometry args={[widthM - legInsetM * 2, shelfThicknessM, depthM - legInsetM * 2]} />
      </mesh>
    </group>
  );
}

export function TablePreview({ params, laminateColor }: TablePreviewProps) {
  return (
    <div className="h-full w-full" data-testid="canvas-table-preview">
      <Canvas
        shadows
        camera={{ position: [1.6, 1.1, 1.8], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, preserveDrawingBuffer: false }}
      >
        <color attach="background" args={["#000000"]} />
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[3, 4, 2]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-3, 2, -2]} intensity={0.35} />
        <Suspense fallback={null}>
          <TableMesh params={params} laminateColor={laminateColor} />
          <ContactShadows position={[0, 0, 0]} opacity={0.55} scale={4} blur={2.2} far={2} />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={1.2}
          maxDistance={4}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 0.25, 0]}
        />
      </Canvas>
    </div>
  );
}
