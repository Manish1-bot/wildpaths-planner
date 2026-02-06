import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { DrawingMode } from './AreaDrawingTools';
import { AreaDetails, calculatePolygonArea, calculateCircleArea, calculateRectangleArea } from '@/lib/areaCalculations';

interface InteractiveAreaMapProps {
  center?: [number, number];
  zoom?: number;
  drawingMode: DrawingMode;
  onAreaDrawn: (polygon: GeoJSON.Feature<GeoJSON.Polygon>, details: AreaDetails) => void;
  onMeasurement?: (distanceM: number) => void;
  drawnArea?: GeoJSON.Feature<GeoJSON.Polygon> | null;
  className?: string;
}

export function InteractiveAreaMap({
  center = [78.9629, 20.5937],
  zoom = 5,
  drawingMode,
  onAreaDrawn,
  onMeasurement,
  drawnArea,
  className = '',
}: InteractiveAreaMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Drawing state
  const drawPoints = useRef<[number, number][]>([]);
  const startPoint = useRef<[number, number] | null>(null);
  const isDragging = useRef(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
          satellite: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: center,
      zoom: zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Add drawing layers
      map.current?.addSource('drawing', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current?.addSource('preview', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Filled area layer
      map.current?.addLayer({
        id: 'drawing-fill',
        type: 'fill',
        source: 'drawing',
        paint: {
          'fill-color': '#22c55e',
          'fill-opacity': 0.3,
        },
        filter: ['==', '$type', 'Polygon'],
      });

      // Outline layer
      map.current?.addLayer({
        id: 'drawing-line',
        type: 'line',
        source: 'drawing',
        paint: {
          'line-color': '#16a34a',
          'line-width': 3,
        },
      });

      // Preview layer for drawing in progress
      map.current?.addLayer({
        id: 'preview-fill',
        type: 'fill',
        source: 'preview',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.2,
        },
        filter: ['==', '$type', 'Polygon'],
      });

      map.current?.addLayer({
        id: 'preview-line',
        type: 'line',
        source: 'preview',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2,
          'line-dasharray': [3, 2],
        },
      });

      map.current?.addLayer({
        id: 'preview-points',
        type: 'circle',
        source: 'preview',
        paint: {
          'circle-radius': 6,
          'circle-color': '#3b82f6',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
        filter: ['==', '$type', 'Point'],
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update map center when prop changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    map.current.flyTo({ center, zoom: Math.max(zoom, 14), duration: 1500 });
  }, [center, zoom, mapLoaded]);

  // Update drawn area display
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const source = map.current.getSource('drawing') as maplibregl.GeoJSONSource;
    if (source && drawnArea) {
      source.setData({
        type: 'FeatureCollection',
        features: [drawnArea],
      });
    } else if (source) {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [drawnArea, mapLoaded]);

  // Handle drawing mode changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const canvas = map.current.getCanvas();
    
    switch (drawingMode) {
      case 'rectangle':
      case 'circle':
        canvas.style.cursor = 'crosshair';
        break;
      case 'polygon':
        canvas.style.cursor = 'crosshair';
        break;
      case 'measure':
        canvas.style.cursor = 'crosshair';
        break;
      default:
        canvas.style.cursor = 'grab';
    }

    // Clear preview when mode changes
    const previewSource = map.current.getSource('preview') as maplibregl.GeoJSONSource;
    if (previewSource) {
      previewSource.setData({ type: 'FeatureCollection', features: [] });
    }
    drawPoints.current = [];
    startPoint.current = null;
    isDragging.current = false;
  }, [drawingMode, mapLoaded]);

  // Drawing event handlers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const handleMouseDown = (e: maplibregl.MapMouseEvent) => {
      if (drawingMode === 'select') return;
      
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      
      if (drawingMode === 'rectangle' || drawingMode === 'circle') {
        startPoint.current = coords;
        isDragging.current = true;
        map.current!.dragPan.disable();
      }
    };

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      if (!isDragging.current || !startPoint.current) return;
      
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      updatePreview(startPoint.current, coords);
    };

    const handleMouseUp = (e: maplibregl.MapMouseEvent) => {
      if (!isDragging.current || !startPoint.current) return;
      
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      isDragging.current = false;
      map.current!.dragPan.enable();
      
      completeShape(startPoint.current, coords);
      startPoint.current = null;
    };

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (drawingMode !== 'polygon' && drawingMode !== 'measure') return;
      
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      drawPoints.current.push(coords);
      updatePolygonPreview();
    };

    const handleDblClick = (e: maplibregl.MapMouseEvent) => {
      if (drawingMode !== 'polygon' && drawingMode !== 'measure') return;
      e.preventDefault();
      
      if (drawPoints.current.length >= 3) {
        completePolygon();
      }
      drawPoints.current = [];
    };

    map.current.on('mousedown', handleMouseDown);
    map.current.on('mousemove', handleMouseMove);
    map.current.on('mouseup', handleMouseUp);
    map.current.on('click', handleClick);
    map.current.on('dblclick', handleDblClick);

    return () => {
      map.current?.off('mousedown', handleMouseDown);
      map.current?.off('mousemove', handleMouseMove);
      map.current?.off('mouseup', handleMouseUp);
      map.current?.off('click', handleClick);
      map.current?.off('dblclick', handleDblClick);
    };
  }, [drawingMode, mapLoaded, onAreaDrawn, onMeasurement]);

  const updatePreview = (start: [number, number], current: [number, number]) => {
    if (!map.current) return;
    const previewSource = map.current.getSource('preview') as maplibregl.GeoJSONSource;
    if (!previewSource) return;

    let previewFeature: GeoJSON.Feature;

    if (drawingMode === 'rectangle') {
      previewFeature = turf.bboxPolygon([
        Math.min(start[0], current[0]),
        Math.min(start[1], current[1]),
        Math.max(start[0], current[0]),
        Math.max(start[1], current[1]),
      ]);
    } else if (drawingMode === 'circle') {
      const radiusKm = turf.distance(turf.point(start), turf.point(current), { units: 'kilometers' });
      previewFeature = turf.circle(start, radiusKm, { units: 'kilometers', steps: 64 });
    } else {
      return;
    }

    previewSource.setData({
      type: 'FeatureCollection',
      features: [previewFeature],
    });
  };

  const updatePolygonPreview = () => {
    if (!map.current) return;
    const previewSource = map.current.getSource('preview') as maplibregl.GeoJSONSource;
    if (!previewSource || drawPoints.current.length === 0) return;

    const features: GeoJSON.Feature[] = drawPoints.current.map((coord) => 
      turf.point(coord)
    );

    if (drawPoints.current.length >= 2) {
      features.push(turf.lineString(drawPoints.current));
    }

    if (drawPoints.current.length >= 3) {
      const closedCoords = [...drawPoints.current, drawPoints.current[0]];
      features.push(turf.polygon([closedCoords]));
    }

    previewSource.setData({
      type: 'FeatureCollection',
      features,
    });
  };

  const completeShape = (start: [number, number], end: [number, number]) => {
    let polygon: GeoJSON.Feature<GeoJSON.Polygon>;
    let details: AreaDetails;

    if (drawingMode === 'rectangle') {
      polygon = turf.bboxPolygon([
        Math.min(start[0], end[0]),
        Math.min(start[1], end[1]),
        Math.max(start[0], end[0]),
        Math.max(start[1], end[1]),
      ]) as GeoJSON.Feature<GeoJSON.Polygon>;
      details = calculateRectangleArea(start, end);
    } else if (drawingMode === 'circle') {
      const radiusM = turf.distance(turf.point(start), turf.point(end), { units: 'meters' });
      polygon = turf.circle(start, radiusM / 1000, { units: 'kilometers', steps: 64 }) as GeoJSON.Feature<GeoJSON.Polygon>;
      details = calculateCircleArea(start, radiusM);
    } else {
      return;
    }

    // Clear preview
    const previewSource = map.current?.getSource('preview') as maplibregl.GeoJSONSource;
    if (previewSource) {
      previewSource.setData({ type: 'FeatureCollection', features: [] });
    }

    onAreaDrawn(polygon, details);
  };

  const completePolygon = () => {
    if (drawPoints.current.length < 3) return;

    const closedCoords = [...drawPoints.current, drawPoints.current[0]];
    const polygon = turf.polygon([closedCoords]) as GeoJSON.Feature<GeoJSON.Polygon>;
    const details = calculatePolygonArea(closedCoords);

    // Clear preview
    const previewSource = map.current?.getSource('preview') as maplibregl.GeoJSONSource;
    if (previewSource) {
      previewSource.setData({ type: 'FeatureCollection', features: [] });
    }

    if (drawingMode === 'measure') {
      onMeasurement?.(details.perimeterM);
    } else {
      onAreaDrawn(polygon, details);
    }
  };

  // Public method to clear the map
  const clearDrawing = useCallback(() => {
    if (!map.current) return;
    
    const drawingSource = map.current.getSource('drawing') as maplibregl.GeoJSONSource;
    const previewSource = map.current.getSource('preview') as maplibregl.GeoJSONSource;
    
    if (drawingSource) {
      drawingSource.setData({ type: 'FeatureCollection', features: [] });
    }
    if (previewSource) {
      previewSource.setData({ type: 'FeatureCollection', features: [] });
    }
    
    drawPoints.current = [];
    startPoint.current = null;
    isDragging.current = false;
  }, []);

  return (
    <div className={`relative w-full h-full min-h-[500px] ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />
      
      {/* Drawing Mode Indicator */}
      {drawingMode !== 'select' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border">
            <p className="text-sm font-medium">
              {drawingMode === 'rectangle' && '📐 Click and drag to draw rectangle'}
              {drawingMode === 'circle' && '⭕ Click center and drag to set radius'}
              {drawingMode === 'polygon' && '🔺 Click to add points, double-click to finish'}
              {drawingMode === 'measure' && '📏 Click points to measure, double-click to finish'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
