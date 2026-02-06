import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Copy, 
  Trash2,
  TreePine,
  Mountain,
  Wheat,
  Home,
  Car,
  Waves,
  CircleDot
} from 'lucide-react';
import { 
  useResistanceTemplates, 
  DEFAULT_LAND_TYPES,
  LandTypeCost,
  ResistanceTemplate 
} from '@/hooks/useResistanceTemplates';

interface ResistanceMatrixEditorProps {
  onMatrixChange?: (matrix: LandTypeCost) => void;
  selectedTemplate?: ResistanceTemplate;
  speciesName?: string;
}

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

export function ResistanceMatrixEditor({ 
  onMatrixChange, 
  selectedTemplate,
  speciesName = 'Unknown Species'
}: ResistanceMatrixEditorProps) {
  const { templates, createTemplate, deleteTemplate } = useResistanceTemplates();
  
  // Initialize matrix with defaults or template
  const [matrix, setMatrix] = useState<LandTypeCost>(() => {
    if (selectedTemplate) {
      return selectedTemplate.land_type_costs;
    }
    return DEFAULT_LAND_TYPES.reduce((acc, lt) => {
      acc[lt.key] = lt.defaultCost;
      return acc;
    }, {} as LandTypeCost);
  });
  
  const [templateName, setTemplateName] = useState('');
  const [customLandTypes, setCustomLandTypes] = useState<Array<{ key: string; label: string; color: string }>>([]);

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
    onMatrixChange?.(defaultMatrix);
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) return;
    
    await createTemplate.mutateAsync({
      name: templateName,
      species_name: speciesName,
      land_type_costs: matrix,
      description: `Custom resistance matrix for ${speciesName}`,
    });
    setTemplateName('');
  };

  const loadTemplate = (template: ResistanceTemplate) => {
    setMatrix(template.land_type_costs);
    onMatrixChange?.(template.land_type_costs);
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

  const allLandTypes = [...DEFAULT_LAND_TYPES, ...customLandTypes];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Mountain className="h-5 w-5 text-primary" />
          Resistance Matrix Builder
        </CardTitle>
        <CardDescription>
          Define movement costs for {speciesName}. Lower values = preferred pathways, higher values = barriers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="editor" className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full max-w-xs">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-6">
            {/* Matrix Grid */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-sm">Land Type Movement Costs</h4>
                <Button variant="outline" size="sm" onClick={resetToDefaults}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {allLandTypes.map((landType) => (
                    <div 
                      key={landType.key} 
                      className="p-4 rounded-lg bg-muted/50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
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
                        <div className="flex items-center gap-2">
                          <Badge className={`${getCostColor(matrix[landType.key] || 1)} text-white`}>
                            {matrix[landType.key] || 1}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[matrix[landType.key] || 1]}
                          min={1}
                          max={1000}
                          step={1}
                          onValueChange={([v]) => handleCostChange(landType.key, v)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={matrix[landType.key] || 1}
                          onChange={(e) => handleCostChange(landType.key, parseInt(e.target.value) || 1)}
                          className="w-20 text-center"
                          min={1}
                          max={10000}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Quick Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quick Presets</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tigerMatrix: LandTypeCost = {
                      dense_forest: 1,
                      open_forest: 3,
                      grassland: 5,
                      scrubland: 8,
                      agriculture: 15,
                      river_creek: 3,
                      highway: 100,
                      village_road: 30,
                      human_settlement: 200,
                      water_body: 1000,
                    };
                    setMatrix(tigerMatrix);
                    onMatrixChange?.(tigerMatrix);
                  }}
                >
                  🐅 Tiger
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const elephantMatrix: LandTypeCost = {
                      dense_forest: 2,
                      open_forest: 1,
                      grassland: 3,
                      scrubland: 5,
                      agriculture: 20,
                      river_creek: 5,
                      highway: 150,
                      village_road: 50,
                      human_settlement: 300,
                      water_body: 50,
                    };
                    setMatrix(elephantMatrix);
                    onMatrixChange?.(elephantMatrix);
                  }}
                >
                  🐘 Elephant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const leopardMatrix: LandTypeCost = {
                      dense_forest: 1,
                      open_forest: 2,
                      grassland: 4,
                      scrubland: 3,
                      agriculture: 10,
                      river_creek: 8,
                      highway: 80,
                      village_road: 15,
                      human_settlement: 50,
                      water_body: 500,
                    };
                    setMatrix(leopardMatrix);
                    onMatrixChange?.(leopardMatrix);
                  }}
                >
                  🐆 Leopard
                </Button>
              </div>
            </div>

            {/* Save as Template */}
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

          <TabsContent value="templates" className="space-y-4">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mountain className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No saved templates</p>
                <p className="text-sm mt-2">Create a template in the Editor tab</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
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
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => loadTemplate(template)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {!template.is_default && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteTemplate.mutate(template.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {template.description}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
