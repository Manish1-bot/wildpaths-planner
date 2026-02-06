/**
 * Area calculation utilities using Turf.js
 */

import * as turf from '@turf/turf';

export interface AreaDetails {
  areaM2: number;
  areaHectares: number;
  areaAcres: number;
  perimeterM: number;
  perimeterKm: number;
  centroid: [number, number];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

/**
 * Calculate area details from a polygon
 */
export function calculatePolygonArea(coordinates: number[][]): AreaDetails {
  const polygon = turf.polygon([coordinates]);
  const areaM2 = turf.area(polygon);
  const length = turf.length(turf.lineString(coordinates), { units: 'meters' });
  const centroidPoint = turf.centroid(polygon);
  const bbox = turf.bbox(polygon);

  return {
    areaM2,
    areaHectares: areaM2 / 10000,
    areaAcres: areaM2 / 4046.86,
    perimeterM: length,
    perimeterKm: length / 1000,
    centroid: centroidPoint.geometry.coordinates as [number, number],
    bounds: {
      west: bbox[0],
      south: bbox[1],
      east: bbox[2],
      north: bbox[3],
    },
  };
}

/**
 * Calculate area for a circle
 */
export function calculateCircleArea(center: [number, number], radiusM: number): AreaDetails {
  const circle = turf.circle(center, radiusM / 1000, { units: 'kilometers', steps: 64 });
  const areaM2 = turf.area(circle);
  const circumference = 2 * Math.PI * radiusM;
  const bbox = turf.bbox(circle);

  return {
    areaM2,
    areaHectares: areaM2 / 10000,
    areaAcres: areaM2 / 4046.86,
    perimeterM: circumference,
    perimeterKm: circumference / 1000,
    centroid: center,
    bounds: {
      west: bbox[0],
      south: bbox[1],
      east: bbox[2],
      north: bbox[3],
    },
  };
}

/**
 * Calculate area for a rectangle
 */
export function calculateRectangleArea(corner1: [number, number], corner2: [number, number]): AreaDetails {
  const coordinates = [
    corner1,
    [corner2[0], corner1[1]] as [number, number],
    corner2,
    [corner1[0], corner2[1]] as [number, number],
    corner1,
  ];
  return calculatePolygonArea(coordinates);
}

/**
 * Create a circle polygon from center and radius
 */
export function createCirclePolygon(center: [number, number], radiusM: number): GeoJSON.Feature<GeoJSON.Polygon> {
  return turf.circle(center, radiusM / 1000, { units: 'kilometers', steps: 64 });
}

/**
 * Create a rectangle polygon from two corners
 */
export function createRectanglePolygon(corner1: [number, number], corner2: [number, number]): GeoJSON.Feature<GeoJSON.Polygon> {
  return turf.bboxPolygon([
    Math.min(corner1[0], corner2[0]),
    Math.min(corner1[1], corner2[1]),
    Math.max(corner1[0], corner2[0]),
    Math.max(corner1[1], corner2[1]),
  ]);
}

/**
 * Grid cell interface for sampling
 */
export interface GridCell {
  id: string;
  index: number;
  polygon: GeoJSON.Feature<GeoJSON.Polygon>;
  center: [number, number];
  isSampleCell: boolean;
}

/**
 * Generate grid cells for sampling
 */
export function generateGridCells(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  cellSizeM: number = 50
): GridCell[] {
  const bbox = turf.bbox(polygon);
  const cellSizeKm = cellSizeM / 1000;
  const grid = turf.squareGrid(bbox, cellSizeKm, { units: 'kilometers' });
  
  // Filter cells that intersect with the polygon
  const cells: GridCell[] = [];
  let cellIndex = 0;
  
  turf.featureEach(grid, (cell) => {
    if (turf.booleanIntersects(cell, polygon)) {
      cellIndex++;
      const centroid = turf.centroid(cell);
      cells.push({
        id: `cell-${cellIndex}`,
        index: cellIndex,
        polygon: cell as GeoJSON.Feature<GeoJSON.Polygon>,
        center: centroid.geometry.coordinates as [number, number],
        isSampleCell: cellIndex % 5 === 0, // Every 5th cell for 20% sample
      });
    }
  });

  return cells;
}

/**
 * Create grid cells for sampling (legacy function)
 */
export function createSamplingGrid(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  cellSizeM: number = 50
): GeoJSON.FeatureCollection {
  const bbox = turf.bbox(polygon);
  const cellSizeKm = cellSizeM / 1000;
  const grid = turf.squareGrid(bbox, cellSizeKm, { units: 'kilometers' });
  
  // Filter cells that intersect with the polygon
  const clippedGrid: GeoJSON.Feature[] = [];
  let cellIndex = 0;
  
  turf.featureEach(grid, (cell) => {
    if (turf.booleanIntersects(cell, polygon)) {
      cellIndex++;
      clippedGrid.push({
        ...cell,
        properties: {
          ...cell.properties,
          cellId: cellIndex,
          sampled: false,
          isSampleCell: cellIndex % 5 === 0, // Every 5th cell for 20% sample
        },
      });
    }
  });

  return {
    type: 'FeatureCollection',
    features: clippedGrid,
  };
}

/**
 * Calculate distance between two points in meters
 */
export function calculateDistance(point1: [number, number], point2: [number, number]): number {
  return turf.distance(turf.point(point1), turf.point(point2), { units: 'meters' });
}

/**
 * Format area for display
 */
export function formatArea(areaM2: number): string {
  if (areaM2 >= 10000) {
    return `${(areaM2 / 10000).toFixed(2)} ha`;
  }
  return `${areaM2.toFixed(0)} m²`;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(0)} m`;
}
