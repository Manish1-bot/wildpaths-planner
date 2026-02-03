import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Camera, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Trees,
  Satellite,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AITreeDetectionProps {
  projectId: string;
  onDetectionComplete?: (result: any) => void;
}

type DetectionStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

export function AITreeDetection({ projectId, onDetectionComplete }: AITreeDetectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<DetectionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const processImage = async (file: File) => {
    if (!user) {
      toast({ title: 'Not authenticated', variant: 'destructive' });
      return;
    }

    setStatus('uploading');
    setProgress(10);
    setError(null);

    try {
      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('observation-photos')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setProgress(30);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('observation-photos')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;
      
      setStatus('processing');
      setProgress(50);

      // Call AI detection
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'ai-tree-detection',
        {
          body: {
            imageUrl,
            projectId,
            userId: user.id,
            detectionType: 'tree_detection',
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      setProgress(100);
      setStatus('completed');
      setResult(functionData);
      
      toast({
        title: 'Detection Complete',
        description: `Detected ${functionData.detectedFeatures?.totalTrees || 0} trees in the image.`,
      });

      onDetectionComplete?.(functionData);
    } catch (err) {
      console.error('Detection error:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Detection failed');
      toast({
        title: 'Detection Failed',
        description: err instanceof Error ? err.message : 'Failed to process image',
        variant: 'destructive',
      });
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      processImage(file);
    }
  }, [projectId, user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.tif'],
    },
    maxFiles: 1,
    disabled: status === 'uploading' || status === 'processing',
  });

  const reset = () => {
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setError(null);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Satellite className="h-5 w-5 text-primary" />
          AI Tree Detection
        </CardTitle>
        <CardDescription>
          Upload satellite or drone images to automatically detect trees using AI vision
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'idle' && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {isDragActive ? 'Drop the image here' : 'Drop satellite/drone image here'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse (PNG, JPG, TIFF)
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                <Badge variant="outline">
                  <Satellite className="h-3 w-3 mr-1" /> Satellite
                </Badge>
                <Badge variant="outline">
                  <Camera className="h-3 w-3 mr-1" /> Drone
                </Badge>
                <Badge variant="outline">
                  <MapPin className="h-3 w-3 mr-1" /> Aerial
                </Badge>
              </div>
            </div>
          </div>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <div className="p-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <div>
              <p className="font-medium">
                {status === 'uploading' ? 'Uploading image...' : 'AI analyzing image...'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {status === 'processing' && 'Detecting trees and vegetation patterns'}
              </p>
            </div>
            <Progress value={progress} className="w-full max-w-xs mx-auto" />
          </div>
        )}

        {status === 'completed' && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Detection Complete</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-green-500/10 text-center">
                <Trees className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-600">
                  {result.detectedFeatures?.totalTrees || 0}
                </p>
                <p className="text-xs text-muted-foreground">Trees Detected</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 text-center">
                <p className="text-2xl font-bold text-primary">
                  {result.detectedFeatures?.treeClusters || 0}
                </p>
                <p className="text-xs text-muted-foreground">Tree Clusters</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 text-center">
                <p className="text-2xl font-bold text-primary">
                  {result.detectedFeatures?.vegetationCoverage || 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">Vegetation Coverage</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 text-center">
                <p className="text-2xl font-bold text-primary">
                  {result.confidenceScore ? `${Math.round(result.confidenceScore * 100)}%` : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">Confidence</p>
              </div>
            </div>

            {result.detectedFeatures?.analysis && (
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">AI Analysis Summary</p>
                <p className="text-sm text-muted-foreground">
                  {result.detectedFeatures.analysis}
                </p>
              </div>
            )}

            <Button onClick={reset} variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              Analyze Another Image
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="p-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <div>
              <p className="font-medium text-destructive">Detection Failed</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={reset} variant="outline">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
