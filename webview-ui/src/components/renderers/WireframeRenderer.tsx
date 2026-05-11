import React from 'react';
import * as THREE from 'three';
import { Line, Sphere } from '@react-three/drei';
import { GeometryObject } from '../../types';

export const WireframeRenderer = ({
  obj,
  objIdx,
  transformedVertices,
  objColor,
}: {
  obj: GeometryObject;
  objIdx: number;
  transformedVertices: THREE.Vector3[];
  objColor: string;
}) => {
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
          <meshStandardMaterial color={objColor} side={THREE.DoubleSide} />
        </Sphere>
      ))}
    </group>
  );
};
