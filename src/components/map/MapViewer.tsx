import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Layers, 
  Pencil, 
  Square, 
  Trash2, 
  Download, 
  ZoomIn, 
  ZoomOut,
  LocateFixed,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapViewerProps {
  geojsonLayers?: Array<{
    id: string;
    name: string;
    data: any;
    color?: string;
    visible?: boolean;
  }>;
  onDrawComplete?: (geojson: any) => void;
  className?: string;
  interactive?: boolean;
}

export function MapViewer({ 
  geojsonLayers = [], 
  onDrawComplete,
  className,
  interactive = true 
}: MapViewerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [drawMode, setDrawMode] = useState<'none' | 'polygon' | 'line'>('none');
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set());
  const [drawnFeatures, setDrawnFeatures] = useState<any[]>([]);
  const drawPoints = useRef<[number, number][]>([]);

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
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: [78.9629, 20.5937], // India center
      zoom: 4,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add GeoJSON layers when data changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Initialize visible layers
    const newVisible = new Set<string>();
    
    geojsonLayers.forEach((layer) => {
      const sourceId = `source-${layer.id}`;
      const layerId = `layer-${layer.id}`;
      const pointLayerId = `layer-${layer.id}-points`;

      // Remove existing layers and sources
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current?.getLayer(pointLayerId)) {
        map.current.removeLayer(pointLayerId);
      }
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }

      if (!layer.data) return;

      // Add source
      map.current?.addSource(sourceId, {
        type: 'geojson',
        data: layer.data,
      });

      // Determine feature types
      const hasPolygons = layer.data.features?.some((f: any) => 
        f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
      );
      const hasPoints = layer.data.features?.some((f: any) => 
        f.geometry?.type === 'Point'
      );
      const hasLines = layer.data.features?.some((f: any) => 
        f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString'
      );

      const color = layer.color || '#22c55e';

      // Add polygon layer
      if (hasPolygons) {
        map.current?.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': color,
            'fill-opacity': 0.4,
            'fill-outline-color': color,
          },
          filter: ['any', ['==', '$type', 'Polygon'], ['==', '$type', 'MultiPolygon']],
        });
      }

      // Add line layer
      if (hasLines) {
        map.current?.addLayer({
          id: `${layerId}-lines`,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': color,
            'line-width': 3,
          },
          filter: ['any', ['==', '$type', 'LineString'], ['==', '$type', 'MultiLineString']],
        });
      }

      // Add point layer
      if (hasPoints) {
        map.current?.addLayer({
          id: pointLayerId,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': 6,
            'circle-color': color,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
          filter: ['==', '$type', 'Point'],
        });
      }

      if (layer.visible !== false) {
        newVisible.add(layer.id);
      }

      // Fit to bounds
      if (layer.data.features?.length > 0) {
        try {
          const bounds = new maplibregl.LngLatBounds();
          layer.data.features.forEach((feature: any) => {
            if (feature.geometry?.coordinates) {
              const addCoords = (coords: any) => {
                if (typeof coords[0] === 'number') {
                  bounds.extend(coords as [number, number]);
                } else {
                  coords.forEach(addCoords);
                }
              };
              addCoords(feature.geometry.coordinates);
            }
          });
          if (!bounds.isEmpty()) {
            map.current?.fitBounds(bounds, { padding: 50 });
          }
        } catch (e) {
          console.warn('Could not fit bounds:', e);
        }
      }
    });

    setVisibleLayers(newVisible);
  }, [geojsonLayers, mapLoaded]);

  // Handle drawing
  useEffect(() => {
    if (!map.current || !mapLoaded || !interactive) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (drawMode === 'none') return;

      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      drawPoints.current.push(coords);

      // Update preview
      updateDrawPreview();
    };

    const handleDblClick = (e: maplibregl.MapMouseEvent) => {
      if (drawMode === 'none') return;
      e.preventDefault();

      if (drawPoints.current.length >= 3) {
        const feature: any = {
          type: 'Feature',
          geometry: {
            type: drawMode === 'polygon' ? 'Polygon' : 'LineString',
            coordinates: drawMode === 'polygon' 
              ? [[...drawPoints.current, drawPoints.current[0]]]
              : drawPoints.current,
          },
          properties: {
            name: `Corridor ${drawnFeatures.length + 1}`,
            created: new Date().toISOString(),
          },
        };

        setDrawnFeatures((prev) => [...prev, feature]);
        onDrawComplete?.(feature);
      }

      // Reset
      drawPoints.current = [];
      removeDrawPreview();
      setDrawMode('none');
    };

    map.current.on('click', handleClick);
    map.current.on('dblclick', handleDblClick);

    return () => {
      map.current?.off('click', handleClick);
      map.current?.off('dblclick', handleDblClick);
    };
  }, [drawMode, mapLoaded, drawnFeatures, onDrawComplete, interactive]);

  const updateDrawPreview = () => {
    if (!map.current || drawPoints.current.length === 0) return;

    const previewData: any = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: drawPoints.current,
          },
          properties: {},
        },
        ...drawPoints.current.map((coord) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: coord },
          properties: {},
        })),
      ],
    };

    if (map.current.getSource('draw-preview')) {
      (map.current.getSource('draw-preview') as maplibregl.GeoJSONSource).setData(previewData);
    } else {
      map.current.addSource('draw-preview', { type: 'geojson', data: previewData });
      map.current.addLayer({
        id: 'draw-preview-line',
        type: 'line',
        source: 'draw-preview',
        paint: { 'line-color': '#3b82f6', 'line-width': 3, 'line-dasharray': [2, 2] },
        filter: ['==', '$type', 'LineString'],
      });
      map.current.addLayer({
        id: 'draw-preview-points',
        type: 'circle',
        source: 'draw-preview',
        paint: { 'circle-radius': 6, 'circle-color': '#3b82f6' },
        filter: ['==', '$type', 'Point'],
      });
    }
  };

  const removeDrawPreview = () => {
    if (!map.current) return;
    if (map.current.getLayer('draw-preview-line')) map.current.removeLayer('draw-preview-line');
    if (map.current.getLayer('draw-preview-points')) map.current.removeLayer('draw-preview-points');
    if (map.current.getSource('draw-preview')) map.current.removeSource('draw-preview');
  };

  const toggleLayerVisibility = (layerId: string) => {
    const layerName = `layer-${layerId}`;
    const pointLayerName = `layer-${layerId}-points`;
    
    setVisibleLayers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
        if (map.current?.getLayer(layerName)) {
          map.current.setLayoutProperty(layerName, 'visibility', 'none');
        }
        if (map.current?.getLayer(pointLayerName)) {
          map.current.setLayoutProperty(pointLayerName, 'visibility', 'none');
        }
      } else {
        newSet.add(layerId);
        if (map.current?.getLayer(layerName)) {
          map.current.setLayoutProperty(layerName, 'visibility', 'visible');
        }
        if (map.current?.getLayer(pointLayerName)) {
          map.current.setLayoutProperty(pointLayerName, 'visibility', 'visible');
        }
      }
      return newSet;
    });
  };

  const exportDrawnFeatures = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: drawnFeatures,
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'corridors.geojson';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('relative w-full h-full min-h-[400px]', className)}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />

      {/* Map Controls */}
      {interactive && (
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <Card className="glass-card">
            <CardContent className="p-2 flex flex-col gap-1">
              <Button
                variant={drawMode === 'polygon' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setDrawMode(drawMode === 'polygon' ? 'none' : 'polygon')}
                title="Draw Corridor (Polygon)"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant={drawMode === 'line' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setDrawMode(drawMode === 'line' ? 'none' : 'line')}
                title="Draw Path (Line)"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setDrawnFeatures([]);
                  drawPoints.current = [];
                  removeDrawPreview();
                }}
                title="Clear Drawings"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {drawnFeatures.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={exportDrawnFeatures}
                  title="Export GeoJSON"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Layer Control */}
      {geojsonLayers.length > 0 && (
        <div className="absolute top-4 right-16 z-10">
          <Card className="glass-card w-48">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-3 space-y-1">
              {geojsonLayers.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => toggleLayerVisibility(layer.id)}
                  className="w-full flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 transition-colors text-left"
                >
                  {visibleLayers.has(layer.id) ? (
                    <Eye className="h-4 w-4 text-primary" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: layer.color || '#22c55e' }}
                  />
                  <span className="text-sm truncate">{layer.name}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Draw Mode Indicator */}
      {drawMode !== 'none' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <Card className="glass-card">
            <CardContent className="py-2 px-4">
              <p className="text-sm text-center">
                Click to add points. <strong>Double-click</strong> to finish.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
