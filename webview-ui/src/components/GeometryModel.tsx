import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { NormalizedData } from '../types';
import { FloorPlanRenderer } from './renderers/FloorPlanRenderer';
import { WireframeRenderer } from './renderers/WireframeRenderer';

export const GeometryModel = ({ data, autoRotate, is2D, theme, bgColor, nodeSizeMultiplier = 1.0 }: { data: NormalizedData; autoRotate: boolean; is2D: boolean; theme: string; bgColor: string; nodeSizeMultiplier?: number }) => {
  const groupRef = useRef<THREE.Group>(null);

  const { globalType, globalThickness, globalThicknessUnit, objects } = data;

  const [globalCenter, setGlobalCenter] = useState<THREE.Vector3>(new THREE.Vector3());

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

  useEffect(() => {
    if (is2D && groupRef.current) {
      groupRef.current.rotation.set(0, 0, 0);
    }
  }, [is2D]);

  useFrame(() => {
    if (groupRef.current && autoRotate && !is2D) {
      groupRef.current.rotation.z += 0.005;
    }
  });

  const getObjectColor = (originalColor?: string) => {
    if (theme === 'blueprint') return '#ffffff';
    if (theme === 'architectural') return '#000000';
    return originalColor || '#58a6ff';
  };

  return (
    <group ref={groupRef}>
      {objects.map((obj, objIdx) => {
        if (!obj.vertices || !obj.edges) return null;

        const transformedVertices = obj.vertices.map((v: number[]) =>
          new THREE.Vector3(v[0] - globalCenter.x, v[1] - globalCenter.y, v[2] - globalCenter.z)
        );

        const objColor = getObjectColor(obj.color);
        const objType = obj.type || globalType || 'wireframe';
        const objThickness = obj.thickness ?? globalThickness ?? 6;
        const objThicknessUnit = obj.thicknessUnit || globalThicknessUnit || 'inches';
        const wallHeight = is2D ? 0.01 : 10; // flatten walls in 2D

        if (objType === 'floor_plan') {
          return (
            <FloorPlanRenderer
              key={`obj-${objIdx}`}
              obj={obj}
              objIdx={objIdx}
              transformedVertices={transformedVertices}
              objColor={objColor}
              objThickness={objThickness}
              objThicknessUnit={objThicknessUnit}
              wallHeight={wallHeight}
              is2D={is2D}
              bgColor={bgColor}
            />
          );
        }

        return (
          <WireframeRenderer
            key={`obj-${objIdx}`}
            obj={obj}
            objIdx={objIdx}
            transformedVertices={transformedVertices}
            objColor={objColor}
            nodeSizeMultiplier={nodeSizeMultiplier}
          />
        );
      })}
    </group>
  );
};
