import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Grid3x3, 
  Trees, 
  Plus, 
  Check, 
  ChevronRight, 
  BarChart3,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { createSamplingGrid } from '@/lib/areaCalculations';

interface GridCell {
  id: number;
  isSampleCell: boolean;
  surveyed: boolean;
  treeCount: number;
}

interface GridSamplingPanelProps {
  projectArea: GeoJSON.Feature<GeoJSON.Polygon>;
  areaHectares: number;
  onSurveyComplete: (results: { estimatedTotal: number; confidence: number; sampledCells: number[] }) => void;
}

export function GridSamplingPanel({
  projectArea,
  areaHectares,
  onSurveyComplete,
}: GridSamplingPanelProps) {
  const [cells, setCells] = useState<GridCell[]>([]);
  const [activeCellIndex, setActiveCellIndex] = useState(0);
  const [currentCellTrees, setCurrentCellTrees] = useState(0);
  const [sampledCells, setSampledCells] = useState<{ id: number; count: number }[]>([]);

  // Generate grid on mount
  useMemo(() => {
    const cellSizeM = areaHectares > 5 ? 100 : 50;
    const grid = createSamplingGrid(projectArea, cellSizeM);
    
    const generatedCells: GridCell[] = grid.features.map((f, idx) => ({
      id: idx + 1,
      isSampleCell: f.properties?.isSampleCell || false,
      surveyed: false,
      treeCount: 0,
    }));
    
    setCells(generatedCells);
  }, [projectArea, areaHectares]);

  const sampleCells = cells.filter(c => c.isSampleCell);
  const surveyedCount = sampledCells.length;
  const totalSampleCells = sampleCells.length;
  const progress = totalSampleCells > 0 ? (surveyedCount / totalSampleCells) * 100 : 0;

  const currentCell = sampleCells[activeCellIndex];

  const handleAddTrees = (count: number) => {
    setCurrentCellTrees(prev => prev + count);
  };

  const handleConfirmCell = () => {
    if (!currentCell) return;

    setSampledCells(prev => [...prev, { id: currentCell.id, count: currentCellTrees }]);
    setCurrentCellTrees(0);
    
    if (activeCellIndex < sampleCells.length - 1) {
      setActiveCellIndex(prev => prev + 1);
    }
  };

  const handleComplete = () => {
    const totalInSamples = sampledCells.reduce((sum, c) => sum + c.count, 0);
    const avgPerCell = sampledCells.length > 0 ? totalInSamples / sampledCells.length : 0;
    const estimatedTotal = Math.round(avgPerCell * cells.length);
    
    // Calculate confidence based on sample size
    const sampleRatio = sampledCells.length / cells.length;
    const confidence = Math.min(95, 50 + sampleRatio * 200);
    
    onSurveyComplete({
      estimatedTotal,
      confidence: Math.round(confidence),
      sampledCells: sampledCells.map(c => c.id),
    });
  };

  const statistics = useMemo(() => {
    if (sampledCells.length === 0) return null;
    
    const counts = sampledCells.map(c => c.count);
    const totalInSamples = counts.reduce((a, b) => a + b, 0);
    const avg = totalInSamples / sampledCells.length;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / sampledCells.length;
    const stdDev = Math.sqrt(variance);
    const estimatedTotal = Math.round(avg * cells.length);
    const marginOfError = Math.round(1.96 * stdDev * Math.sqrt(cells.length));
    
    return {
      average: avg.toFixed(1),
      estimatedTotal,
      marginOfError,
      minEstimate: Math.max(0, estimatedTotal - marginOfError),
      maxEstimate: estimatedTotal + marginOfError,
    };
  }, [sampledCells, cells.length]);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-lg flex items-center gap-2">
          <Grid3x3 className="h-5 w-5 text-primary" />
          Grid Sampling Survey
        </CardTitle>
        <CardDescription>
          Survey sample plots for statistical estimation of tree count
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Survey Progress</span>
            <span className="font-medium">{surveyedCount} / {totalSampleCells} cells</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Sampling {totalSampleCells} cells (~20% of {cells.length} total cells)
          </p>
        </div>

        {/* Current Cell */}
        {currentCell && surveyedCount < totalSampleCells && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge variant="default" className="mb-2">Cell #{currentCell.id}</Badge>
                <p className="text-sm font-medium">Count all trees in highlighted area</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{currentCellTrees}</p>
                <p className="text-xs text-muted-foreground">trees</p>
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {[1, 5, 10, 25].map((n) => (
                <Button
                  key={n}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTrees(n)}
                  className="h-12"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {n}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentCellTrees(0)}
                className="h-12 text-destructive"
              >
                Reset
              </Button>
            </div>

            {/* Species Quick Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['🥭 Mango', '🌿 Neem', '🌳 Banyan', '🍃 Peepal', '❓ Other'].map((label) => (
                <Button
                  key={label}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddTrees(1)}
                  className="text-xs"
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Confirm Cell */}
            <Button onClick={handleConfirmCell} className="w-full">
              <Check className="h-4 w-4 mr-2" />
              Confirm Cell ({currentCellTrees} trees) & Next
            </Button>
          </div>
        )}

        {/* No Trees Option */}
        {currentCell && surveyedCount < totalSampleCells && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => {
              setCurrentCellTrees(0);
              handleConfirmCell();
            }}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Mark as "No trees in this cell"
          </Button>
        )}

        {/* Statistics */}
        {statistics && (
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">Statistical Estimation</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Avg trees/cell</p>
                <p className="text-lg font-bold">{statistics.average}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimated Total</p>
                <p className="text-lg font-bold text-primary">{statistics.estimatedTotal}</p>
              </div>
            </div>

            <div className="p-2 rounded bg-background/50 text-center">
              <p className="text-sm">
                <span className="font-medium">{statistics.estimatedTotal}</span>
                <span className="text-muted-foreground"> trees ± {statistics.marginOfError}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                95% confidence interval: {statistics.minEstimate} - {statistics.maxEstimate}
              </p>
            </div>
          </div>
        )}

        {/* Complete Button */}
        {surveyedCount >= totalSampleCells && totalSampleCells > 0 && (
          <Button onClick={handleComplete} className="w-full" size="lg">
            <BarChart3 className="h-4 w-4 mr-2" />
            Complete Survey & Generate Report
          </Button>
        )}

        {/* Surveyed Cells List */}
        {sampledCells.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Surveyed Cells</p>
            <div className="flex flex-wrap gap-2">
              {sampledCells.map((cell) => (
                <Badge key={cell.id} variant="secondary">
                  Cell #{cell.id}: {cell.count} trees
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
