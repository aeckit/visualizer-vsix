import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Sphere } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ── Plane types ────────────────────────────────────────────────── */
type Plane2D = 'XY' | 'XZ' | 'YZ';

/**
 * Camera presets for each 2D plane.
 *   position  – where the camera sits
 *   up        – which direction is "up" on screen
 */
const PLANE_CAMERAS: Record<Plane2D, { position: [number, number, number]; up: [number, number, number] }> = {
  XY: { position: [0, 0, 50],  up: [0, 1, 0]  },   // top-down, looking along -Z
  XZ: { position: [0, 50, 0],  up: [0, 0, -1] },    // front,    looking along -Y
  YZ: { position: [50, 0, 0],  up: [0, 1, 0]  },    // side,     looking along -X
};

/** Detect which plane the geometry lies on (if any). */
const detectPlane = (vertices: number[][]): Plane2D | null => {
  if (!vertices || vertices.length === 0) return null;
  const allSameZ = vertices.every(v => v[2] === vertices[0][2]);
  if (allSameZ) return 'XY';
  const allSameY = vertices.every(v => v[1] === vertices[0][1]);
  if (allSameY) return 'XZ';
  const allSameX = vertices.every(v => v[0] === vertices[0][0]);
  if (allSameX) return 'YZ';
  return null;
};

/* ── Saved 3D state ─────────────────────────────────────────────── */
interface Saved3DState {
  camPos: THREE.Vector3;
  camUp: THREE.Vector3;
  target: THREE.Vector3;
}

const DEFAULT_3D_POSITION = new THREE.Vector3(20, 15, 20);
const DEFAULT_3D_UP = new THREE.Vector3(0, 1, 0);
const DEFAULT_3D_TARGET = new THREE.Vector3(0, 0, 0);

/* ── Camera controller ──────────────────────────────────────────── */
const CameraController = ({
  is2D,
  plane,
  orbitRef,
  saved3DRef,
}: {
  is2D: boolean;
  plane: Plane2D;
  orbitRef: React.RefObject<any>;
  saved3DRef: React.MutableRefObject<Saved3DState | null>;
}) => {
  const { camera } = useThree();
  const prevIs2DRef = useRef(is2D);

  useEffect(() => {
    const controls = orbitRef.current;
    const wasIn3D = !prevIs2DRef.current;

    if (is2D) {
      // Only save 3D state on the actual 3D → 2D transition
      if (wasIn3D && controls) {
        saved3DRef.current = {
          camPos: camera.position.clone(),
          camUp: camera.up.clone(),
          target: controls.target.clone(),
        };
      }

      // Snap to 2D plane preset
      const preset = PLANE_CAMERAS[plane];
      camera.position.set(...preset.position);
      camera.up.set(...preset.up);
      camera.lookAt(0, 0, 0);

      if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
      }
    } else {
      // Restore saved 3D state, or use defaults
      const saved = saved3DRef.current;
      if (saved) {
        camera.position.copy(saved.camPos);
        camera.up.copy(saved.camUp);
        camera.lookAt(saved.target);
        if (controls) {
          controls.target.copy(saved.target);
          controls.update();
        }
      } else {
        camera.position.copy(DEFAULT_3D_POSITION);
        camera.up.copy(DEFAULT_3D_UP);
        camera.lookAt(DEFAULT_3D_TARGET);
        if (controls) {
          controls.target.copy(DEFAULT_3D_TARGET);
          controls.update();
        }
      }
    }

    prevIs2DRef.current = is2D;
  }, [is2D, plane, camera, orbitRef, saved3DRef]);

  return null;
};

/* ── Wireframe model ────────────────────────────────────────────── */
const WireframeModel = ({ data, autoRotate, is2D }: { data: any; autoRotate: boolean; is2D: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [vertices, setVertices] = useState<THREE.Vector3[]>([]);

  // Initialize vertices when data changes
  useEffect(() => {
    if (!data || !data.vertices) return;

    // Calculate bounding box to center the model
    const bg = new THREE.Box3();
    data.vertices.forEach((v: number[]) => bg.expandByPoint(new THREE.Vector3(v[0], v[1], v[2])));
    const center = new THREE.Vector3();
    bg.getCenter(center);

    const initialVertices = data.vertices.map((v: number[]) =>
      new THREE.Vector3(v[0] - center.x, v[1] - center.y, v[2] - center.z)
    );
    setVertices(initialVertices);
  }, [data]);

  // Reset model rotation when entering 2D mode
  useEffect(() => {
    if (is2D && groupRef.current) {
      groupRef.current.rotation.set(0, 0, 0);
    }
  }, [is2D]);

  // Auto-rotate when enabled
  useFrame(() => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  const lines = useMemo(() => {
    if (!data || !data.edges || vertices.length === 0) return null;
    return data.edges.map((edge: number[], index: number) => {
      const v1 = vertices[edge[0]];
      const v2 = vertices[edge[1]];
      if (!v1 || !v2) return null;
      return (
        <Line
          key={`edge-${index}`}
          points={[v1, v2]}
          color="#58a6ff"
          lineWidth={2}
        />
      );
    });
  }, [data, vertices]);

  return (
    <group ref={groupRef}>
      {lines}
      {vertices.map((v, i) => (
        <Sphere key={`node-${i}`} args={[0.4, 16, 16]} position={v}>
          <meshStandardMaterial color="#58a6ff" />
        </Sphere>
      ))}
    </group>
  );
};

/* ── Toolbar button styles ──────────────────────────────────────── */
const btnBase: React.CSSProperties = {
  padding: '5px 10px',
  fontSize: '12px',
  fontFamily: 'var(--vscode-font-family, sans-serif)',
  border: '1px solid var(--vscode-button-border, transparent)',
  borderRadius: '4px',
  cursor: 'pointer',
  opacity: 0.9,
};

const btnActive: React.CSSProperties = {
  ...btnBase,
  color: 'var(--vscode-button-foreground, #fff)',
  backgroundColor: 'var(--vscode-button-background, #0e639c)',
};

const btnInactive: React.CSSProperties = {
  ...btnBase,
  color: 'var(--vscode-button-secondaryForeground, #ccc)',
  backgroundColor: 'var(--vscode-button-secondaryBackground, #3a3d41)',
};

const separator: React.CSSProperties = {
  width: '1px',
  height: '20px',
  backgroundColor: 'var(--vscode-button-secondaryBackground, #3a3d41)',
};

/* ── Main component ─────────────────────────────────────────────── */
const GeometryViewer = ({ data }: { data: any }) => {
  const detected = data?.vertices ? detectPlane(data.vertices) : null;

  const [is2D, setIs2D] = useState(detected !== null);
  const [plane, setPlane] = useState<Plane2D>(detected ?? 'XY');
  const [autoRotate, setAutoRotate] = useState(detected === null);

  const orbitRef = useRef<any>(null);
  const saved3DRef = useRef<Saved3DState | null>(null);

  // Re-detect when new file data arrives
  useEffect(() => {
    const det = data?.vertices ? detectPlane(data.vertices) : null;
    setIs2D(det !== null);
    setPlane(det ?? 'XY');
    setAutoRotate(det === null);
    saved3DRef.current = null; // clear saved state for new geometry
  }, [data]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'var(--vscode-editor-background)', overflow: 'hidden' }}>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: '12px', right: '12px', zIndex: 10,
        display: 'flex', gap: '6px', alignItems: 'center',
      }}>
        {/* 2D / 3D toggle */}
        <button onClick={() => { setIs2D(true); setAutoRotate(false); }} style={is2D ? btnActive : btnInactive}>
          2D
        </button>
        <button onClick={() => { setIs2D(false); }} style={!is2D ? btnActive : btnInactive}>
          3D
        </button>

        {/* Plane selector (only in 2D) */}
        {is2D && (
          <>
            <div style={separator} />
            {(['XY', 'XZ', 'YZ'] as Plane2D[]).map(p => (
              <button
                key={p}
                onClick={() => setPlane(p)}
                style={plane === p ? btnActive : btnInactive}
              >
                {p}
              </button>
            ))}
          </>
        )}

        {/* Auto-Rotate (only in 3D) */}
        {!is2D && (
          <>
            <div style={separator} />
            <button onClick={() => setAutoRotate(!autoRotate)} style={autoRotate ? btnActive : btnInactive}>
              {autoRotate ? '⏸ Rotate' : '▶ Rotate'}
            </button>
          </>
        )}
      </div>

      {/* ── Three.js Canvas ─────────────────────────────────── */}
      <Canvas camera={{ position: [20, 15, 20], fov: 50 }}>
        <CameraController is2D={is2D} plane={plane} orbitRef={orbitRef} saved3DRef={saved3DRef} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <WireframeModel data={data} autoRotate={autoRotate && !is2D} is2D={is2D} />

        {!is2D && (
          <Grid
            infiniteGrid
            fadeDistance={50}
            sectionColor={new THREE.Color('gray')}
            cellColor={new THREE.Color('gray')}
            position={[0, -5, 0]}
          />
        )}

        <OrbitControls ref={orbitRef} makeDefault enableRotate={!is2D} />

        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default GeometryViewer;
