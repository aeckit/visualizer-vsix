import React from 'react';
import * as THREE from 'three';
import { Box, Edges } from '@react-three/drei';
import { GeometryObject } from '../../types';

export const FloorPlanRenderer = ({
  obj,
  objIdx,
  transformedVertices,
  objColor,
  objThickness,
  objThicknessUnit,
  wallHeight,
  is2D,
  bgColor,
}: {
  obj: GeometryObject;
  objIdx: number;
  transformedVertices: THREE.Vector3[];
  objColor: string;
  objThickness: number;
  objThicknessUnit: string;
  wallHeight: number;
  is2D: boolean;
  bgColor: string;
}) => {
  let doubleArea = 0;
  obj.edges.forEach((edge: number[]) => {
    const va = transformedVertices[edge[0]];
    const vb = transformedVertices[edge[1]];
    if (va && vb) {
      doubleArea += (va.x * vb.y - vb.x * va.y);
    }
  });
  const isCCW = doubleArea >= 0;
  const inwardSign = isCCW ? 1 : -1;
  const thicknessInFeet = objThicknessUnit === 'inches' ? objThickness / 12 : objThickness;

  return (
    <group key={`obj-${objIdx}`}>
      {obj.edges.map((edge: number[], edgeIdx: number) => {
        const va = transformedVertices[edge[0]];
        const vb = transformedVertices[edge[1]];
        if (!va || !vb) return null;

        const dx = vb.x - va.x;
        const dy = vb.y - va.y;
        const length2D = Math.sqrt(dx * dx + dy * dy);
        if (length2D === 0) return null;

        const ux = dx / length2D;
        const uy = dy / length2D;

        const nx = -uy * inwardSign;
        const ny = ux * inwardSign;

        const cx = (va.x + vb.x) / 2 + (thicknessInFeet / 2) * nx;
        const cy = (va.y + vb.y) / 2 + (thicknessInFeet / 2) * ny;
        const cz = Math.min(va.z, vb.z) + wallHeight / 2;

        const angle = Math.atan2(dy, dx);
        const dz = vb.z - va.z;
        const length3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

        return (
          <Box
            key={`obj-${objIdx}-wall-${edgeIdx}`}
            args={[length3D, thicknessInFeet, wallHeight]}
            position={[cx, cy, cz]}
            rotation={[0, 0, angle]}
          >
            {is2D ? (
              <>
                <meshBasicMaterial color={bgColor} />
                <Edges color={objColor} threshold={15} />
              </>
            ) : (
              <meshStandardMaterial color={objColor} side={THREE.DoubleSide} />
            )}
          </Box>
        );
      })}
    </group>
  );
};
