import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Trees, Construction, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TreeDataUploaderProps {
  onUploadTrees: (file: File) => Promise<void>;
  onUploadDevelopment: (file: File) => Promise<void>;
  isUploadingTrees: boolean;
  isUploadingDevelopment: boolean;
}

export function TreeDataUploader({
  onUploadTrees,
  onUploadDevelopment,
  isUploadingTrees,
  isUploadingDevelopment,
}: TreeDataUploaderProps) {
  const [activeTab, setActiveTab] = useState<'trees' | 'development'>('trees');

  const onDropTrees = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        await onUploadTrees(acceptedFiles[0]);
      }
    },
    [onUploadTrees]
  );

  const onDropDevelopment = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        await onUploadDevelopment(acceptedFiles[0]);
      }
    },
    [onUploadDevelopment]
  );

  const treesDropzone = useDropzone({
    onDrop: onDropTrees,
    accept: {
      'application/json': ['.json', '.geojson'],
      'text/csv': ['.csv'],
    },
    multiple: false,
    disabled: isUploadingTrees,
  });

  const developmentDropzone = useDropzone({
    onDrop: onDropDevelopment,
    accept: {
      'application/json': ['.json', '.geojson'],
      'text/csv': ['.csv'],
    },
    multiple: false,
    disabled: isUploadingDevelopment,
  });

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload Data for Tree Impact Analysis
        </CardTitle>
        <CardDescription>
          Upload tree distribution data (before state) and development layer (after state) to analyze environmental impact.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-4">
            <TabsTrigger value="trees" className="flex items-center gap-2">
              <Trees className="h-4 w-4" />
              Tree Data (Before)
            </TabsTrigger>
            <TabsTrigger value="development" className="flex items-center gap-2">
              <Construction className="h-4 w-4" />
              Development Layer (After)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trees">
            <div
              {...treesDropzone.getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                treesDropzone.isDragActive
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-muted-foreground/25 hover:border-green-500/50 hover:bg-green-500/5',
                isUploadingTrees && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input {...treesDropzone.getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                {isUploadingTrees ? (
                  <Loader2 className="h-10 w-10 text-green-500 animate-spin" />
                ) : (
                  <div className="p-3 rounded-full bg-green-500/10">
                    <Trees className="h-8 w-8 text-green-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {isUploadingTrees ? 'Uploading...' : 'Upload Tree Data'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    GeoJSON or CSV with Latitude/Longitude columns
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Example: trees_before.geojson or trees_before.csv
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Expected Format:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• CSV: latitude, longitude, species (optional), age (optional)</li>
                <li>• GeoJSON: FeatureCollection with Point features</li>
                <li>• Each tree = one point with coordinates</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="development">
            <div
              {...developmentDropzone.getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                developmentDropzone.isDragActive
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-muted-foreground/25 hover:border-orange-500/50 hover:bg-orange-500/5',
                isUploadingDevelopment && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input {...developmentDropzone.getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                {isUploadingDevelopment ? (
                  <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
                ) : (
                  <div className="p-3 rounded-full bg-orange-500/10">
                    <Construction className="h-8 w-8 text-orange-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {isUploadingDevelopment ? 'Uploading...' : 'Upload Development Layer'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Roads, corridors, or construction zones (GeoJSON/CSV)
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    LineString, Polygon, or MultiPolygon features
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Expected Format:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• GeoJSON: Roads (LineString), Zones (Polygon)</li>
                <li>• CSV: Coordinates defining development boundaries</li>
                <li>• Can include multiple features</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
