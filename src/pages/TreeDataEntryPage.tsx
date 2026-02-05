import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { TreeObservationForm } from '@/components/tree-impact/TreeObservationForm';
import { AITreeDetection } from '@/components/tree-impact/AITreeDetection';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { useProject } from '@/hooks/useProjects';
import { useTreeObservations } from '@/hooks/useTreeObservations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Trees,
  Plus,
  Search,
  Filter,
  Loader2,
  Trash2,
  BarChart3,
  Satellite,
  MapPin,
  Heart,
  AlertTriangle,
  Download,
  Upload as UploadIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import { useGoogleFormImport } from '@/hooks/useGoogleFormImport';

export default function TreeDataEntryPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  
  const { 
    trees, 
    treesAsGeoJSON,
    stats,
    isLoading: treesLoading, 
    createTree,
    deleteTree
  } = useTreeObservations(projectId);

  const [activeTab, setActiveTab] = useState('entry');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState<string>('all');
  const [filterHealth, setFilterHealth] = useState<string>('all');
  const [filterImpact, setFilterImpact] = useState<string>('all');
  const { importTreeCSV, isImporting } = useGoogleFormImport(projectId);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    onDrop: async (files) => {
      if (files.length > 0) {
        try {
          await importTreeCSV(files[0]);
        } catch (error) {
          console.error('Import error:', error);
        }
      }
    },
  });

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

  // Filter trees
  const filteredTrees = trees.filter(tree => {
    const matchesSearch = !searchTerm || 
      tree.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tree.tree_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tree.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecies = filterSpecies === 'all' || tree.species === filterSpecies;
    const matchesHealth = filterHealth === 'all' || tree.health_status === filterHealth;
    const matchesImpact = filterImpact === 'all' || tree.impact_status === filterImpact;

    return matchesSearch && matchesSpecies && matchesHealth && matchesImpact;
  });

  // Get unique species for filter
  const uniqueSpecies = [...new Set(trees.map(t => t.species).filter(Boolean))];

  // Export as GeoJSON
  const exportGeoJSON = () => {
    const blob = new Blob([JSON.stringify(treesAsGeoJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trees_${project.name.replace(/\s+/g, '_')}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getHealthBadge = (status: string | null) => {
    const colors: Record<string, string> = {
      excellent: 'bg-green-500/10 text-green-600',
      good: 'bg-lime-500/10 text-lime-600',
      fair: 'bg-yellow-500/10 text-yellow-600',
      poor: 'bg-orange-500/10 text-orange-600',
      dead: 'bg-gray-500/10 text-gray-600',
    };
    return colors[status || ''] || 'bg-muted text-muted-foreground';
  };

  const getImpactBadge = (status: string | null) => {
    const colors: Record<string, string> = {
      safe: 'bg-green-500/10 text-green-600',
      at_risk: 'bg-yellow-500/10 text-yellow-600',
      affected: 'bg-red-500/10 text-red-600',
      removed: 'bg-gray-500/10 text-gray-600',
      transplanted: 'bg-blue-500/10 text-blue-600',
    };
    return colors[status || ''] || 'bg-muted text-muted-foreground';
  };

  // Prepare analytics data
  const treeAnalytics = {
    total: stats.total,
    affected: stats.byImpact.find(([s]) => s === 'affected')?.[1] || 0,
    safe: stats.byImpact.find(([s]) => s === 'safe')?.[1] || 0,
    bySpecies: stats.bySpecies,
    byHealth: stats.byHealth,
    byImpact: stats.byImpact,
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
              <h1 className="text-3xl font-heading font-bold">Tree Data Entry</h1>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                <Trees className="h-3 w-3 mr-1" />
                {trees.length} Trees
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Record individual tree observations or use AI to detect trees from images
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Project: {project.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportGeoJSON} disabled={trees.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export GeoJSON
            </Button>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tree
            </Button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-6">
            <TreeObservationForm
              projectId={project.id}
              onSubmit={async (data) => {
                await createTree.mutateAsync(data);
                setShowForm(false);
              }}
              isSubmitting={createTree.isPending}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="entry" className="flex items-center gap-2">
              <Trees className="h-4 w-4" />
              <span className="hidden sm:inline">Trees</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Satellite className="h-4 w-4" />
              <span className="hidden sm:inline">AI Detect</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Charts</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <UploadIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </TabsTrigger>
          </TabsList>

          {/* Trees List Tab */}
          <TabsContent value="entry">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-heading flex items-center gap-2">
                      <Trees className="h-5 w-5 text-green-600" />
                      Tree Observations
                    </CardTitle>
                    <CardDescription>
                      {filteredTrees.length} of {trees.length} trees
                    </CardDescription>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        className="pl-9 w-40"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={filterSpecies} onValueChange={setFilterSpecies}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Species" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Species</SelectItem>
                        {uniqueSpecies.map((s) => (
                          <SelectItem key={s} value={s!}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterHealth} onValueChange={setFilterHealth}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Health" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Health</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="dead">Dead</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterImpact} onValueChange={setFilterImpact}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Impact" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Impact</SelectItem>
                        <SelectItem value="safe">Safe</SelectItem>
                        <SelectItem value="at_risk">At Risk</SelectItem>
                        <SelectItem value="affected">Affected</SelectItem>
                        <SelectItem value="removed">Removed</SelectItem>
                        <SelectItem value="transplanted">Transplanted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {treesLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredTrees.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trees className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium mb-2">
                      {trees.length === 0 ? 'No trees recorded yet' : 'No trees match filters'}
                    </p>
                    <p className="text-sm mb-4">
                      {trees.length === 0 
                        ? 'Add trees manually or use AI detection'
                        : 'Try adjusting your search or filters'
                      }
                    </p>
                    {trees.length === 0 && (
                      <Button onClick={() => setShowForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Tree
                      </Button>
                    )}
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                      {filteredTrees.map((tree) => (
                        <div
                          key={tree.id}
                          className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Trees className="h-5 w-5 text-green-600" />
                              <span className="font-medium">
                                {tree.tree_id || tree.species || 'Unknown Tree'}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => deleteTree.mutate(tree.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {tree.species && (
                            <p className="text-sm text-muted-foreground mb-2">{tree.species}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {tree.health_status && (
                              <Badge variant="outline" className={getHealthBadge(tree.health_status)}>
                                <Heart className="h-3 w-3 mr-1" />
                                {tree.health_status}
                              </Badge>
                            )}
                            {tree.impact_status && (
                              <Badge variant="outline" className={getImpactBadge(tree.impact_status)}>
                                {tree.impact_status === 'affected' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                {tree.impact_status.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            {tree.height_meters && (
                              <span>Height: {tree.height_meters}m</span>
                            )}
                            {tree.age_years && (
                              <span>Age: {tree.age_years}y</span>
                            )}
                            {tree.canopy_diameter_meters && (
                              <span>Canopy: {tree.canopy_diameter_meters}m</span>
                            )}
                            {tree.trunk_diameter_cm && (
                              <span>Trunk: {tree.trunk_diameter_cm}cm</span>
                            )}
                          </div>
                          
                          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {tree.latitude.toFixed(4)}, {tree.longitude.toFixed(4)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Detection Tab */}
          <TabsContent value="ai">
            <AITreeDetection 
              projectId={project.id}
              onDetectionComplete={(result) => {
                console.log('AI Detection result:', result);
              }}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard
              treeData={treeAnalytics}
              type="tree"
            />
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <UploadIcon className="h-5 w-5 text-primary" />
                  Import Tree Data
                </CardTitle>
                <CardDescription>
                  Import tree observations from Google Forms or CSV files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Google Form Integration */}
                <div 
                  {...getRootProps()}
                  className={`p-6 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <h4 className="font-medium mb-2">Google Form Integration</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isDragActive 
                      ? 'Drop the CSV file here...' 
                      : 'Drag and drop a CSV file here, or click to select'}
                  </p>
                  <ol className="text-sm text-muted-foreground space-y-2 mb-4">
                    <li>1. Create a Google Form with fields: Latitude, Longitude, Species, Height, Age, Health</li>
                    <li>2. Collect responses from field researchers</li>
                    <li>3. Download responses as CSV from Google Sheets</li>
                    <li>4. Upload the CSV file below</li>
                  </ol>
                  <Button variant="outline" disabled={isImporting}>
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <UploadIcon className="h-4 w-4 mr-2" />
                        Select CSV File
                      </>
                    )}
                  </Button>
                </div>

                {/* Direct CSV Import */}
                <div className="p-6 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">CSV Format Requirements</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Your CSV should include these columns:
                  </p>
                  <code className="text-xs bg-muted p-2 rounded block">
                    latitude,longitude,species,height_meters,age_years,health_status,notes
                  </code>
                  <p className="text-sm text-muted-foreground mt-4">
                    <strong>Tip:</strong> Column names are flexible - the system recognizes variations like 
                    'lat/latitude', 'lng/longitude/long', 'height/height_m', 'age/age_years', etc.
                  </p>
                </div>

                {/* Webhook Info */}
                <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    API Webhook (Advanced)
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    For automated imports, send POST requests to:
                  </p>
                  <code className="text-xs bg-muted p-2 rounded block break-all">
                    {import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-form-webhook
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    Body: {'{'} formType: "tree_observation", projectId: "...", userId: "...", responses: [...] {'}'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
