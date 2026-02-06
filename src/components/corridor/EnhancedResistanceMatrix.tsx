import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Save,
  RotateCcw,
  Play,
  TreePine,
  Mountain,
  Wheat,
  Home,
  Car,
  Waves,
  CircleDot,
  Route,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useResistanceTemplates, DEFAULT_LAND_TYPES, LandTypeCost, ResistanceTemplate } from '@/hooks/useResistanceTemplates';

interface ResistanceCost {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface CorridorAnalysisResult {
  totalCost: number;
  averageCost: number;
  bottlenecks: Array<{ location: string; cost: number; recommendation: string }>;
  optimalPath: boolean;
  connectivityScore: number;
}

interface EnhancedResistanceMatrixProps {
  onMatrixChange?: (matrix: LandTypeCost) => void;
  onRunAnalysis?: (matrix: LandTypeCost, species: string) => void;
  corridorGeoJSON?: GeoJSON.FeatureCollection;
  isAnalyzing?: boolean;
}

const SPECIES_PRESETS = [
  {
    name: 'Bengal Tiger',
    emoji: '🐅',
    scientific: 'Panthera tigris tigris',
    description: 'Large carnivore requiring dense forest cover',
    matrix: {
      dense_forest: 1, open_forest: 3, grassland: 5, scrubland: 8,
      agriculture: 15, river_creek: 3, highway: 100, village_road: 30,
      human_settlement: 200, water_body: 1000,
    },
  },
  {
    name: 'Asian Elephant',
    emoji: '🐘',
    scientific: 'Elephas maximus',
    description: 'Mega-herbivore with flexible habitat use',
    matrix: {
      dense_forest: 2, open_forest: 1, grassland: 3, scrubland: 5,
      agriculture: 20, river_creek: 5, highway: 150, village_road: 50,
      human_settlement: 300, water_body: 50,
    },
  },
  {
    name: 'Indian Leopard',
    emoji: '🐆',
    scientific: 'Panthera pardus fusca',
    description: 'Adaptable carnivore tolerant of human proximity',
    matrix: {
      dense_forest: 1, open_forest: 2, grassland: 4, scrubland: 3,
      agriculture: 10, river_creek: 8, highway: 80, village_road: 15,
      human_settlement: 50, water_body: 500,
    },
  },
  {
    name: 'Gaur (Indian Bison)',
    emoji: '🦬',
    scientific: 'Bos gaurus',
    description: 'Large bovine preferring hilly forested terrain',
    matrix: {
      dense_forest: 1, open_forest: 2, grassland: 4, scrubland: 6,
      agriculture: 25, river_creek: 8, highway: 120, village_road: 40,
      human_settlement: 250, water_body: 30,
    },
  },
  {
    name: 'Sloth Bear',
    emoji: '🐻',
    scientific: 'Melursus ursinus',
    description: 'Omnivore preferring rocky, forested areas',
    matrix: {
      dense_forest: 2, open_forest: 1, grassland: 6, scrubland: 3,
      agriculture: 20, river_creek: 10, highway: 90, village_road: 25,
      human_settlement: 150, water_body: 200,
    },
  },
];

const LAND_TYPE_ICONS: Record<string, React.ReactNode> = {
  dense_forest: <TreePine className="h-4 w-4" />,
  open_forest: <TreePine className="h-4 w-4 opacity-60" />,
  grassland: <Mountain className="h-4 w-4" />,
  scrubland: <CircleDot className="h-4 w-4" />,
  agriculture: <Wheat className="h-4 w-4" />,
  river_creek: <Waves className="h-4 w-4" />,
  highway: <Car className="h-4 w-4" />,
  village_road: <Car className="h-4 w-4 opacity-60" />,
  human_settlement: <Home className="h-4 w-4" />,
  water_body: <Waves className="h-4 w-4" />,
};

export function EnhancedResistanceMatrix({
  onMatrixChange,
  onRunAnalysis,
  corridorGeoJSON,
  isAnalyzing = false,
}: EnhancedResistanceMatrixProps) {
  const { templates, createTemplate, deleteTemplate, isLoading } = useResistanceTemplates();
  
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  const [matrix, setMatrix] = useState<LandTypeCost>(() => {
    return DEFAULT_LAND_TYPES.reduce((acc, lt) => {
      acc[lt.key] = lt.defaultCost;
      return acc;
    }, {} as LandTypeCost);
  });
  const [templateName, setTemplateName] = useState('');
  const [analysisResult, setAnalysisResult] = useState<CorridorAnalysisResult | null>(null);

  // Calculate corridor viability score based on current matrix
  const viabilityScore = useMemo(() => {
    const weights = {
      dense_forest: 0.3,
      open_forest: 0.2,
      grassland: 0.1,
      scrubland: 0.05,
      agriculture: 0.1,
      river_creek: 0.05,
      highway: 0.1,
      village_road: 0.05,
      human_settlement: 0.05,
    };
    
    let score = 100;
    Object.entries(matrix).forEach(([key, cost]) => {
      const weight = weights[key as keyof typeof weights] || 0.05;
      if (cost > 50) score -= weight * 30;
      else if (cost > 20) score -= weight * 15;
      else if (cost > 10) score -= weight * 5;
    });
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [matrix]);

  const handleSpeciesSelect = (speciesName: string) => {
    const preset = SPECIES_PRESETS.find(s => s.name === speciesName);
    if (preset) {
      setSelectedSpecies(speciesName);
      setMatrix(preset.matrix);
      onMatrixChange?.(preset.matrix);
    }
  };

  const handleCostChange = (key: string, value: number) => {
    const newMatrix = { ...matrix, [key]: value };
    setMatrix(newMatrix);
    onMatrixChange?.(newMatrix);
  };

  const resetToDefaults = () => {
    const defaultMatrix = DEFAULT_LAND_TYPES.reduce((acc, lt) => {
      acc[lt.key] = lt.defaultCost;
      return acc;
    }, {} as LandTypeCost);
    setMatrix(defaultMatrix);
    setSelectedSpecies('');
    onMatrixChange?.(defaultMatrix);
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) return;
    
    await createTemplate.mutateAsync({
      name: templateName,
      species_name: selectedSpecies || 'Custom',
      land_type_costs: matrix,
      description: `Custom resistance matrix for ${selectedSpecies || 'general use'}`,
    });
    setTemplateName('');
  };

  const loadTemplate = (template: ResistanceTemplate) => {
    setMatrix(template.land_type_costs);
    setSelectedSpecies(template.species_name || '');
    onMatrixChange?.(template.land_type_costs);
  };

  const runAnalysis = () => {
    onRunAnalysis?.(matrix, selectedSpecies);
  };

  const getCostColor = (cost: number): string => {
    if (cost <= 3) return 'bg-green-500';
    if (cost <= 10) return 'bg-lime-500';
    if (cost <= 30) return 'bg-yellow-500';
    if (cost <= 100) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getCostLabel = (cost: number): string => {
    if (cost <= 1) return 'Preferred';
    if (cost <= 5) return 'Low Resistance';
    if (cost <= 15) return 'Moderate';
    if (cost <= 50) return 'High Resistance';
    if (cost <= 100) return 'Barrier';
    return 'Impassable';
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Route className="h-5 w-5 text-primary" />
          Species Resistance Matrix
        </CardTitle>
        <CardDescription>
          Configure movement costs for least-cost path analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="species" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="species">Species</TabsTrigger>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="templates">Saved</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          {/* Species Selection Tab */}
          <TabsContent value="species" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SPECIES_PRESETS.map((species) => (
                <button
                  key={species.name}
                  onClick={() => handleSpeciesSelect(species.name)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedSpecies === species.name
                      ? 'border-primary bg-primary/10'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{species.emoji}</span>
                    <div>
                      <p className="font-medium">{species.name}</p>
                      <p className="text-xs text-muted-foreground italic">{species.scientific}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{species.description}</p>
                  {selectedSpecies === species.name && (
                    <Badge className="mt-2 bg-primary">Selected</Badge>
                  )}
                </button>
              ))}
            </div>

            {selectedSpecies && (
              <div className="p-4 rounded-lg bg-primary/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Matrix loaded for {selectedSpecies}</p>
                    <p className="text-sm text-muted-foreground">
                      Viability Score: <span className="font-bold">{viabilityScore}%</span>
                    </p>
                  </div>
                  <Button onClick={runAnalysis} disabled={isAnalyzing}>
                    {isAnalyzing ? (
                      <>Analyzing...</>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Run Analysis
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Editor Tab */}
          <TabsContent value="editor" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">Land Type Costs</h4>
                {selectedSpecies && (
                  <Badge variant="outline">{selectedSpecies}</Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={resetToDefaults}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>

            {/* Viability Score */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Corridor Viability Score</span>
                <Badge className={viabilityScore > 70 ? 'bg-green-500' : viabilityScore > 40 ? 'bg-yellow-500' : 'bg-red-500'}>
                  {viabilityScore}%
                </Badge>
              </div>
              <Progress value={viabilityScore} className="h-2" />
            </div>

            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-4">
                {DEFAULT_LAND_TYPES.map((landType) => (
                  <div 
                    key={landType.key} 
                    className="p-3 rounded-lg bg-muted/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: landType.color + '40' }}
                        >
                          {LAND_TYPE_ICONS[landType.key] || <CircleDot className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{landType.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {getCostLabel(matrix[landType.key] || 1)}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${getCostColor(matrix[landType.key] || 1)} text-white`}>
                        {matrix[landType.key] || 1}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Slider
                        value={[matrix[landType.key] || 1]}
                        min={1}
                        max={500}
                        step={1}
                        onValueChange={([v]) => handleCostChange(landType.key, v)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={matrix[landType.key] || 1}
                        onChange={(e) => handleCostChange(landType.key, parseInt(e.target.value) || 1)}
                        className="w-16 text-center text-sm"
                        min={1}
                        max={10000}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Save Template */}
            <div className="flex gap-2">
              <Input
                placeholder="Template name..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
              <Button 
                onClick={saveAsTemplate}
                disabled={!templateName.trim() || createTemplate.isPending}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mountain className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No saved templates</p>
                <p className="text-sm mt-2">Create a template in the Editor tab</p>
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="space-y-3 pr-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {template.species_name || 'General'}
                          </p>
                          {template.is_default && (
                            <Badge variant="secondary" className="mt-1">Default</Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadTemplate(template)}
                        >
                          Load
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Least-Cost Path Analysis</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Configure the resistance matrix, select a species, and run the analysis to calculate 
                optimal wildlife corridors based on land cover costs.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded bg-background">
                  <span className="text-sm">Selected Species</span>
                  <Badge variant="outline">{selectedSpecies || 'None'}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded bg-background">
                  <span className="text-sm">Viability Score</span>
                  <Badge className={viabilityScore > 70 ? 'bg-green-500' : viabilityScore > 40 ? 'bg-yellow-500' : 'bg-red-500'}>
                    {viabilityScore}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded bg-background">
                  <span className="text-sm">Corridor Data</span>
                  <Badge variant="outline">
                    {corridorGeoJSON?.features?.length || 0} features
                  </Badge>
                </div>
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={runAnalysis}
              disabled={isAnalyzing || !selectedSpecies}
            >
              {isAnalyzing ? (
                <>Analyzing Corridors...</>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Corridor Analysis
                </>
              )}
            </Button>

            {/* Results placeholder */}
            {analysisResult && (
              <div className="p-4 rounded-lg bg-green-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-700">Analysis Complete</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connectivity Score: {analysisResult.connectivityScore}%
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
