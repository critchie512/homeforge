import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import type { TableParams } from "@shared/tableDesign";

interface TablePreviewProps {
  params: TableParams;
  finishColor: string;
}

const MM_TO_M = 1 / 1000;

/**
 * Renders the tabletop + base geometry directly from TableParams — the exact
 * same object the manufacturability validator receives. There is no second
 * "display" representation; if params change, the preview and the
 * validation result change from the same input.
 */
function TableMesh({ params, finishColor }: TablePreviewProps) {
  const widthM = params.widthMm * MM_TO_M;
  const depthM = params.depthMm * MM_TO_M;
  const heightM = params.heightMm * MM_TO_M;
  const topThicknessM = 0.03;
  const legInsetM = 0.06;
  const legThicknessM = 0.045;

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: finishColor,
        roughness: 0.55,
        metalness: 0.08,
      }),
    [finishColor],
  );

  const topGeometry = useMemo(() => {
    if (params.topShape === "round") {
      const radius = Math.min(widthM, depthM) / 2;
      return <cylinderGeometry args={[radius, radius, topThicknessM, 48]} />;
    }
    if (params.topShape === "oval") {
      const shape = new THREE.Shape();
      const rx = widthM / 2;
      const ry = depthM / 2;
      shape.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
      const extrude = { depth: topThicknessM, bevelEnabled: false, curveSegments: 48 };
      return <extrudeGeometry args={[shape, extrude]} />;
    }
    return <boxGeometry args={[widthM, topThicknessM, depthM]} />;
  }, [params.topShape, widthM, depthM, topThicknessM]);

  const topRotation: [number, number, number] =
    params.topShape === "oval" ? [-Math.PI / 2, 0, 0] : [0, 0, 0];
  const topPositionY = heightM - topThicknessM / 2;

  const legHeight = heightM - topThicknessM;
  const legY = legHeight / 2;

  // For round/oval tops, corner leg placement must stay inside the actual
  // top footprint (an ellipse), not the rectangular bounding box — otherwise
  // legs render floating outside the tabletop edge.
  const isRoundOrOval = params.topShape === "round" || params.topShape === "oval";
  const footprintScale = isRoundOrOval ? Math.SQRT1_2 * 0.82 : 1;
  const legX = (widthM / 2) * footprintScale - legInsetM;
  const legZ = (depthM / 2) * footprintScale - legInsetM;

  const renderLegs = () => {
    if (params.baseStyle === "pedestal") {
      const pedestalRadius = Math.min(widthM, depthM) * 0.16;
      return (
        <mesh position={[0, legY, 0]} castShadow material={material}>
          <cylinderGeometry args={[pedestalRadius, pedestalRadius * 1.3, legHeight, 24]} />
        </mesh>
      );
    }

    if (params.baseStyle === "trestle") {
      const beamThickness = legThicknessM;
      return (
        <>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * (legX - 0.02), legY, 0]} castShadow material={material}>
              <boxGeometry args={[beamThickness, legHeight, depthM * 0.75]} />
            </mesh>
          ))}
          <mesh position={[0, legY, 0]} castShadow material={material}>
            <boxGeometry args={[widthM - beamThickness * 2, beamThickness, beamThickness]} />
          </mesh>
        </>
      );
    }

    // four-leg (default)
    const positions: [number, number][] = [
      [-legX, -legZ],
      [legX, -legZ],
      [-legX, legZ],
      [legX, legZ],
    ];
    return positions.map(([x, z], i) => (
      <mesh key={i} position={[x, legY, z]} castShadow material={material}>
        <boxGeometry args={[legThicknessM, legHeight, legThicknessM]} />
      </mesh>
    ));
  };

  return (
    <group>
      <mesh position={[0, topPositionY, 0]} rotation={topRotation} castShadow material={material}>
        {topGeometry}
      </mesh>
      {renderLegs()}
    </group>
  );
}

export function TablePreview({ params, finishColor }: TablePreviewProps) {
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
          <TableMesh params={params} finishColor={finishColor} />
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
