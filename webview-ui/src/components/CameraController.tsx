import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Plane2D, Saved3DState } from '../types';

export const PLANE_CAMERAS: Record<Plane2D, { position: [number, number, number]; up: [number, number, number] }> = {
  XY: { position: [0, 0, 50], up: [0, 1, 0] },
  XZ: { position: [0, 50, 0], up: [0, 0, -1] },
  YZ: { position: [50, 0, 0], up: [0, 1, 0] },
};

export const DEFAULT_3D_POSITION = new THREE.Vector3(20, 20, 15);
export const DEFAULT_3D_UP = new THREE.Vector3(0, 0, 1);
export const DEFAULT_3D_TARGET = new THREE.Vector3(0, 0, 0);

export const CameraController = ({
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
      if (wasIn3D && controls) {
        saved3DRef.current = {
          camPos: camera.position.clone(),
          camUp: camera.up.clone(),
          target: controls.target.clone(),
        };
      }

      const preset = PLANE_CAMERAS[plane];
      camera.position.set(...preset.position);
      camera.up.set(...preset.up);
      camera.lookAt(0, 0, 0);

      if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
      }
    } else {
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
