import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Loader2, 
  TreeDeciduous, 
  AlertTriangle,
  Trash2,
  FileText
} from 'lucide-react';
import { TreeDataset } from '@/hooks/useTreeImpactAnalysis';
import { formatDistanceToNow } from 'date-fns';

interface TreeImpactAnalysisPanelProps {
  treeDatasets: TreeDataset[];
  onRunAnalysis: (params: {
    treesDatasetId: string;
    developmentDatasetId: string;
    treesData: any;
    developmentData: any;
    bufferMeters: number;
  }) => Promise<void>;
  onDeleteDataset: (id: string) => void;
  isAnalyzing: boolean;
}

export function TreeImpactAnalysisPanel({
  treeDatasets,
  onRunAnalysis,
  onDeleteDataset,
  isAnalyzing,
}: TreeImpactAnalysisPanelProps) {
  const [selectedTreesDataset, setSelectedTreesDataset] = useState<string | null>(null);
  const [selectedDevDataset, setSelectedDevDataset] = useState<string | null>(null);
  const [bufferMeters, setBufferMeters] = useState(50);

  const treesDatasets = treeDatasets.filter(d => d.dataset_type === 'trees_before');
  const devDatasets = treeDatasets.filter(d => d.dataset_type === 'development_layer');

  const selectedTrees = treeDatasets.find(d => d.id === selectedTreesDataset);
  const selectedDev = treeDatasets.find(d => d.id === selectedDevDataset);

  const canRunAnalysis = selectedTrees && selectedDev && !isAnalyzing;

  const handleRunAnalysis = async () => {
    if (!selectedTrees || !selectedDev) return;
    
    await onRunAnalysis({
      treesDatasetId: selectedTrees.id,
      developmentDatasetId: selectedDev.id,
      treesData: selectedTrees.geojson_data,
      developmentData: selectedDev.geojson_data,
      bufferMeters,
    });
  };

  return (
    <div className="space-y-6">
      {/* Uploaded Datasets */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Uploaded Datasets
          </CardTitle>
          <CardDescription>
            Select tree data and development layer to run impact analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tree Datasets */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Tree Data (Before State)</Label>
            {treesDatasets.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                No tree datasets uploaded yet. Upload a GeoJSON or CSV file with tree locations.
              </p>
            ) : (
              <div className="space-y-2">
                {treesDatasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    onClick={() => setSelectedTreesDataset(dataset.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedTreesDataset === dataset.id
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-muted hover:border-green-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <TreeDeciduous className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">{dataset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(dataset.metadata as any)?.feature_count || '?'} trees •{' '}
                          {formatDistanceToNow(new Date(dataset.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedTreesDataset === dataset.id && (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                          Selected
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDataset(dataset.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Development Datasets */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Development Layer (After State)</Label>
            {devDatasets.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                No development layers uploaded yet. Upload roads, corridors, or construction zones.
              </p>
            ) : (
              <div className="space-y-2">
                {devDatasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    onClick={() => setSelectedDevDataset(dataset.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedDevDataset === dataset.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-muted hover:border-orange-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium text-sm">{dataset.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(dataset.metadata as any)?.feature_count || '?'} features •{' '}
                          {formatDistanceToNow(new Date(dataset.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedDevDataset === dataset.id && (
                        <Badge variant="secondary" className="bg-orange-500/20 text-orange-600">
                          Selected
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDataset(dataset.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Configuration */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading">Analysis Configuration</CardTitle>
          <CardDescription>
            Configure buffer zone and run the tree impact analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Buffer Zone Distance</Label>
              <span className="text-sm font-medium">{bufferMeters} meters</span>
            </div>
            <Slider
              value={[bufferMeters]}
              onValueChange={(v) => setBufferMeters(v[0])}
              min={10}
              max={200}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Trees within this distance from development features will be marked as affected.
            </p>
          </div>

          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium">Ready to Analyze</p>
              <p className="text-xs text-muted-foreground">
                {selectedTrees ? `Trees: ${selectedTrees.name}` : 'No tree dataset selected'}
                {' • '}
                {selectedDev ? `Development: ${selectedDev.name}` : 'No development layer selected'}
              </p>
            </div>
            <Button
              onClick={handleRunAnalysis}
              disabled={!canRunAnalysis}
              className="gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
