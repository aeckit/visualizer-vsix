import * as THREE from 'three';

export type Plane2D = 'XY' | 'XZ' | 'YZ';

export interface GeometryObject {
  type?: 'wireframe' | 'floor_plan';
  thickness?: number;
  thicknessUnit?: 'inches' | 'feet';
  vertices: number[][];
  edges: number[][];
  faces?: number[][];
  opacity?: number;
  color?: string;
}

export interface NormalizedData {
  globalType?: 'wireframe' | 'floor_plan';
  globalThickness?: number;
  globalThicknessUnit?: 'inches' | 'feet';
  objects: GeometryObject[];
}

export interface Saved3DState {
  camPos: THREE.Vector3;
  camUp: THREE.Vector3;
  target: THREE.Vector3;
}
