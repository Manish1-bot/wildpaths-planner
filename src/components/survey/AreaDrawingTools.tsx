import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Square, 
  Circle, 
  Pentagon, 
  Ruler,
  MousePointer,
  Trash2,
  Check,
  RotateCcw,
  MapPin
} from 'lucide-react';

export type DrawingMode = 'select' | 'rectangle' | 'circle' | 'polygon' | 'measure' | 'point';

interface AreaDrawingToolsProps {
  mode: DrawingMode;
  onModeChange: (mode: DrawingMode) => void;
  onClear: () => void;
  onComplete: () => void;
  hasDrawing: boolean;
  isDrawing: boolean;
}

export function AreaDrawingTools({
  mode,
  onModeChange,
  onClear,
  onComplete,
  hasDrawing,
  isDrawing,
}: AreaDrawingToolsProps) {
  const tools: { mode: DrawingMode; icon: React.ReactNode; label: string; description: string }[] = [
    { 
      mode: 'select', 
      icon: <MousePointer className="h-5 w-5" />, 
      label: 'Select',
      description: 'Navigate and pan the map'
    },
    { 
      mode: 'rectangle', 
      icon: <Square className="h-5 w-5" />, 
      label: 'Rectangle',
      description: 'Click and drag to draw a box'
    },
    { 
      mode: 'circle', 
      icon: <Circle className="h-5 w-5" />, 
      label: 'Circle',
      description: 'Click center, drag to set radius'
    },
    { 
      mode: 'polygon', 
      icon: <Pentagon className="h-5 w-5" />, 
      label: 'Polygon',
      description: 'Click points, double-click to finish'
    },
    { 
      mode: 'measure', 
      icon: <Ruler className="h-5 w-5" />, 
      label: 'Measure',
      description: 'Measure distances on map'
    },
  ];

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-lg flex items-center gap-2">
          <Pentagon className="h-5 w-5 text-primary" />
          Draw Project Boundary
        </CardTitle>
        <CardDescription>
          Select a tool and draw your project area on the map
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drawing Tools */}
        <div className="grid grid-cols-5 gap-2">
          {tools.map((tool) => (
            <Button
              key={tool.mode}
              variant={mode === tool.mode ? 'default' : 'outline'}
              size="sm"
              onClick={() => onModeChange(tool.mode)}
              className="h-14 flex flex-col gap-1 p-2"
              title={tool.description}
            >
              {tool.icon}
              <span className="text-[10px]">{tool.label}</span>
            </Button>
          ))}
        </div>

        {/* Active Mode Info */}
        {mode !== 'select' && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="capitalize">
                {mode} Mode
              </Badge>
              {isDrawing && (
                <Badge variant="secondary" className="animate-pulse">
                  Drawing...
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {tools.find(t => t.mode === mode)?.description}
            </p>
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={!hasDrawing}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button
            size="sm"
            onClick={onComplete}
            disabled={!hasDrawing}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirm Area
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 <strong>Rectangle:</strong> Click and drag</p>
          <p>💡 <strong>Circle:</strong> Click center, then drag to set radius</p>
          <p>💡 <strong>Polygon:</strong> Click to add points, double-click to finish</p>
        </div>
      </CardContent>
    </Card>
  );
}
