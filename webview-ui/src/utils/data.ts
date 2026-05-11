import { Plane2D, NormalizedData, GeometryObject } from '../types';

export const detectPlane = (vertices: number[][]): Plane2D | null => {
  if (!vertices || vertices.length === 0) return null;
  const allSameZ = vertices.every(v => v[2] === vertices[0][2]);
  if (allSameZ) return 'XY';
  const allSameY = vertices.every(v => v[1] === vertices[0][1]);
  if (allSameY) return 'XZ';
  const allSameX = vertices.every(v => v[0] === vertices[0][0]);
  if (allSameX) return 'YZ';
  return null;
};

export const normalizeData = (data: any): NormalizedData => {
  if (!data) return { objects: [] };

  let globalType = data.type;
  let globalThickness = data.thickness;
  let globalThicknessUnit = data.thicknessUnit;

  let objects: GeometryObject[] = [];
  if (Array.isArray(data)) {
    objects = data;
  } else if (data.objects && Array.isArray(data.objects)) {
    objects = data.objects;
  } else if (data.vertices && data.edges) {
    objects = [data];
  }

  return { globalType, globalThickness, globalThicknessUnit, objects };
};
