import React from 'react';
import * as THREE from 'three';
import { Line, Sphere } from '@react-three/drei';
import { GeometryObject } from '../../types';

const FaceRenderer = ({
  vertices,
  faces,
  color,
  opacity,
}: {
  vertices: THREE.Vector3[];
  faces: number[][];
  color: string;
  opacity: number;
}) => {
  const geom = React.useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const indices: number[] = [];

    vertices.forEach((v) => {
      positions.push(v.x, v.y, v.z);
    });

    faces.forEach((face) => {
      if (face.length === 3) {
        indices.push(face[0], face[1], face[2]);
      } else if (face.length === 4) {
        indices.push(face[0], face[1], face[2]);
        indices.push(face[0], face[2], face[3]);
      } else if (face.length > 4) {
        for (let i = 1; i < face.length - 1; i++) {
          indices.push(face[0], face[i], face[i + 1]);
        }
      }
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }, [vertices, faces]);

  return (
    <mesh geometry={geom}>
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        side={THREE.DoubleSide}
        roughness={0.5}
        metalness={0.1}
        depthWrite={opacity >= 1}
      />
    </mesh>
  );
};

export const WireframeRenderer = ({
  obj,
  objIdx,
  transformedVertices,
  objColor,
  nodeSizeMultiplier = 1.0,
}: {
  obj: GeometryObject;
  objIdx: number;
  transformedVertices: THREE.Vector3[];
  objColor: string;
  nodeSizeMultiplier?: number;
}) => {
  const hasFaces = !!(obj.faces && obj.faces.length > 0);
  const opacity = obj.opacity ?? 1.0;
  const nodeSize = (hasFaces ? 0.0 : 0.4) * nodeSizeMultiplier;

  return (
    <group key={`obj-${objIdx}`}>
      {/* Render transparent faces if present */}
      {hasFaces && (
        <FaceRenderer
          vertices={transformedVertices}
          faces={obj.faces!}
          color={objColor}
          opacity={opacity}
        />
      )}

      {/* Render outline/edges */}
      {obj.edges.map((edge: number[], edgeIdx: number) => {
        const v1 = transformedVertices[edge[0]];
        const v2 = transformedVertices[edge[1]];
        if (!v1 || !v2) return null;
        return (
          <Line
            key={`obj-${objIdx}-edge-${edgeIdx}`}
            points={[v1, v2]}
            color={objColor}
            lineWidth={hasFaces ? 1.5 : 2.0} // Thinner outlines when showing faces
          />
        );
      })}

      {/* Render nodes as spheres only if nodeSize > 0 */}
      {nodeSize > 0 && transformedVertices.map((v, vIdx) => (
        <Sphere key={`obj-${objIdx}-node-${vIdx}`} args={[nodeSize, 16, 16]} position={v}>
          <meshStandardMaterial color={objColor} side={THREE.DoubleSide} />
        </Sphere>
      ))}
    </group>
  );
};
