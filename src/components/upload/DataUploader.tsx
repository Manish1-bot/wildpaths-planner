import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DataUploaderProps {
  projectId: string;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  accept?: Record<string, string[]>;
}

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export function DataUploader({ projectId, onUpload, isUploading, accept }: DataUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      status: 'pending' as const,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Upload files sequentially
    for (const uploadedFile of newFiles) {
      setFiles((prev) =>
        prev.map((f) =>
          f.file === uploadedFile.file ? { ...f, status: 'uploading', progress: 30 } : f
        )
      );

      try {
        await onUpload(uploadedFile.file);
        setFiles((prev) =>
          prev.map((f) =>
            f.file === uploadedFile.file ? { ...f, status: 'success', progress: 100 } : f
          )
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.file === uploadedFile.file
              ? {
                  ...f,
                  status: 'error',
                  progress: 0,
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : f
          )
        );
      }
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept || {
      'application/json': ['.json', '.geojson'],
      'text/csv': ['.csv'],
    },
    disabled: isUploading,
  });

  const removeFile = (file: File) => {
    setFiles((prev) => prev.filter((f) => f.file !== file));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-lg font-medium text-primary">Drop files here...</p>
        ) : (
          <>
            <p className="text-lg font-medium mb-1">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supported formats: GeoJSON, JSON, CSV
            </p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <File className="h-8 w-8 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                      <div className="flex items-center gap-2">
                        {uploadedFile.status === 'uploading' && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        )}
                        {uploadedFile.status === 'success' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {uploadedFile.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFile(uploadedFile.file)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                    {uploadedFile.status === 'uploading' && (
                      <Progress value={uploadedFile.progress} className="h-1" />
                    )}
                    {uploadedFile.status === 'error' && (
                      <p className="text-xs text-destructive">{uploadedFile.error}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
