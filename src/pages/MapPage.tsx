import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { MapViewer } from '@/components/map/MapViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/useProjects';
import { useDatasets } from '@/hooks/useDatasets';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Map, Upload, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MapPage() {
  const { projects, isLoading: projectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const { datasets } = useDatasets(selectedProjectId);

  // Prepare map layers from datasets
  const mapLayers = datasets
    .filter((d) => d.geojson_data)
    .map((d, idx) => ({
      id: d.id,
      name: d.name,
      data: d.geojson_data,
      color: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5],
    }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Sidebar */}
          <Card className="glass-card lg:w-80 shrink-0">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                Map Viewer
              </CardTitle>
              <CardDescription>
                Select a project to view its data on the map
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Project</label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProjectId && datasets.length === 0 && (
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No data uploaded for this project yet
                  </p>
                  <Button size="sm" asChild>
                    <Link to={`/project/${selectedProjectId}`}>
                      Upload Data
                    </Link>
                  </Button>
                </div>
              )}

              {!selectedProjectId && projects.length === 0 && (
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Create a project to get started
                  </p>
                  <Button size="sm" asChild>
                    <Link to="/projects">
                      Go to Projects
                    </Link>
                  </Button>
                </div>
              )}

              {mapLayers.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Loaded Layers</label>
                  <div className="space-y-2">
                    {mapLayers.map((layer) => (
                      <div
                        key={layer.id}
                        className="flex items-center gap-2 p-2 rounded bg-muted/50"
                      >
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: layer.color }}
                        />
                        <span className="text-sm truncate">{layer.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Drawing Tools</p>
                <p className="text-xs text-muted-foreground">
                  Use the tools on the map to draw corridors. Click to add points, double-click to finish.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <div className="flex-1 min-h-[500px] lg:min-h-0">
            <Card className="glass-card h-full">
              <CardContent className="p-0 h-full">
                <MapViewer
                  geojsonLayers={mapLayers}
                  onDrawComplete={(geojson) => {
                    console.log('Drawn corridor:', geojson);
                  }}
                  className="h-full min-h-[500px] rounded-lg"
                  interactive
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
