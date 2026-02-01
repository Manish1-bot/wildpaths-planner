import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { TreeDataUploader } from '@/components/tree-impact/TreeDataUploader';
import { TreeImpactAnalysisPanel } from '@/components/tree-impact/TreeImpactAnalysisPanel';
import { TreeImpactResults } from '@/components/tree-impact/TreeImpactResults';
import { TreeImpactMap } from '@/components/tree-impact/TreeImpactMap';
import { useProject } from '@/hooks/useProjects';
import { useTreeDatasets, useTreeAnalysisResults } from '@/hooks/useTreeImpactAnalysis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Upload,
  Map,
  BarChart3,
  FileText,
  Loader2,
  Download,
  Trees,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function TreeImpactPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { 
    treeDatasets, 
    isLoading: datasetsLoading, 
    uploadTreeDataset,
    deleteTreeDataset 
  } = useTreeDatasets(projectId);
  const { 
    analysisResults, 
    isLoading: resultsLoading,
    runTreeImpactAnalysis,
    deleteTreeAnalysisResult
  } = useTreeAnalysisResults(projectId);
  
  const [activeTab, setActiveTab] = useState('upload');

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <Card className="glass-card">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Project not found</p>
              <Button asChild className="mt-4">
                <Link to="/projects">Back to Projects</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const handleUploadTrees = async (file: File) => {
    await uploadTreeDataset.mutateAsync({ 
      file, 
      projectId: project.id, 
      datasetType: 'trees_before' 
    });
  };

  const handleUploadDevelopment = async (file: File) => {
    await uploadTreeDataset.mutateAsync({ 
      file, 
      projectId: project.id, 
      datasetType: 'development_layer' 
    });
  };

  const handleRunAnalysis = async (params: {
    treesDatasetId: string;
    developmentDatasetId: string;
    treesData: any;
    developmentData: any;
    bufferMeters: number;
  }) => {
    await runTreeImpactAnalysis.mutateAsync({
      projectId: project.id,
      ...params,
    });
    setActiveTab('results');
  };

  const latestResult = analysisResults[0];

  // Get development data for map
  const devDataset = treeDatasets.find(d => d.dataset_type === 'development_layer');

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/project/${project.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-heading font-bold">Tree Impact Analysis</h1>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                <Trees className="h-3 w-3 mr-1" />
                Environmental Module
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Analyze environmental impact by comparing tree distribution with planned development
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Project: {project.name}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="analyze" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analyze</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Map</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Results</span>
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <TreeDataUploader
              onUploadTrees={handleUploadTrees}
              onUploadDevelopment={handleUploadDevelopment}
              isUploadingTrees={uploadTreeDataset.isPending && treeDatasets.some(d => d.dataset_type === 'trees_before')}
              isUploadingDevelopment={uploadTreeDataset.isPending}
            />
          </TabsContent>

          {/* Analyze Tab */}
          <TabsContent value="analyze">
            <TreeImpactAnalysisPanel
              treeDatasets={treeDatasets}
              onRunAnalysis={handleRunAnalysis}
              onDeleteDataset={(id) => deleteTreeDataset.mutate(id)}
              isAnalyzing={runTreeImpactAnalysis.isPending}
            />
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Map className="h-5 w-5 text-primary" />
                  Tree Impact Visualization
                </CardTitle>
                <CardDescription>
                  View affected (red) and safe (green) trees on the interactive map
                </CardDescription>
              </CardHeader>
              <CardContent>
                {latestResult ? (
                  <div className="h-[600px] rounded-lg overflow-hidden">
                    <TreeImpactMap
                      affectedGeoJSON={latestResult.affected_geojson}
                      safeGeoJSON={latestResult.safe_geojson}
                      developmentGeoJSON={devDataset?.geojson_data}
                    />
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-heading font-semibold mb-2">No Analysis Results</h3>
                      <p className="text-muted-foreground mb-4">
                        Run a tree impact analysis first to see results on the map
                      </p>
                      <Button onClick={() => setActiveTab('analyze')}>
                        Go to Analysis
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            {resultsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : latestResult ? (
              <div className="space-y-6">
                <TreeImpactResults result={latestResult} />
                
                {/* Generate Report Button */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="font-heading">Generate Report</CardTitle>
                    <CardDescription>
                      Create a PDF report of the tree impact analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild>
                      <Link to={`/project/${project.id}/tree-impact-report`}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Tree Impact Report
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                {/* Previous Results */}
                {analysisResults.length > 1 && (
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="font-heading">Previous Analyses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysisResults.slice(1).map((result) => (
                          <div
                            key={result.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div>
                              <p className="font-medium">
                                {result.affected_trees} / {result.total_trees} trees affected
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })} •
                                {result.buffer_meters}m buffer
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTreeAnalysisResult.mutate(result.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="pt-6 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-heading font-semibold mb-2">No Analysis Results</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload tree and development data, then run the analysis to see results
                  </p>
                  <Button onClick={() => setActiveTab('upload')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Data
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
