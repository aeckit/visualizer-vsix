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

interface WireframeData {
  vertices: number[][];
  edges: number[][];
  color?: string;
}

const normalizeData = (data: any): WireframeData[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.objects && Array.isArray(data.objects)) return data.objects;
  if (data.vertices && data.edges) return [data];
  return [];
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
const WireframeModel = ({ objects, autoRotate, is2D }: { objects: WireframeData[]; autoRotate: boolean; is2D: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // State for global offset to center everything
  const [globalCenter, setGlobalCenter] = useState<THREE.Vector3>(new THREE.Vector3());

  // Calculate global bounding box to center all models
  useEffect(() => {
    if (!objects || objects.length === 0) return;

    const bg = new THREE.Box3();
    let hasVertices = false;
    
    objects.forEach(obj => {
      if (obj.vertices) {
        obj.vertices.forEach((v: number[]) => {
          bg.expandByPoint(new THREE.Vector3(v[0], v[1], v[2]));
          hasVertices = true;
        });
      }
    });

    if (hasVertices) {
      const center = new THREE.Vector3();
      bg.getCenter(center);
      setGlobalCenter(center);
    } else {
      setGlobalCenter(new THREE.Vector3());
    }
  }, [objects]);

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

  return (
    <group ref={groupRef}>
      {objects.map((obj, objIdx) => {
        if (!obj.vertices || !obj.edges) return null;
        
        // Apply global offset
        const transformedVertices = obj.vertices.map((v: number[]) => 
          new THREE.Vector3(v[0] - globalCenter.x, v[1] - globalCenter.y, v[2] - globalCenter.z)
        );
        
        const objColor = obj.color || '#58a6ff';

        return (
          <group key={`obj-${objIdx}`}>
            {obj.edges.map((edge: number[], edgeIdx: number) => {
              const v1 = transformedVertices[edge[0]];
              const v2 = transformedVertices[edge[1]];
              if (!v1 || !v2) return null;
              return (
                <Line
                  key={`obj-${objIdx}-edge-${edgeIdx}`}
                  points={[v1, v2]}
                  color={objColor}
                  lineWidth={2}
                />
              );
            })}
            {transformedVertices.map((v, vIdx) => (
              <Sphere key={`obj-${objIdx}-node-${vIdx}`} args={[0.4, 16, 16]} position={v}>
                <meshStandardMaterial color={objColor} />
              </Sphere>
            ))}
          </group>
        );
      })}
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
const GeometryViewer = ({ data, rawText }: { data: any, rawText?: string }) => {
  const objects = normalizeData(data);
  const allVertices = objects.flatMap(obj => obj.vertices || []);
  const detected = allVertices.length > 0 ? detectPlane(allVertices) : null;

  const [is2D, setIs2D] = useState(detected !== null);
  const [plane, setPlane] = useState<Plane2D>(detected ?? 'XY');
  const [autoRotate, setAutoRotate] = useState(detected === null);

  const orbitRef = useRef<any>(null);
  const saved3DRef = useRef<Saved3DState | null>(null);

  // Re-detect when new file data arrives
  useEffect(() => {
    const objs = normalizeData(data);
    const allVerts = objs.flatMap(obj => obj.vertices || []);
    const det = allVerts.length > 0 ? detectPlane(allVerts) : null;
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
        <>
          <button onClick={() => { setIs2D(true); setAutoRotate(false); }} style={is2D ? btnActive : btnInactive}>
            2D
          </button>
          <button onClick={() => { setIs2D(false); }} style={!is2D ? btnActive : btnInactive}>
            3D
          </button>
        </>

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

        {/* JSON toggle */}
        <div style={separator} />
        <button onClick={() => {
          if ((window as any).vscode) {
            (window as any).vscode.postMessage({ type: 'openJson' });
          }
        }} style={btnInactive}>
          {'{ } JSON'}
        </button>
      </div>

      {/* ── Main Content ─────────────────────────────────── */}
      <Canvas camera={{ position: [20, 15, 20], fov: 50 }}>
        <CameraController is2D={is2D} plane={plane} orbitRef={orbitRef} saved3DRef={saved3DRef} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        <WireframeModel objects={objects} autoRotate={autoRotate && !is2D} is2D={is2D} />

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
