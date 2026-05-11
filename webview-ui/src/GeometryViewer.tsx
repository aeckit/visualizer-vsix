import React, { useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Plane2D } from './types';
import { normalizeData, detectPlane } from './utils/data';
import { CameraController } from './components/CameraController';
import { GeometryModel } from './components/GeometryModel';

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
const syntaxHighlight = (json: string) => {
  if (!json) return '';
  const escaped = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
    let color = '#b5cea8'; // numbers
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        color = '#9cdcfe'; // keys
      } else {
        color = '#ce9178'; // strings
      }
    } else if (/true|false|null/.test(match)) {
      color = '#569cd6'; // booleans/null
    }
    return `<span style="color:${color}">${match}</span>`;
  });
};

const GeometryViewer = ({ data, rawText }: { data: any, rawText?: string }) => {
  const normalized = normalizeData(data);
  const allVertices = normalized.objects.flatMap(obj => obj.vertices || []);
  const detected = allVertices.length > 0 ? detectPlane(allVertices) : null;
  const isFloorPlan = normalized.globalType === 'floor_plan' || normalized.objects.some(obj => obj.type === 'floor_plan');

  const [is2D, setIs2D] = useState(detected !== null);
  const [plane, setPlane] = useState<Plane2D>(detected ?? 'XY');
  const [autoRotate, setAutoRotate] = useState(detected === null);
  const [showJson, setShowJson] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'blueprint' | 'architectural'>('dark');
  const [vscodeBg, setVscodeBg] = useState('#1e1e1e');

  const orbitRef = useRef<any>(null);
  const saved3DRef = useRef<any>(null);

  useEffect(() => {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--vscode-editor-background').trim();
    if (bg) setVscodeBg(bg);
  }, []);

  useEffect(() => {
    const norm = normalizeData(data);
    const allVerts = norm.objects.flatMap(obj => obj.vertices || []);
    const det = allVerts.length > 0 ? detectPlane(allVerts) : null;
    setIs2D(det !== null);
    setPlane(det ?? 'XY');
    setAutoRotate(det === null);
    saved3DRef.current = null;
  }, [data]);

  const getBackgroundColor = () => {
    if (theme === 'blueprint') return '#0d47a1';
    if (theme === 'architectural') return '#ffffff';
    return 'var(--vscode-editor-background)';
  };
  const bgColor = theme === 'blueprint' ? '#0d47a1' : theme === 'architectural' ? '#ffffff' : vscodeBg;

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: showJson ? 'var(--vscode-editor-background)' : getBackgroundColor(), overflow: 'hidden' }}>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: '12px', right: '12px', zIndex: 10,
        display: 'flex', gap: '6px', alignItems: 'center',
      }}>
        {!showJson && (
          <>
            <button onClick={() => { setIs2D(true); setAutoRotate(false); }} style={is2D ? btnActive : btnInactive}>
              2D
            </button>
            <button onClick={() => { setIs2D(false); }} style={!is2D ? btnActive : btnInactive}>
              3D
            </button>
          </>
        )}

        {is2D && !showJson && (
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

        {!is2D && !showJson && (
          <>
            <div style={separator} />
            <button onClick={() => setAutoRotate(!autoRotate)} style={autoRotate ? btnActive : btnInactive}>
              {autoRotate ? '⏸ Rotate' : '▶ Rotate'}
            </button>
          </>
        )}

        {!showJson && (
          <>
            <div style={separator} />
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              style={{ ...btnBase, backgroundColor: 'var(--vscode-dropdown-background)', color: 'var(--vscode-dropdown-foreground)', border: '1px solid var(--vscode-dropdown-border)' }}
            >
              <option value="dark">Dark Theme</option>
              <option value="blueprint">Blueprint</option>
              <option value="architectural">Architectural</option>
            </select>
          </>
        )}

        <div style={separator} />
        <button onClick={() => {
          if ((window as any).vscode) {
            (window as any).vscode.postMessage({ type: 'openJson' });
          } else {
            setShowJson(!showJson);
          }
        }} style={btnInactive}>
          {'{ } JSON'}
        </button>
      </div>

      {/* ── Main Content ─────────────────────────────────── */}
      {showJson ? (
        <div style={{
          padding: '20px',
          paddingTop: '50px',
          height: '100%',
          overflow: 'auto',
          boxSizing: 'border-box',
          color: 'var(--vscode-editor-foreground)',
          fontFamily: 'var(--vscode-editor-font-family, monospace)',
          fontSize: 'var(--vscode-editor-font-size, 14px)',
          whiteSpace: 'pre'
        }}>
          <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(rawText || '') }} />
        </div>
      ) : (
        <Canvas camera={{ position: [20, 20, 15], up: [0, 0, 1], fov: 50 }}>
          <CameraController is2D={is2D} plane={plane} orbitRef={orbitRef} saved3DRef={saved3DRef} />
          <ambientLight intensity={theme === 'dark' ? 0.5 : 0.8} />
          <directionalLight position={[10, 10, 5]} intensity={theme === 'dark' ? 1 : 0.8} />

          <GeometryModel data={normalized} autoRotate={autoRotate && !is2D} is2D={is2D} theme={theme} bgColor={bgColor} />

          {!is2D && theme === 'dark' && (
            <Grid
              infiniteGrid
              fadeDistance={50}
              sectionColor={new THREE.Color('gray')}
              cellColor={new THREE.Color('gray')}
              position={[0, 0, -0.1]}
              rotation={[Math.PI / 2, 0, 0]}
            />
          )}

          <OrbitControls
            ref={orbitRef}
            makeDefault
            enableRotate={!is2D}
            minPolarAngle={isFloorPlan && !is2D ? Math.PI / 3 : 0}
            maxPolarAngle={isFloorPlan && !is2D ? Math.PI / 3 : Math.PI}
          />

          {theme === 'dark' && (
            <EffectComposer>
              <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5} />
            </EffectComposer>
          )}
        </Canvas>
      )}
    </div>
  );
};

export default GeometryViewer;
