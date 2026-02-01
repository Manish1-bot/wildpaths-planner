import { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Trees, 
  Eye, 
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TreeImpactMapProps {
  affectedGeoJSON?: any;
  safeGeoJSON?: any;
  developmentGeoJSON?: any;
  className?: string;
}

export function TreeImpactMap({ 
  affectedGeoJSON, 
  safeGeoJSON, 
  developmentGeoJSON,
  className 
}: TreeImpactMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showAffected, setShowAffected] = useState(true);
  const [showSafe, setShowSafe] = useState(true);
  const [showDevelopment, setShowDevelopment] = useState(true);

  // Stats from data
  const stats = useMemo(() => ({
    affected: affectedGeoJSON?.features?.length || 0,
    safe: safeGeoJSON?.features?.length || 0,
    total: (affectedGeoJSON?.features?.length || 0) + (safeGeoJSON?.features?.length || 0),
  }), [affectedGeoJSON, safeGeoJSON]);

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
      center: [78.9629, 20.5937],
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

  // Add/update layers when data changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const addOrUpdateSource = (id: string, data: any) => {
      if (map.current?.getSource(id)) {
        (map.current.getSource(id) as maplibregl.GeoJSONSource).setData(data);
      } else {
        map.current?.addSource(id, { type: 'geojson', data });
      }
    };

    // Development layer
    if (developmentGeoJSON?.features?.length > 0) {
      addOrUpdateSource('development', developmentGeoJSON);
      
      if (!map.current?.getLayer('development-fill')) {
        map.current?.addLayer({
          id: 'development-fill',
          type: 'fill',
          source: 'development',
          paint: {
            'fill-color': '#f97316',
            'fill-opacity': 0.2,
          },
          filter: ['==', '$type', 'Polygon'],
        });
      }
      
      if (!map.current?.getLayer('development-line')) {
        map.current?.addLayer({
          id: 'development-line',
          type: 'line',
          source: 'development',
          paint: {
            'line-color': '#f97316',
            'line-width': 3,
          },
        });
      }
    }

    // Safe trees layer
    if (safeGeoJSON?.features?.length > 0) {
      addOrUpdateSource('safe-trees', safeGeoJSON);
      
      if (!map.current?.getLayer('safe-trees-layer')) {
        map.current?.addLayer({
          id: 'safe-trees-layer',
          type: 'circle',
          source: 'safe-trees',
          paint: {
            'circle-radius': 5,
            'circle-color': '#22c55e',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
          },
        });
      }
    }

    // Affected trees layer (on top)
    if (affectedGeoJSON?.features?.length > 0) {
      addOrUpdateSource('affected-trees', affectedGeoJSON);
      
      if (!map.current?.getLayer('affected-trees-layer')) {
        map.current?.addLayer({
          id: 'affected-trees-layer',
          type: 'circle',
          source: 'affected-trees',
          paint: {
            'circle-radius': 6,
            'circle-color': '#ef4444',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });
      }
    }

    // Fit bounds to all data
    const allFeatures = [
      ...(affectedGeoJSON?.features || []),
      ...(safeGeoJSON?.features || []),
      ...(developmentGeoJSON?.features || []),
    ];

    if (allFeatures.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      
      allFeatures.forEach((feature: any) => {
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
    }
  }, [affectedGeoJSON, safeGeoJSON, developmentGeoJSON, mapLoaded]);

  // Toggle layer visibility
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (map.current.getLayer('affected-trees-layer')) {
      map.current.setLayoutProperty(
        'affected-trees-layer', 
        'visibility', 
        showAffected ? 'visible' : 'none'
      );
    }
    if (map.current.getLayer('safe-trees-layer')) {
      map.current.setLayoutProperty(
        'safe-trees-layer', 
        'visibility', 
        showSafe ? 'visible' : 'none'
      );
    }
    if (map.current.getLayer('development-fill')) {
      map.current.setLayoutProperty(
        'development-fill', 
        'visibility', 
        showDevelopment ? 'visible' : 'none'
      );
    }
    if (map.current.getLayer('development-line')) {
      map.current.setLayoutProperty(
        'development-line', 
        'visibility', 
        showDevelopment ? 'visible' : 'none'
      );
    }
  }, [showAffected, showSafe, showDevelopment, mapLoaded]);

  return (
    <div className={cn('relative w-full h-full min-h-[500px]', className)}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />

      {/* Legend */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="glass-card w-56">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trees className="h-4 w-4" />
              Tree Impact Legend
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">Affected ({stats.affected})</span>
              </div>
              <Switch
                checked={showAffected}
                onCheckedChange={setShowAffected}
                className="scale-75"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Safe ({stats.safe})</span>
              </div>
              <Switch
                checked={showSafe}
                onCheckedChange={setShowSafe}
                className="scale-75"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-sm">Development</span>
              </div>
              <Switch
                checked={showDevelopment}
                onCheckedChange={setShowDevelopment}
                className="scale-75"
              />
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              Total: {stats.total} trees
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="absolute bottom-4 left-4 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setShowAffected(true);
            setShowSafe(false);
          }}
          className={cn(!showSafe && showAffected && 'ring-2 ring-red-500')}
        >
          Only Affected
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setShowAffected(false);
            setShowSafe(true);
          }}
          className={cn(showSafe && !showAffected && 'ring-2 ring-green-500')}
        >
          Only Safe
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setShowAffected(true);
            setShowSafe(true);
          }}
        >
          Show All
        </Button>
      </div>
    </div>
  );
}
