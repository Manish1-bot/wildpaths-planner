import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { DataUploader } from '@/components/upload/DataUploader';
import { AnalysisResults } from '@/components/analysis/AnalysisResults';
import { MapViewer } from '@/components/map/MapViewer';
import { useProject } from '@/hooks/useProjects';
import { useDatasets } from '@/hooks/useDatasets';
import { useAnalysis } from '@/hooks/useAnalysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Play,
  Trash2,
  Download
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { datasets, isLoading: datasetsLoading, uploadDataset, deleteDataset } = useDatasets(projectId);
  const { analyses, isLoading: analysisLoading, runAnalysis } = useAnalysis(projectId);
  const [activeTab, setActiveTab] = useState('data');

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

  const handleUpload = async (file: File) => {
    await uploadDataset.mutateAsync({ file, projectId: project.id });
  };

  const handleRunAnalysis = async (datasetId: string, geojsonData: any) => {
    await runAnalysis.mutateAsync({
      projectId: project.id,
      datasetId,
      geojsonData,
    });
  };

  // Prepare map layers from datasets
  const mapLayers = datasets
    .filter((d) => d.geojson_data)
    .map((d, idx) => ({
      id: d.id,
      name: d.name,
      data: d.geojson_data,
      color: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5],
    }));

  const latestAnalysis = analyses[0];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/projects">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-heading font-bold">{project.name}</h1>
              <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
            </div>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
            {project.region && (
              <p className="text-sm text-muted-foreground mt-1">📍 {project.region}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Map</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Report</span>
            </TabsTrigger>
          </TabsList>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading">Upload Data</CardTitle>
                <CardDescription>
                  Upload GeoJSON or CSV files containing wildlife sightings, habitat boundaries, or other spatial data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataUploader
                  projectId={project.id}
                  onUpload={handleUpload}
                  isUploading={uploadDataset.isPending}
                />
              </CardContent>
            </Card>

            {/* Datasets List */}
            {datasets.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="font-heading">Uploaded Datasets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {datasets.map((dataset) => (
                      <div
                        key={dataset.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{dataset.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {dataset.file_type.toUpperCase()} •{' '}
                              {formatDistanceToNow(new Date(dataset.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRunAnalysis(dataset.id, dataset.geojson_data)}
                            disabled={runAnalysis.isPending}
                          >
                            {runAnalysis.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            <span className="ml-2">Analyze</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteDataset.mutate(dataset.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading">Interactive Map</CardTitle>
                <CardDescription>
                  Visualize your data and design wildlife corridors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] rounded-lg overflow-hidden">
                  <MapViewer
                    geojsonLayers={mapLayers}
                    onDrawComplete={(geojson) => {
                      console.log('Drawn feature:', geojson);
                      // TODO: Save corridor design
                    }}
                    interactive
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis">
            {analysisLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : latestAnalysis ? (
              <AnalysisResults
                results={latestAnalysis.results}
                explanations={latestAnalysis.explanations}
              />
            ) : (
              <Card className="glass-card">
                <CardContent className="pt-6 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-heading font-semibold mb-2">No analysis yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload data and click "Analyze" to see results
                  </p>
                  <Button onClick={() => setActiveTab('data')}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Data
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading">Generate Report</CardTitle>
                <CardDescription>
                  Create a comprehensive PDF report of your analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                {latestAnalysis ? (
                  <>
                    <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground mb-6">
                      Generate a PDF report including all analysis results, maps, and recommendations.
                    </p>
                    <Button asChild>
                      <Link to={`/project/${project.id}/report`}>
                        <Download className="h-4 w-4 mr-2" />
                        Generate PDF Report
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">
                      Run an analysis first to generate a report
                    </p>
                    <Button variant="outline" onClick={() => setActiveTab('data')}>
                      Go to Data
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
