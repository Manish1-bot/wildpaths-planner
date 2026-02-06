import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Square, 
  Circle, 
  Pentagon, 
  Pencil, 
  Trash2, 
  Search,
  Locate,
  Ruler,
  MousePointer,
  Undo2,
  Download,
  Upload,
  Layers
} from 'lucide-react';
import * as turf from '@turf/turf';

export type DrawMode = 'select' | 'point' | 'rectangle' | 'circle' | 'polygon' | 'freehand' | 'measure';

interface DrawnFeature {
  id: string;
  type: 'point' | 'polygon' | 'rectangle' | 'circle' | 'linestring';
  coordinates: number[] | number[][] | number[][][];
  properties: {
    area?: number;
    perimeter?: number;
    radius?: number;
    label?: string;
  };
}

interface MapDrawingToolsProps {
  onModeChange?: (mode: DrawMode) => void;
  onFeatureDrawn?: (feature: GeoJSON.Feature) => void;
  onFeatureDeleted?: (featureId: string) => void;
  onAddressSearch?: (address: string) => void;
  onCurrentLocation?: () => void;
  drawnFeatures?: DrawnFeature[];
  currentMode?: DrawMode;
}

export function MapDrawingTools({
  onModeChange,
  onFeatureDrawn,
  onFeatureDeleted,
  onAddressSearch,
  onCurrentLocation,
  drawnFeatures = [],
  currentMode = 'select',
}: MapDrawingToolsProps) {
  const [mode, setMode] = useState<DrawMode>(currentMode);
  const [searchAddress, setSearchAddress] = useState('');
  const [measurement, setMeasurement] = useState<{ distance?: number; area?: number } | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const handleModeChange = (newMode: DrawMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
  };

  const handleSearch = () => {
    if (searchAddress.trim()) {
      onAddressSearch?.(searchAddress);
    }
  };

  const formatArea = (sqMeters: number): string => {
    if (sqMeters >= 10000) {
      return `${(sqMeters / 10000).toFixed(2)} ha`;
    }
    return `${sqMeters.toFixed(0)} m²`;
  };

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  const tools: { mode: DrawMode; icon: React.ReactNode; label: string; tooltip: string }[] = [
    { mode: 'select', icon: <MousePointer className="h-4 w-4" />, label: 'Select', tooltip: 'Select features' },
    { mode: 'point', icon: <MapPin className="h-4 w-4" />, label: 'Point', tooltip: 'Add tree point' },
    { mode: 'rectangle', icon: <Square className="h-4 w-4" />, label: 'Rectangle', tooltip: 'Draw rectangle area' },
    { mode: 'circle', icon: <Circle className="h-4 w-4" />, label: 'Circle', tooltip: 'Draw circle area' },
    { mode: 'polygon', icon: <Pentagon className="h-4 w-4" />, label: 'Polygon', tooltip: 'Draw polygon area' },
    { mode: 'freehand', icon: <Pencil className="h-4 w-4" />, label: 'Freehand', tooltip: 'Freehand drawing' },
    { mode: 'measure', icon: <Ruler className="h-4 w-4" />, label: 'Measure', tooltip: 'Measure distance/area' },
  ];

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Drawing Tools
        </CardTitle>
        <CardDescription className="text-xs">
          Click to add points, double-click to finish polygons
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address Search */}
        <div className="space-y-2">
          <Label className="text-xs font-medium flex items-center gap-2">
            <Search className="h-3 w-3" />
            Address Search
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="Search location..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-8 text-sm"
            />
            <Button size="sm" variant="outline" onClick={handleSearch} className="h-8">
              <Search className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Current Location */}
        <Button
          variant="outline"
          size="sm"
          onClick={onCurrentLocation}
          className="w-full justify-start"
        >
          <Locate className="h-4 w-4 mr-2" />
          Use Current Location
        </Button>

        <Separator />

        {/* Drawing Tools Grid */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Area Selection Tools</Label>
          <div className="grid grid-cols-4 gap-1">
            {tools.map((tool) => (
              <Button
                key={tool.mode}
                variant={mode === tool.mode ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange(tool.mode)}
                className="h-10 flex flex-col gap-0.5 p-1"
                title={tool.tooltip}
              >
                {tool.icon}
                <span className="text-[10px]">{tool.label}</span>
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFeatureDeleted?.(selectedFeature || '')}
              disabled={!selectedFeature}
              className="h-10 flex flex-col gap-0.5 p-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-[10px]">Delete</span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Active Mode Display */}
        <div className="p-2 rounded-md bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Active Mode:</span>
            <Badge variant="secondary" className="capitalize">{mode}</Badge>
          </div>
        </div>

        {/* Measurement Display */}
        {measurement && (
          <div className="p-3 rounded-md bg-primary/10 space-y-1">
            <p className="text-xs font-medium">Measurement</p>
            {measurement.distance && (
              <p className="text-sm">Distance: {formatDistance(measurement.distance)}</p>
            )}
            {measurement.area && (
              <p className="text-sm">Area: {formatArea(measurement.area)}</p>
            )}
          </div>
        )}

        {/* Drawn Features List */}
        {drawnFeatures.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Drawn Features ({drawnFeatures.length})</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {drawnFeatures.map((feature) => (
                <div
                  key={feature.id}
                  className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                    selectedFeature === feature.id ? 'bg-primary/20' : 'bg-muted/50 hover:bg-muted'
                  }`}
                  onClick={() => setSelectedFeature(feature.id)}
                >
                  <div className="flex items-center gap-2">
                    {feature.type === 'point' && <MapPin className="h-3 w-3" />}
                    {feature.type === 'polygon' && <Pentagon className="h-3 w-3" />}
                    {feature.type === 'rectangle' && <Square className="h-3 w-3" />}
                    {feature.type === 'circle' && <Circle className="h-3 w-3" />}
                    <span>{feature.properties.label || feature.type}</span>
                  </div>
                  {feature.properties.area && (
                    <span className="text-muted-foreground">
                      {formatArea(feature.properties.area)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Import/Export */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Upload className="h-4 w-4 mr-1" />
            Import KML
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
