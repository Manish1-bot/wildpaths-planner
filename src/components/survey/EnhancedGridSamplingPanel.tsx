import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Grid3x3, 
  Trees, 
  Plus, 
  Minus, 
  ChevronRight, 
  ChevronLeft,
  Check,
  RotateCcw,
  BarChart3,
  Info
} from 'lucide-react';
import { generateGridCells, GridCell } from '@/lib/areaCalculations';

// Common species for quick add
const QUICK_SPECIES = [
  { name: 'Mango', emoji: '🥭' },
  { name: 'Neem', emoji: '🌿' },
  { name: 'Banyan', emoji: '🌳' },
  { name: 'Peepal', emoji: '🍃' },
  { name: 'Teak', emoji: '🌲' },
  { name: 'Coconut', emoji: '🥥' },
  { name: 'Jamun', emoji: '🫐' },
  { name: 'Unknown', emoji: '❓' },
];

interface CellTreeCount {
  species: string;
  count: number;
}

interface CellData {
  cellId: string;
  treeCounts: CellTreeCount[];
  marked: boolean;
  noTrees: boolean;
}

interface EnhancedGridSamplingPanelProps {
  projectArea: GeoJSON.Feature<GeoJSON.Polygon>;
  areaHectares: number;
  onSurveyComplete: (results: SurveyResults) => void;
  projectId: string;
}

interface SurveyResults {
  totalCells: number;
  sampledCells: number;
  treesInSample: number;
  estimatedTotal: number;
  confidenceInterval: { low: number; high: number };
  bySpecies: Record<string, number>;
}

export function EnhancedGridSamplingPanel({
  projectArea,
  areaHectares,
  onSurveyComplete,
  projectId,
}: EnhancedGridSamplingPanelProps) {
  // Generate grid cells
  const gridCells = useMemo(() => 
    generateGridCells(projectArea, 50), // 50m x 50m cells
    [projectArea]
  );
  
  // Get sample cells (every 5th = 20%)
  const sampleCells = useMemo(() => 
    gridCells.filter((_, idx) => idx % 5 === 0),
    [gridCells]
  );
  
  const [currentCellIndex, setCurrentCellIndex] = useState(0);
  const [cellData, setCellData] = useState<Map<string, CellData>>(new Map());
  const [surveyComplete, setSurveyComplete] = useState(false);

  const currentCell = sampleCells[currentCellIndex];
  const currentCellData = currentCell ? cellData.get(currentCell.id) : null;
  const progress = (currentCellIndex / sampleCells.length) * 100;

  const updateCellTreeCount = (species: string, delta: number) => {
    if (!currentCell) return;
    
    setCellData(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(currentCell.id) || {
        cellId: currentCell.id,
        treeCounts: [],
        marked: false,
        noTrees: false,
      };
      
      const speciesIndex = existing.treeCounts.findIndex(t => t.species === species);
      if (speciesIndex >= 0) {
        const newCount = Math.max(0, existing.treeCounts[speciesIndex].count + delta);
        if (newCount === 0) {
          existing.treeCounts.splice(speciesIndex, 1);
        } else {
          existing.treeCounts[speciesIndex].count = newCount;
        }
      } else if (delta > 0) {
        existing.treeCounts.push({ species, count: delta });
      }
      
      existing.marked = true;
      existing.noTrees = existing.treeCounts.length === 0;
      newMap.set(currentCell.id, existing);
      return newMap;
    });
  };

  const markAsNoTrees = () => {
    if (!currentCell) return;
    
    setCellData(prev => {
      const newMap = new Map(prev);
      newMap.set(currentCell.id, {
        cellId: currentCell.id,
        treeCounts: [],
        marked: true,
        noTrees: true,
      });
      return newMap;
    });
  };

  const addRandomTrees = (count: number) => {
    if (!currentCell) return;
    
    // Distribute randomly among species
    const speciesDistribution = QUICK_SPECIES.slice(0, -1); // Exclude Unknown
    const perSpecies = Math.floor(count / speciesDistribution.length);
    const remainder = count % speciesDistribution.length;
    
    setCellData(prev => {
      const newMap = new Map(prev);
      const treeCounts: CellTreeCount[] = speciesDistribution.map((s, idx) => ({
        species: s.name,
        count: perSpecies + (idx < remainder ? 1 : 0),
      })).filter(t => t.count > 0);
      
      newMap.set(currentCell.id, {
        cellId: currentCell.id,
        treeCounts,
        marked: true,
        noTrees: false,
      });
      return newMap;
    });
  };

  const goToNextCell = () => {
    if (currentCellIndex < sampleCells.length - 1) {
      setCurrentCellIndex(prev => prev + 1);
    }
  };

  const goToPrevCell = () => {
    if (currentCellIndex > 0) {
      setCurrentCellIndex(prev => prev - 1);
    }
  };

  const getTotalTreesInCell = (cell: CellData | null | undefined): number => {
    if (!cell) return 0;
    return cell.treeCounts.reduce((sum, t) => sum + t.count, 0);
  };

  const calculateResults = (): SurveyResults => {
    const sampledCells = Array.from(cellData.values()).filter(c => c.marked);
    const treesInSample = sampledCells.reduce((sum, c) => sum + getTotalTreesInCell(c), 0);
    
    // Statistical extrapolation
    const samplingRatio = sampleCells.length / gridCells.length;
    const estimatedTotal = Math.round(treesInSample / samplingRatio);
    
    // 95% confidence interval (assuming Poisson distribution)
    const standardError = Math.sqrt(treesInSample) / samplingRatio;
    const marginOfError = 1.96 * standardError;
    
    // Aggregate by species
    const bySpecies: Record<string, number> = {};
    sampledCells.forEach(cell => {
      cell.treeCounts.forEach(t => {
        bySpecies[t.species] = (bySpecies[t.species] || 0) + Math.round(t.count / samplingRatio);
      });
    });
    
    return {
      totalCells: gridCells.length,
      sampledCells: sampledCells.length,
      treesInSample,
      estimatedTotal,
      confidenceInterval: {
        low: Math.max(0, Math.round(estimatedTotal - marginOfError)),
        high: Math.round(estimatedTotal + marginOfError),
      },
      bySpecies,
    };
  };

  const handleComplete = () => {
    const results = calculateResults();
    setSurveyComplete(true);
    onSurveyComplete(results);
  };

  const markedCellsCount = Array.from(cellData.values()).filter(c => c.marked).length;
  const totalTreesRecorded = Array.from(cellData.values())
    .reduce((sum, c) => sum + getTotalTreesInCell(c), 0);

  if (surveyComplete) {
    const results = calculateResults();
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Survey Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-primary/10 text-center">
              <p className="text-3xl font-bold text-primary">{results.estimatedTotal}</p>
              <p className="text-sm text-muted-foreground">Estimated Total Trees</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-lg font-medium">
                ± {Math.round((results.confidenceInterval.high - results.confidenceInterval.low) / 2)}
              </p>
              <p className="text-xs text-muted-foreground">95% Confidence</p>
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/30 text-sm">
            <p className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Range: {results.confidenceInterval.low} - {results.confidenceInterval.high} trees
            </p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Species Distribution (Estimated)</Label>
            {Object.entries(results.bySpecies)
              .sort((a, b) => b[1] - a[1])
              .map(([species, count]) => (
                <div key={species} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <span className="text-sm">{species}</span>
                  <Badge variant="outline">{count} trees</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-lg flex items-center gap-2">
          <Grid3x3 className="h-5 w-5 text-primary" />
          Grid Sampling Survey
        </CardTitle>
        <CardDescription>
          Survey {sampleCells.length} sample cells (20% of {gridCells.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{markedCellsCount}/{sampleCells.length} cells</span>
          </div>
          <Progress value={(markedCellsCount / sampleCells.length) * 100} className="h-2" />
        </div>

        {/* Current Cell Info */}
        <div className="p-4 rounded-lg bg-primary/10">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">Cell {currentCellIndex + 1} of {sampleCells.length}</Badge>
            <Badge className={currentCellData?.marked ? 'bg-green-500' : 'bg-muted'}>
              {currentCellData?.marked ? 'Surveyed' : 'Not surveyed'}
            </Badge>
          </div>
          <p className="text-2xl font-bold text-center text-primary">
            {getTotalTreesInCell(currentCellData)} trees
          </p>
        </div>

        {/* Quick Add Species */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Add Trees by Species</Label>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_SPECIES.map((s) => {
              const count = currentCellData?.treeCounts.find(t => t.species === s.name)?.count || 0;
              return (
                <div key={s.name} className="flex flex-col items-center gap-1">
                  <span className="text-xl">{s.emoji}</span>
                  <span className="text-[10px] truncate w-full text-center">{s.name}</span>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => updateCellTreeCount(s.name, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">{count}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => updateCellTreeCount(s.name, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => addRandomTrees(10)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add 10 Random
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={markAsNoTrees}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            No Trees Here
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={goToPrevCell}
            disabled={currentCellIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          {currentCellIndex === sampleCells.length - 1 ? (
            <Button 
              size="sm"
              onClick={handleComplete}
              disabled={markedCellsCount < sampleCells.length * 0.5} // Require at least 50%
            >
              <Check className="h-4 w-4 mr-1" />
              Complete Survey
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={goToNextCell}
            >
              Next Cell
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Summary */}
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            <Trees className="h-4 w-4 inline mr-1" />
            Total recorded: <span className="font-medium text-foreground">{totalTreesRecorded} trees</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
