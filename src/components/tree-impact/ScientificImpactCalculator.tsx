import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  Trees, 
  AlertTriangle, 
  Sun, 
  Shovel,
  Ruler,
  Leaf,
  CircleDot,
  TrendingUp,
  DollarSign,
  FileText
} from 'lucide-react';
import { 
  calculateTreeImpact, 
  generateMitigationPlan,
  TreeData,
  AnalysisResults,
  ImpactParams
} from '@/lib/impactCalculator';
import { DEFAULT_IMPACT_CRITERIA, ImpactCriteria } from '@/hooks/useImpactAnalyses';

interface ScientificImpactCalculatorProps {
  treeData: TreeData[];
  developmentGeoJSON: GeoJSON.FeatureCollection;
  onAnalysisComplete?: (results: AnalysisResults) => void;
  isAnalyzing?: boolean;
}

export function ScientificImpactCalculator({
  treeData,
  developmentGeoJSON,
  onAnalysisComplete,
  isAnalyzing = false,
}: ScientificImpactCalculatorProps) {
  // Analysis Parameters
  const [bufferDistance, setBufferDistance] = useState(100);
  const [rootZoneMultiplier, setRootZoneMultiplier] = useState(1.5);
  const [season, setSeason] = useState<'summer' | 'winter' | 'monsoon'>('summer');
  const [sunAngle, setSunAngle] = useState(60);
  
  // Weights
  const [weights, setWeights] = useState<ImpactCriteria>(DEFAULT_IMPACT_CRITERIA);
  
  // Results
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [activeTab, setActiveTab] = useState('params');

  const updateWeight = (key: keyof ImpactCriteria, value: number) => {
    // Normalize other weights to ensure total = 1
    const oldValue = weights[key];
    const diff = value - oldValue;
    const otherKeys = Object.keys(weights).filter(k => k !== key) as (keyof ImpactCriteria)[];
    const otherTotal = otherKeys.reduce((sum, k) => sum + weights[k], 0);
    
    if (otherTotal > 0) {
      const newWeights = { ...weights, [key]: value };
      otherKeys.forEach(k => {
        newWeights[k] = Math.max(0, weights[k] - (diff * weights[k] / otherTotal));
      });
      setWeights(newWeights);
    }
  };

  const runAnalysis = () => {
    const params: Partial<ImpactParams> = {
      bufferMeters: bufferDistance,
      rootZoneMultiplier,
      season,
      sunAngleDegrees: sunAngle,
      weights: {
        distance: weights.distance_weight,
        rootDamage: weights.root_damage_weight,
        shadowLoss: weights.shadow_loss_weight,
        speciesSensitivity: weights.species_sensitivity_weight,
        treeHealth: weights.tree_health_weight,
      },
    };
    
    const analysisResults = calculateTreeImpact(treeData, developmentGeoJSON, params);
    setResults(analysisResults);
    setActiveTab('results');
    onAnalysisComplete?.(analysisResults);
  };

  const mitigationPlan = useMemo(() => {
    if (!results) return null;
    return generateMitigationPlan(results);
  }, [results]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'direct_removal': return 'bg-red-500';
      case 'high_impact': return 'bg-orange-500';
      case 'medium_impact': return 'bg-yellow-500';
      case 'low_impact': return 'bg-lime-500';
      case 'safe': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Scientific Impact Analysis Engine
        </CardTitle>
        <CardDescription>
          Configure parameters for tree impact calculation using the scientific formula
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="params">Parameters</TabsTrigger>
            <TabsTrigger value="weights">Weights</TabsTrigger>
            <TabsTrigger value="results" disabled={!results}>Results</TabsTrigger>
            <TabsTrigger value="mitigation" disabled={!results}>Mitigation</TabsTrigger>
          </TabsList>

          {/* Parameters Tab */}
          <TabsContent value="params" className="space-y-6">
            {/* Buffer Distance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  Buffer Distance
                </Label>
                <Badge variant="outline">{bufferDistance}m</Badge>
              </div>
              <div className="flex gap-2">
                {[50, 100, 150, 200].map(d => (
                  <Button
                    key={d}
                    variant={bufferDistance === d ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBufferDistance(d)}
                  >
                    {d}m
                  </Button>
                ))}
              </div>
              <Slider
                value={[bufferDistance]}
                min={10}
                max={300}
                step={10}
                onValueChange={([v]) => setBufferDistance(v)}
              />
            </div>

            {/* Root Zone Multiplier */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Shovel className="h-4 w-4" />
                  Root Zone Multiplier
                </Label>
                <Badge variant="outline">{rootZoneMultiplier}x canopy</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Root zone radius = Canopy diameter × {rootZoneMultiplier}
              </p>
              <Slider
                value={[rootZoneMultiplier]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={([v]) => setRootZoneMultiplier(v)}
              />
            </div>

            {/* Season */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Analysis Season
              </Label>
              <Select value={season} onValueChange={(v: any) => setSeason(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summer">Summer (June-September)</SelectItem>
                  <SelectItem value="winter">Winter (December-February)</SelectItem>
                  <SelectItem value="monsoon">Monsoon (July-September)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sun Angle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Sun Angle
                </Label>
                <Badge variant="outline">{sunAngle}°</Badge>
              </div>
              <Slider
                value={[sunAngle]}
                min={15}
                max={90}
                step={5}
                onValueChange={([v]) => setSunAngle(v)}
              />
              <p className="text-xs text-muted-foreground">
                Higher angle = shorter shadows (midday), lower = longer shadows (morning/evening)
              </p>
            </div>

            <Button 
              onClick={runAnalysis} 
              className="w-full" 
              size="lg"
              disabled={isAnalyzing || treeData.length === 0}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Run Scientific Analysis ({treeData.length} trees)
            </Button>
          </TabsContent>

          {/* Weights Tab */}
          <TabsContent value="weights" className="space-y-6">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-medium mb-2">Impact Score Formula:</p>
              <code className="text-xs">
                Score = (Distance × {(weights.distance_weight * 100).toFixed(0)}%) + 
                (Root × {(weights.root_damage_weight * 100).toFixed(0)}%) + 
                (Shadow × {(weights.shadow_loss_weight * 100).toFixed(0)}%) + 
                (Species × {(weights.species_sensitivity_weight * 100).toFixed(0)}%) + 
                (Health × {(weights.tree_health_weight * 100).toFixed(0)}%)
              </code>
            </div>

            {[
              { key: 'distance_weight', label: 'Distance Factor', icon: Ruler },
              { key: 'root_damage_weight', label: 'Root Damage', icon: Shovel },
              { key: 'shadow_loss_weight', label: 'Shadow Loss', icon: Sun },
              { key: 'species_sensitivity_weight', label: 'Species Sensitivity', icon: Leaf },
              { key: 'tree_health_weight', label: 'Tree Health', icon: Trees },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </Label>
                  <Badge variant="outline">
                    {(weights[key as keyof ImpactCriteria] * 100).toFixed(0)}%
                  </Badge>
                </div>
                <Slider
                  value={[weights[key as keyof ImpactCriteria] * 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([v]) => updateWeight(key as keyof ImpactCriteria, v / 100)}
                />
              </div>
            ))}

            <Button
              variant="outline"
              onClick={() => setWeights(DEFAULT_IMPACT_CRITERIA)}
              className="w-full"
            >
              Reset to Default Weights
            </Button>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {results && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <Trees className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{results.totalTrees}</p>
                    <p className="text-xs text-muted-foreground">Total Trees</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/10 text-center">
                    <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
                    <p className="text-2xl font-bold text-red-600">{results.affectedTrees}</p>
                    <p className="text-xs text-muted-foreground">Affected</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 text-center">
                    <Leaf className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold text-green-600">{results.safeTrees}</p>
                    <p className="text-xs text-muted-foreground">Safe</p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-500/10 text-center">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    <p className="text-2xl font-bold text-orange-600">{results.impactPercentage}%</p>
                    <p className="text-xs text-muted-foreground">Impact Rate</p>
                  </div>
                </div>

                {/* Impact Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium">Impact Distribution</h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Direct Removal', count: results.directRemoval, color: 'bg-red-500' },
                      { label: 'High Impact', count: results.highImpact, color: 'bg-orange-500' },
                      { label: 'Medium Impact', count: results.mediumImpact, color: 'bg-yellow-500' },
                      { label: 'Low Impact', count: results.lowImpact, color: 'bg-lime-500' },
                      { label: 'Safe', count: results.safeTrees, color: 'bg-green-500' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="flex-1 text-sm">{item.label}</span>
                        <span className="font-medium">{item.count}</span>
                        <Progress 
                          value={(item.count / results.totalTrees) * 100} 
                          className="w-24 h-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Species Breakdown */}
                {Object.keys(results.bySpecies).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">By Species</h4>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2 pr-4">
                        {Object.entries(results.bySpecies)
                          .sort((a, b) => b[1].affected - a[1].affected)
                          .map(([species, data]) => (
                            <div key={species} className="flex items-center justify-between p-2 rounded bg-muted/50">
                              <span className="text-sm">{species}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-red-500/10">
                                  {data.affected} affected
                                </Badge>
                                <Badge variant="outline" className="bg-green-500/10">
                                  {data.safe} safe
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Compensation Total */}
                <div className="p-4 rounded-lg bg-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">Total Compensation Value</p>
                      <p className="text-xs text-muted-foreground">
                        Based on carbon, oxygen, biodiversity, and aesthetic values
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">
                    ₹{results.totalCompensation.toLocaleString()}
                  </p>
                </div>
              </>
            )}
          </TabsContent>

          {/* Mitigation Tab */}
          <TabsContent value="mitigation" className="space-y-6">
            {mitigationPlan && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Total Implementation Cost</p>
                    <p className="text-2xl font-bold">₹{mitigationPlan.totalCost.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Timeline</p>
                    <p className="text-2xl font-bold">{mitigationPlan.timelineMonths} months</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Recommended Measures</h4>
                  <div className="space-y-3">
                    {mitigationPlan.measures.map((measure, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={
                                measure.priority === 'critical' ? 'bg-red-500' :
                                measure.priority === 'high' ? 'bg-orange-500' :
                                measure.priority === 'medium' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }
                            >
                              {measure.priority}
                            </Badge>
                            <span className="font-medium capitalize">{measure.type}</span>
                          </div>
                          <span className="font-bold">₹{measure.estimatedCost.toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{measure.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Trees: {measure.affectedTrees}</span>
                          <span>Timeline: {measure.timelineWeeks} weeks</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
