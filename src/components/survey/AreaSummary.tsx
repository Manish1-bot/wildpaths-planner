import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Ruler, 
  Trees, 
  Grid3x3, 
  Satellite, 
  ChevronRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { AreaDetails, formatArea, formatDistance } from '@/lib/areaCalculations';
import { recommendSurveyMethod } from '@/lib/geocoding';

interface AreaSummaryProps {
  areaDetails: AreaDetails | null;
  landType?: 'forest' | 'agricultural' | 'urban' | 'water' | 'other';
  locationName?: string;
  onMethodSelect: (method: 'detailed' | 'grid' | 'ai') => void;
}

export function AreaSummary({ 
  areaDetails, 
  landType = 'other',
  locationName,
  onMethodSelect 
}: AreaSummaryProps) {
  if (!areaDetails) {
    return (
      <Card className="glass-card">
        <CardContent className="pt-6 text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            Draw an area on the map to see details
          </p>
        </CardContent>
      </Card>
    );
  }

  const recommendation = recommendSurveyMethod(areaDetails.areaHectares);

  const surveyMethods = [
    {
      method: 'detailed' as const,
      icon: <Trees className="h-5 w-5" />,
      label: 'Tree-by-Tree',
      description: 'Add individual trees with full details',
      recommended: recommendation.method === 'detailed',
      minArea: 0,
      maxArea: 2,
    },
    {
      method: 'grid' as const,
      icon: <Grid3x3 className="h-5 w-5" />,
      label: 'Grid Sampling',
      description: 'Sample plots for statistical estimation',
      recommended: recommendation.method === 'grid',
      minArea: 2,
      maxArea: 10,
    },
    {
      method: 'ai' as const,
      icon: <Satellite className="h-5 w-5" />,
      label: 'AI Detection',
      description: 'Automatic detection from aerial imagery',
      recommended: recommendation.method === 'ai',
      minArea: 10,
      maxArea: Infinity,
    },
  ];

  const landTypeColors: Record<string, string> = {
    forest: 'bg-green-500/10 text-green-700 border-green-200',
    agricultural: 'bg-amber-500/10 text-amber-700 border-amber-200',
    urban: 'bg-slate-500/10 text-slate-700 border-slate-200',
    water: 'bg-blue-500/10 text-blue-700 border-blue-200',
    other: 'bg-gray-500/10 text-gray-700 border-gray-200',
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-lg flex items-center gap-2">
          <Ruler className="h-5 w-5 text-primary" />
          Area Details
        </CardTitle>
        {locationName && (
          <CardDescription className="truncate">
            📍 {locationName}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Area Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Area</p>
            <p className="text-xl font-bold">{formatArea(areaDetails.areaM2)}</p>
            <p className="text-xs text-muted-foreground">
              {areaDetails.areaAcres.toFixed(2)} acres
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Perimeter</p>
            <p className="text-xl font-bold">{formatDistance(areaDetails.perimeterM)}</p>
          </div>
        </div>

        {/* Coordinates */}
        <div className="p-3 rounded-lg bg-muted/30 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-3 w-3" />
            <span className="font-medium">Coordinates (WGS84)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
            <span>Center: {areaDetails.centroid[1].toFixed(5)}, {areaDetails.centroid[0].toFixed(5)}</span>
          </div>
        </div>

        {/* Land Type */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Land Type:</span>
          <Badge variant="outline" className={landTypeColors[landType]}>
            {landType.charAt(0).toUpperCase() + landType.slice(1)}
          </Badge>
        </div>

        {/* Survey Method Selection */}
        <div className="space-y-3 pt-2">
          <p className="text-sm font-medium flex items-center gap-2">
            Choose Survey Method
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Recommended
            </Badge>
          </p>
          
          <div className="space-y-2">
            {surveyMethods.map((method) => (
              <button
                key={method.method}
                onClick={() => onMethodSelect(method.method)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  method.recommended 
                    ? 'bg-primary/10 border-2 border-primary' 
                    : 'bg-muted/50 border border-transparent hover:border-muted-foreground/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${method.recommended ? 'bg-primary/20' : 'bg-muted'}`}>
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{method.label}</span>
                      {method.recommended && (
                        <Badge variant="default" className="text-[10px] h-5">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Best for: {method.maxArea === Infinity 
                        ? `>${method.minArea} hectares` 
                        : `${method.minArea}-${method.maxArea} hectares`}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Warning for very large areas */}
        {areaDetails.areaHectares > 100 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-amber-800">Large Area Detected</p>
              <p className="text-amber-700">
                For areas over 100 hectares, AI aerial detection is strongly recommended for efficiency.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
