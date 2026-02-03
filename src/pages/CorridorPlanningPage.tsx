import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { MapViewer } from '@/components/map/MapViewer';
import { FieldObservationForm } from '@/components/corridor/FieldObservationForm';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { useProject } from '@/hooks/useProjects';
import { useFieldObservations } from '@/hooks/useFieldObservations';
import { useCorridorObservations } from '@/hooks/useCorridorObservations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  MapPin,
  Route,
  BarChart3,
  FileText,
  Loader2,
  Plus,
  Eye,
  Trash2,
  Brain,
  AlertTriangle,
  Trees,
  Building,
  Map
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function CorridorPlanningPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { toast } = useToast();
  
  const { 
    observations, 
    observationsAsGeoJSON,
    isLoading: observationsLoading, 
    createObservation,
    deleteObservation
  } = useFieldObservations(projectId);
  
  const { 
    corridors, 
    corridorsAsGeoJSON,
    isLoading: corridorsLoading,
    createCorridor,
    deleteCorridor
  } = useCorridorObservations(projectId);

  const [activeTab, setActiveTab] = useState('map');
  const [showForm, setShowForm] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | undefined>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

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

  // Prepare map layers
  const mapLayers = [
    ...(observationsAsGeoJSON.features.length > 0 ? [{
      id: 'observations',
      name: 'Field Observations',
      data: observationsAsGeoJSON,
      color: '#3b82f6',
    }] : []),
    ...(corridorsAsGeoJSON.features.length > 0 ? [{
      id: 'corridors',
      name: 'Corridor Designs',
      data: corridorsAsGeoJSON,
      color: '#22c55e',
    }] : []),
  ];

  // Handle drawn corridor from map
  const handleDrawComplete = async (geojson: any) => {
    if (!projectId) return;
    
    await createCorridor.mutateAsync({
      project_id: projectId,
      name: `Corridor ${corridors.length + 1}`,
      geojson_data: geojson,
      corridor_type: 'proposed',
      priority: 'medium',
    });
  };

  // Run AI corridor analysis
  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-corridor', {
        body: {
          corridorData: corridorsAsGeoJSON,
          observationsData: observationsAsGeoJSON,
          analysisType: 'corridor_optimization',
        },
      });

      if (error) throw error;

      setAiAnalysis(data.analysis);
      toast({
        title: 'AI Analysis Complete',
        description: 'Corridor optimization recommendations are ready.',
      });
      setActiveTab('analysis');
    } catch (err) {
      toast({
        title: 'Analysis Failed',
        description: err instanceof Error ? err.message : 'Failed to analyze corridors',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Prepare analytics data
  const observationStats = {
    total: observations.length,
    byType: Object.entries(
      observations.reduce((acc, obs) => {
        acc[obs.observation_type] = (acc[obs.observation_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ) as [string, number][],
    byRisk: Object.entries(
      observations.filter(o => o.risk_level).reduce((acc, obs) => {
        acc[obs.risk_level!] = (acc[obs.risk_level!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ) as [string, number][],
    recentTrend: [],
  };

  const getObservationIcon = (type: string) => {
    switch (type) {
      case 'wildlife_sighting': return <Eye className="h-4 w-4" />;
      case 'habitat_area': return <Trees className="h-4 w-4" />;
      case 'risk_zone': return <AlertTriangle className="h-4 w-4" />;
      case 'infrastructure': return <Building className="h-4 w-4" />;
      case 'corridor_suggestion': return <Route className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

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
              <h1 className="text-3xl font-heading font-bold">Corridor Planning</h1>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                <Route className="h-3 w-3 mr-1" />
                Wildlife Module
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Design wildlife corridors using field observations and AI-powered analysis
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Project: {project.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Observation
            </Button>
            <Button 
              onClick={runAIAnalysis}
              disabled={isAnalyzing || (corridors.length === 0 && observations.length === 0)}
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              AI Analysis
            </Button>
          </div>
        </div>

        {/* Observation Form */}
        {showForm && (
          <div className="mb-6">
            <FieldObservationForm
              projectId={project.id}
              onSubmit={async (data) => {
                await createObservation.mutateAsync(data);
                setShowForm(false);
              }}
              isSubmitting={createObservation.isPending}
              defaultCoordinates={selectedCoords}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Map</span>
            </TabsTrigger>
            <TabsTrigger value="observations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Charts</span>
            </TabsTrigger>
          </TabsList>

          {/* Map Tab */}
          <TabsContent value="map">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Map className="h-5 w-5 text-primary" />
                  Interactive Corridor Map
                </CardTitle>
                <CardDescription>
                  View observations, draw corridors, and mark zones. Click to add points, double-click to finish.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px]">
                  <MapViewer
                    geojsonLayers={mapLayers}
                    onDrawComplete={handleDrawComplete}
                    className="h-full rounded-b-lg"
                    interactive
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Observations Tab */}
          <TabsContent value="observations">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Observations List */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Field Observations
                    <Badge variant="outline">{observations.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {observationsLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : observations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No observations yet</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setShowForm(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Observation
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3 pr-4">
                        {observations.map((obs) => (
                          <div
                            key={obs.id}
                            className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-md bg-primary/10">
                                  {getObservationIcon(obs.observation_type)}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{obs.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {obs.observation_type.split('_').map(w => 
                                      w.charAt(0).toUpperCase() + w.slice(1)
                                    ).join(' ')}
                                  </p>
                                  {obs.risk_level && (
                                    <Badge 
                                      variant="outline" 
                                      className={`mt-1 ${
                                        obs.risk_level === 'critical' ? 'bg-red-500/10 text-red-600' :
                                        obs.risk_level === 'high' ? 'bg-orange-500/10 text-orange-600' :
                                        obs.risk_level === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                                        'bg-green-500/10 text-green-600'
                                      }`}
                                    >
                                      {obs.risk_level}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => deleteObservation.mutate(obs.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(obs.created_at), { addSuffix: true })} •
                              {obs.latitude.toFixed(4)}, {obs.longitude.toFixed(4)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Corridors List */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Route className="h-5 w-5 text-green-600" />
                    Corridor Designs
                    <Badge variant="outline">{corridors.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {corridorsLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : corridors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Route className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No corridors designed yet</p>
                      <p className="text-sm mt-2">Use the map to draw corridor paths</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3 pr-4">
                        {corridors.map((corridor) => (
                          <div
                            key={corridor.id}
                            className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm">{corridor.name}</p>
                                <div className="flex gap-2 mt-1">
                                  {corridor.corridor_type && (
                                    <Badge variant="outline">{corridor.corridor_type}</Badge>
                                  )}
                                  {corridor.priority && (
                                    <Badge 
                                      variant="outline"
                                      className={
                                        corridor.priority === 'critical' ? 'bg-red-500/10 text-red-600' :
                                        corridor.priority === 'high' ? 'bg-orange-500/10 text-orange-600' :
                                        corridor.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                                        'bg-green-500/10 text-green-600'
                                      }
                                    >
                                      {corridor.priority}
                                    </Badge>
                                  )}
                                  <Badge variant="secondary">{corridor.status}</Badge>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => deleteCorridor.mutate(corridor.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(corridor.created_at), { addSuffix: true })} •
                              {corridor.width_meters}m width
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Analysis Tab */}
          <TabsContent value="analysis">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Corridor Analysis
                </CardTitle>
                <CardDescription>
                  AI-powered optimization and recommendations for corridor planning
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!aiAnalysis ? (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="text-lg font-heading font-semibold mb-2">No Analysis Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add observations and corridors, then run AI analysis for optimization recommendations.
                    </p>
                    <Button 
                      onClick={runAIAnalysis}
                      disabled={isAnalyzing || (corridors.length === 0 && observations.length === 0)}
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Brain className="h-4 w-4 mr-2" />
                      )}
                      Run AI Analysis
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Connectivity Score */}
                    {aiAnalysis.connectivityScore !== undefined && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-primary/10 text-center">
                          <p className="text-3xl font-bold text-primary">
                            {aiAnalysis.connectivityScore}
                          </p>
                          <p className="text-sm text-muted-foreground">Connectivity Score</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted text-center">
                          <p className="text-3xl font-bold capitalize">
                            {aiAnalysis.overallRisk || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">Overall Risk</p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted text-center">
                          <p className="text-3xl font-bold">
                            {aiAnalysis.optimizations?.length || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Recommendations</p>
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {aiAnalysis.summary && (
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-medium mb-2">Executive Summary</h4>
                        <p className="text-sm text-muted-foreground">{aiAnalysis.summary}</p>
                      </div>
                    )}

                    {/* Recommendations */}
                    {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Recommendations</h4>
                        <div className="space-y-2">
                          {aiAnalysis.recommendations.map((rec: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                {idx + 1}
                              </span>
                              <p className="text-sm">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Risk Zones */}
                    {aiAnalysis.riskZones && aiAnalysis.riskZones.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          Risk Zones Identified
                        </h4>
                        <div className="space-y-2">
                          {aiAnalysis.riskZones.map((zone: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-lg border border-orange-500/20 bg-orange-500/5">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{zone.location}</span>
                                <Badge variant="outline" className="bg-orange-500/10 text-orange-600">
                                  {zone.risk}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{zone.mitigation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Species Suitability */}
                    {aiAnalysis.speciesSuitability && aiAnalysis.speciesSuitability.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Species Suitability</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {aiAnalysis.speciesSuitability.map((sp: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-lg bg-muted/50 text-center">
                              <p className="font-medium text-sm">{sp.species}</p>
                              <p className="text-xs text-muted-foreground mt-1">{sp.suitability}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard
              observationData={observationStats}
              type="corridor"
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
