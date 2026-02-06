import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { TreeDataUploader } from '@/components/tree-impact/TreeDataUploader';
import { TreeImpactAnalysisPanel } from '@/components/tree-impact/TreeImpactAnalysisPanel';
import { TreeImpactResults } from '@/components/tree-impact/TreeImpactResults';
import { TreeImpactMap } from '@/components/tree-impact/TreeImpactMap';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { ProfessionalDashboard } from '@/components/analytics/ProfessionalDashboard';
import { ScientificImpactCalculator } from '@/components/tree-impact/ScientificImpactCalculator';
import { AITreeDetection } from '@/components/tree-impact/AITreeDetection';
import { useProject } from '@/hooks/useProjects';
import { useTreeDatasets, useTreeAnalysisResults } from '@/hooks/useTreeImpactAnalysis';
import { useTreeObservations } from '@/hooks/useTreeObservations';
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
  AlertTriangle,
  PieChart,
  Calculator,
  Satellite,
  FileDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { exportTreesAsGeoJSON, exportTreesAsCSV, exportImpactSummaryAsCSV } from '@/lib/exportUtils';

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
  
  const {
    trees: treeObservations,
    treesAsGeoJSON,
    stats: treeStats,
  } = useTreeObservations(projectId);
  
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
          <TabsList className="grid grid-cols-6 w-full max-w-2xl">
            <TabsTrigger value="upload" className="flex items-center gap-1.5">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1.5">
              <Satellite className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
            <TabsTrigger value="analyze" className="flex items-center gap-1.5">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Analyze</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-1.5">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Map</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Results</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-1.5">
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
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

          {/* AI Detection Tab */}
          <TabsContent value="ai">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AITreeDetection
                projectId={project.id}
                onDetectionComplete={(result) => {
                  console.log('AI Detection result:', result);
                }}
              />
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Satellite className="h-5 w-5 text-primary" />
                    How AI Detection Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">1</div>
                      <div>
                        <p className="text-sm font-medium">Upload Imagery</p>
                        <p className="text-xs text-muted-foreground">Satellite, drone, or aerial images</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/80 flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">2</div>
                      <div>
                        <p className="text-sm font-medium">AI Analysis</p>
                        <p className="text-xs text-muted-foreground">Gemini vision model detects trees and vegetation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">3</div>
                      <div>
                        <p className="text-sm font-medium">Get Results</p>
                        <p className="text-xs text-muted-foreground">Tree counts, species, health assessment</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analyze Tab */}
          <TabsContent value="analyze">
            <div className="space-y-6">
              <TreeImpactAnalysisPanel
                treeDatasets={treeDatasets}
                onRunAnalysis={handleRunAnalysis}
                onDeleteDataset={(id) => deleteTreeDataset.mutate(id)}
                isAnalyzing={runTreeImpactAnalysis.isPending}
              />
              
              {/* Scientific Calculator */}
              {treeObservations.length > 0 && devDataset?.geojson_data && (
                <ScientificImpactCalculator
                  treeData={treeObservations.map(t => ({
                    id: t.id,
                    species: t.species || 'Unknown',
                    height: t.height_meters || 10,
                    dbh: t.trunk_diameter_cm || 30,
                    canopyRadius: (t.canopy_diameter_meters || 5) / 2,
                    healthScore: t.health_status === 'excellent' ? 10 : 
                                 t.health_status === 'good' ? 8 :
                                 t.health_status === 'fair' ? 6 :
                                 t.health_status === 'poor' ? 4 : 2,
                    age: t.age_years || 20,
                    coordinates: [t.longitude, t.latitude],
                  }))}
                  developmentGeoJSON={devDataset.geojson_data as GeoJSON.FeatureCollection}
                  onAnalysisComplete={(results) => {
                    console.log('Scientific analysis:', results);
                  }}
                />
              )}
            </div>
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

                {/* Analytics Dashboard */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-primary" />
                      Impact Analytics
                    </CardTitle>
                    <CardDescription>
                      Visual breakdown of tree impact analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AnalyticsDashboard
                      treeData={{
                        total: latestResult.total_trees,
                        affected: latestResult.affected_trees,
                        safe: latestResult.safe_trees,
                        bySpecies: latestResult.summary?.speciesBreakdown 
                          ? Object.entries(latestResult.summary.speciesBreakdown as Record<string, number>)
                          : [],
                        byHealth: latestResult.summary?.healthBreakdown
                          ? Object.entries(latestResult.summary.healthBreakdown as Record<string, number>)
                          : [],
                        byImpact: [
                          ['safe', latestResult.safe_trees],
                          ['affected', latestResult.affected_trees],
                        ],
                      }}
                      type="tree"
                    />
                  </CardContent>
                </Card>
                
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

          {/* Export Tab */}
          <TabsContent value="export">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    Export Tree Data
                  </CardTitle>
                  <CardDescription>
                    Download tree observations in various formats
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => exportTreesAsGeoJSON(treeObservations, `${project.name}_trees.geojson`)}
                    disabled={treeObservations.length === 0}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export as GeoJSON
                    <Badge variant="secondary" className="ml-auto">{treeObservations.length} trees</Badge>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => exportTreesAsCSV(treeObservations, `${project.name}_trees.csv`)}
                    disabled={treeObservations.length === 0}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export as CSV
                    <Badge variant="secondary" className="ml-auto">Excel Compatible</Badge>
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Export Analysis Results
                  </CardTitle>
                  <CardDescription>
                    Download impact analysis summaries
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      if (latestResult) {
                        exportImpactSummaryAsCSV(
                          {
                            total_trees: latestResult.total_trees,
                            affected_trees: latestResult.affected_trees,
                            safe_trees: latestResult.safe_trees,
                            tree_loss_percentage: latestResult.tree_loss_percentage,
                            buffer_meters: latestResult.buffer_meters,
                          },
                          treeObservations,
                          `${project.name}_impact_analysis.csv`
                        );
                      }
                    }}
                    disabled={!latestResult}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export Impact Summary (CSV)
                  </Button>
                  <Button 
                    asChild
                    variant="default"
                    className="w-full"
                    disabled={!latestResult}
                  >
                    <Link to={`/project/${project.id}/tree-impact-report`}>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Full PDF Report
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
