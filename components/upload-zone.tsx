'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, Video, Check, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { validateFile, validateVideoFile } from '@/lib/file-validation';
import { toast } from 'sonner';

interface FilePreview {
  file: File;
  preview: string;
  isValid: boolean;
  error?: string;
  type: 'image' | 'video';
}

interface UploadZoneProps {
  onUploadComplete: () => void;
}

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (fileList: FileList) => {
    const newFiles: FilePreview[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // Basic validation first
      const validation = validateFile(file);
      
      // For videos, do additional validation
      let finalValidation = validation;
      if (validation.isValid && validation.fileType === 'video') {
        try {
          finalValidation = await validateVideoFile(file);
        } catch (error) {
          finalValidation = {
            isValid: false,
            error: 'Failed to validate video file',
            fileType: 'video'
          };
        }
      }

      const preview = URL.createObjectURL(file);
      
      newFiles.push({
        file,
        preview,
        isValid: finalValidation.isValid,
        error: finalValidation.error,
        type: finalValidation.fileType as 'image' | 'video'
      });
    }
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFiles = async () => {
    const validFiles = files.filter(f => f.isValid);
    
    if (validFiles.length === 0) {
      toast.error('No valid files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const filePreview = validFiles[i];
        const formData = new FormData();
        formData.append('file', filePreview.file);
        formData.append('isPublic', 'true'); // Always public now

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        setUploadProgress(((i + 1) / validFiles.length) * 100);
      }

      toast.success(`Successfully uploaded ${validFiles.length} file(s)`);
      setFiles([]);
      onUploadComplete();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
      {/* Simple File Selection Buttons */}
      <div className="space-y-4">
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-16 text-lg bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg"
          disabled={uploading}
        >
          <Upload className="w-6 h-6 mr-3" />
          Select Files
        </Button>
        
        <Button
          onClick={() => cameraInputRef.current?.click()}
          variant="outline"
          className="w-full h-16 text-lg border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl"
          disabled={uploading}
        >
          <Camera className="w-6 h-6 mr-3" />
          Take Photo
        </Button>
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <Card className="p-4 bg-background border border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Selected Files</h3>
          <div className="space-y-3">
            {files.map((filePreview, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0">
                  {filePreview.type === 'image' ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={filePreview.preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Video className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {filePreview.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(filePreview.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  
                  {filePreview.isValid ? (
                    <div className="flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600">Ready</span>
                    </div>
                  ) : (
                    <p className="text-xs text-destructive mt-1">
                      {filePreview.error}
                    </p>
                  )}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="h-8 w-8 p-0 hover:bg-destructive/10"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upload Progress */}
      {uploading && (
        <Card className="p-4 bg-background border border-border">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">Uploading files...</span>
              <span className="text-primary font-medium">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        </Card>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <Button
          onClick={uploadFiles}
          disabled={uploading || files.filter(f => f.isValid).length === 0}
          className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg"
        >
          {uploading ? 'Uploading...' : `Upload ${files.filter(f => f.isValid).length} File(s)`}
        </Button>
      )}

      {/* Success/Error Messages */}
      {!uploading && files.length === 0 && (
        <div className="text-center py-8">
          <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Select files to get started
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Supports JPG, PNG, HEIC, MP4, MOV, AVI
          </p>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
