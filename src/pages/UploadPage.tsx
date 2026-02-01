import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { DataUploader } from '@/components/upload/DataUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/useProjects';
import { useDatasets } from '@/hooks/useDatasets';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileText, FolderPlus, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function UploadPage() {
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const { datasets, uploadDataset } = useDatasets(selectedProjectId);
  const navigate = useNavigate();

  const handleUpload = async (file: File) => {
    if (!selectedProjectId) return;
    await uploadDataset.mutateAsync({ file, projectId: selectedProjectId });
  };

  const handleProjectCreated = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold mb-2">Upload Data</h1>
          <p className="text-muted-foreground">
            Upload GIS data files for analysis and visualization
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Upload Files
                </CardTitle>
                <CardDescription>
                  Select a project first, then upload your GeoJSON or CSV files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project Selection */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Target Project</label>
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
                  <div className="flex items-end">
                    <CreateProjectDialog
                      trigger={
                        <Button variant="outline">
                          <FolderPlus className="h-4 w-4 mr-2" />
                          New
                        </Button>
                      }
                      onSuccess={handleProjectCreated}
                    />
                  </div>
                </div>

                {/* Upload Zone */}
                {selectedProjectId ? (
                  <DataUploader
                    projectId={selectedProjectId}
                    onUpload={handleUpload}
                    isUploading={uploadDataset.isPending}
                  />
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center border-muted-foreground/25">
                    <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Please select a project above to upload files
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Uploads */}
            {datasets.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="font-heading">Uploaded to This Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {datasets.map((dataset) => (
                      <div
                        key={dataset.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{dataset.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(dataset.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigate(`/project/${selectedProjectId}`)}
                  >
                    View Project
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Supported Formats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">.geojson / .json</p>
                  <p className="text-xs text-muted-foreground">
                    GeoJSON files with Point, Polygon, or LineString features
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">.csv</p>
                  <p className="text-xs text-muted-foreground">
                    CSV files with latitude/longitude columns for wildlife sightings
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• CSV files should have columns named "latitude" and "longitude" (or lat/lng)</p>
                <p>• Include a "species" column for wildlife observation data</p>
                <p>• GeoJSON files support all standard geometry types</p>
                <p>• Larger files may take longer to process</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
