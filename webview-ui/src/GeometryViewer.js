"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const fiber_1 = require("@react-three/fiber");
const drei_1 = require("@react-three/drei");
const postprocessing_1 = require("@react-three/postprocessing");
const THREE = require("three");
const WireframeModel = ({ data }) => {
    const groupRef = (0, react_1.useRef)(null);
    (0, fiber_1.useFrame)(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.005;
        }
    });
    const lines = (0, react_1.useMemo)(() => {
        if (!data || !data.vertices || !data.edges)
            return null;
        // Calculate bounding box to center the model
        const bg = new THREE.Box3();
        data.vertices.forEach((v) => bg.expandByPoint(new THREE.Vector3(v[0], v[1], v[2])));
        const center = new THREE.Vector3();
        bg.getCenter(center);
        return data.edges.map((edge, index) => {
            const v1 = data.vertices[edge[0]];
            const v2 = data.vertices[edge[1]];
            // Center the vertices
            const p1 = [v1[0] - center.x, v1[1] - center.y, v1[2] - center.z];
            const p2 = [v2[0] - center.x, v2[1] - center.y, v2[2] - center.z];
            return (<drei_1.Line key={index} points={[p1, p2]} color="#58a6ff" lineWidth={2}/>);
        });
    }, [data]);
    return (<group ref={groupRef}>
      {lines}
    </group>);
};
const GeometryViewer = ({ data }) => {
    return (<div style={{ width: '100vw', height: '100vh', backgroundColor: 'var(--vscode-editor-background)', overflow: 'hidden' }}>
      <fiber_1.Canvas camera={{ position: [20, 15, 20], fov: 50 }}>
        <ambientLight intensity={0.5}/>
        <directionalLight position={[10, 10, 5]} intensity={1}/>
        
        <WireframeModel data={data}/>
        
        <drei_1.Grid infiniteGrid fadeDistance={50} sectionColor={new THREE.Color("gray")} cellColor={new THREE.Color("gray")} position={[0, -5, 0]}/>
        
        <drei_1.OrbitControls makeDefault/>
        
        <postprocessing_1.EffectComposer>
          <postprocessing_1.Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} intensity={1.5}/>
        </postprocessing_1.EffectComposer>
      </fiber_1.Canvas>
    </div>);
};
exports.default = GeometryViewer;
//# sourceMappingURL=GeometryViewer.js.map