import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { AddressSearch } from '@/components/survey/AddressSearch';
import { AreaDrawingTools, DrawingMode } from '@/components/survey/AreaDrawingTools';
import { AreaSummary } from '@/components/survey/AreaSummary';
import { InteractiveAreaMap } from '@/components/survey/InteractiveAreaMap';
import { TreeQuickForm } from '@/components/survey/TreeQuickForm';
import { GridSamplingPanel } from '@/components/survey/GridSamplingPanel';
import { AITreeDetection } from '@/components/tree-impact/AITreeDetection';
import { useProject } from '@/hooks/useProjects';
import { useTreeObservations } from '@/hooks/useTreeObservations';
import { GeocodingResult, detectLandType, recommendSurveyMethod } from '@/lib/geocoding';
import { AreaDetails } from '@/lib/areaCalculations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  MapPin, 
  Loader2, 
  Trees, 
  Grid3x3, 
  Satellite,
  ChevronRight,
  Check,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

type WizardStep = 'location' | 'draw' | 'survey' | 'complete';
type SurveyMethod = 'detailed' | 'grid' | 'ai';

export default function AreaSurveyPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { createTree } = useTreeObservations(projectId);

  // Wizard state
  const [step, setStep] = useState<WizardStep>('location');
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([78.9629, 20.5937]);
  const [mapZoom, setMapZoom] = useState(5);
  
  // Drawing state
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('select');
  const [drawnArea, setDrawnArea] = useState<GeoJSON.Feature<GeoJSON.Polygon> | null>(null);
  const [areaDetails, setAreaDetails] = useState<AreaDetails | null>(null);
  
  // Survey state
  const [surveyMethod, setSurveyMethod] = useState<SurveyMethod | null>(null);
  const [addingTreeAt, setAddingTreeAt] = useState<[number, number] | null>(null);
  const [treeCount, setTreeCount] = useState(0);

  // Handle location selection
  const handleLocationSelect = useCallback((result: GeocodingResult) => {
    setSelectedLocation(result);
    setMapCenter([result.lon, result.lat]);
    setMapZoom(16);
    setStep('draw');
    toast.success(`Location found: ${result.display_name.split(',')[0]}`);
  }, []);

  // Handle current location
  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([longitude, latitude]);
        setMapZoom(16);
        setSelectedLocation({
          display_name: 'Current Location',
          lat: latitude,
          lon: longitude,
          type: 'user_location',
          importance: 1,
          boundingbox: ['', '', '', ''],
        });
        setStep('draw');
        toast.success('Using your current location');
      },
      (error) => {
        toast.error('Could not get your location. Please search manually.');
      }
    );
  }, []);

  // Handle area drawn
  const handleAreaDrawn = useCallback((polygon: GeoJSON.Feature<GeoJSON.Polygon>, details: AreaDetails) => {
    setDrawnArea(polygon);
    setAreaDetails(details);
    setDrawingMode('select');
    toast.success(`Area selected: ${details.areaHectares.toFixed(2)} hectares`);
  }, []);

  // Handle survey method selection
  const handleMethodSelect = useCallback((method: SurveyMethod) => {
    setSurveyMethod(method);
    setStep('survey');
  }, []);

  // Handle tree creation
  const handleTreeSubmit = useCallback(async (data: any) => {
    try {
      await createTree.mutateAsync(data);
      setTreeCount(prev => prev + 1);
      setAddingTreeAt(null);
      toast.success(`Tree #${treeCount + 1} saved`);
    } catch (error) {
      toast.error('Failed to save tree');
    }
  }, [createTree, treeCount]);

  // Handle save and continue
  const handleSaveAndContinue = useCallback(async (data: any) => {
    try {
      await createTree.mutateAsync(data);
      setTreeCount(prev => prev + 1);
      toast.success(`Tree #${treeCount + 1} saved - click map to add more`);
      setAddingTreeAt(null);
    } catch (error) {
      toast.error('Failed to save tree');
    }
  }, [createTree, treeCount]);

  // Reset wizard
  const handleReset = useCallback(() => {
    setStep('location');
    setSelectedLocation(null);
    setDrawnArea(null);
    setAreaDetails(null);
    setSurveyMethod(null);
    setTreeCount(0);
    setDrawingMode('select');
    setMapCenter([78.9629, 20.5937]);
    setMapZoom(5);
  }, []);

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

  const landType = selectedLocation ? detectLandType(selectedLocation) : 'other';

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to={`/project/${project.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-heading font-bold">Area Survey</h1>
              <Badge variant="secondary">
                {project.name}
              </Badge>
            </div>
            
            {/* Step Indicator */}
            <div className="flex items-center gap-2 text-sm">
              {[
                { id: 'location', label: 'Find Location' },
                { id: 'draw', label: 'Draw Area' },
                { id: 'survey', label: 'Survey Trees' },
                { id: 'complete', label: 'Complete' },
              ].map((s, idx) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step === s.id 
                      ? 'bg-primary text-primary-foreground' 
                      : ['location', 'draw', 'survey', 'complete'].indexOf(step) > idx
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {['location', 'draw', 'survey', 'complete'].indexOf(step) > idx ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className={step === s.id ? 'font-medium' : 'text-muted-foreground'}>
                    {s.label}
                  </span>
                  {idx < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>
          
          {step !== 'location' && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="space-y-4">
            {step === 'location' && (
              <AddressSearch
                onLocationSelect={handleLocationSelect}
                onCurrentLocation={handleCurrentLocation}
              />
            )}

            {step === 'draw' && (
              <>
                <AreaDrawingTools
                  mode={drawingMode}
                  onModeChange={setDrawingMode}
                  onClear={() => {
                    setDrawnArea(null);
                    setAreaDetails(null);
                  }}
                  onComplete={() => {
                    if (areaDetails) {
                      // Stay on draw step to show area summary and method selection
                    }
                  }}
                  hasDrawing={!!drawnArea}
                  isDrawing={drawingMode !== 'select'}
                />
                
                <AreaSummary
                  areaDetails={areaDetails}
                  landType={landType}
                  locationName={selectedLocation?.display_name}
                  onMethodSelect={handleMethodSelect}
                />
              </>
            )}

            {step === 'survey' && surveyMethod === 'detailed' && !addingTreeAt && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Trees className="h-5 w-5 text-primary" />
                    Tree-by-Tree Survey
                  </CardTitle>
                  <CardDescription>
                    Click anywhere in the project area to add a tree
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-primary/10 text-center">
                    <p className="text-3xl font-bold text-primary">{treeCount}</p>
                    <p className="text-sm text-muted-foreground">trees recorded</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    💡 Click on the map to add tree locations. Each click opens a form to record details.
                  </p>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setStep('complete');
                      toast.success(`Survey complete! ${treeCount} trees recorded.`);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Finish Survey ({treeCount} trees)
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 'survey' && surveyMethod === 'detailed' && addingTreeAt && (
              <TreeQuickForm
                location={addingTreeAt}
                onSubmit={handleTreeSubmit}
                onCancel={() => setAddingTreeAt(null)}
                onSaveAndContinue={handleSaveAndContinue}
                treeNumber={treeCount + 1}
              />
            )}

            {step === 'survey' && surveyMethod === 'grid' && drawnArea && areaDetails && (
              <GridSamplingPanel
                projectArea={drawnArea}
                areaHectares={areaDetails.areaHectares}
                onSurveyComplete={(results) => {
                  setStep('complete');
                  toast.success(`Survey complete! Estimated ${results.estimatedTotal} trees.`);
                }}
              />
            )}

            {step === 'survey' && surveyMethod === 'ai' && (
              <AITreeDetection
                projectId={project.id}
                onDetectionComplete={(result) => {
                  setStep('complete');
                  toast.success('AI detection complete!');
                }}
              />
            )}

            {step === 'complete' && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    Survey Complete
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-500/10 text-center">
                    <Trees className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <p className="text-lg font-medium text-green-700">
                      {treeCount > 0 ? `${treeCount} trees recorded` : 'Survey data saved'}
                    </p>
                  </div>

                  <Button asChild className="w-full">
                    <Link to={`/project/${project.id}/tree-impact`}>
                      Run Impact Analysis
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleReset}
                  >
                    Start New Survey
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Map - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="glass-card h-[calc(100vh-200px)] min-h-[500px]">
              <CardContent className="p-0 h-full">
                <InteractiveAreaMap
                  center={mapCenter}
                  zoom={mapZoom}
                  drawingMode={drawingMode}
                  onAreaDrawn={handleAreaDrawn}
                  drawnArea={drawnArea}
                  className="h-full rounded-lg"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
