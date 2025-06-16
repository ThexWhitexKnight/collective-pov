
'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Image, Video, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  const [isPublic, setIsPublic] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  
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

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

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
        formData.append('isPublic', isPublic.toString());

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
    <div className="space-y-6">
      {/* Upload Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 h-12 text-base"
          disabled={uploading}
        >
          <Upload className="w-5 h-5 mr-2" />
          Choose Files
        </Button>
        
        <Button
          onClick={() => cameraInputRef.current?.click()}
          variant="outline"
          className="flex-1 h-12 text-base"
          disabled={uploading}
        >
          <Camera className="w-5 h-5 mr-2" />
          Camera
        </Button>
      </div>

      {/* Privacy Toggle */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="public-toggle" className="text-base font-medium">
              Make uploads public
            </Label>
            <p className="text-sm text-muted-foreground">
              Public uploads can be viewed by anyone with the gallery link
            </p>
          </div>
          <Switch
            id="public-toggle"
            checked={isPublic}
            onCheckedChange={setIsPublic}
            disabled={uploading}
          />
        </div>
      </Card>

      {/* Drag & Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            Drag & drop files here
          </p>
          <p className="text-sm text-muted-foreground">
            Supports JPG, PNG, HEIC, MP4, MOV, AVI
          </p>
        </div>
      </Card>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Selected Files</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {files.map((filePreview, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {filePreview.type === 'image' ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={filePreview.preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Video className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {filePreview.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(filePreview.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    
                    {filePreview.isValid ? (
                      <div className="flex items-center gap-1 mt-1">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-600">Valid</span>
                      </div>
                    ) : (
                      <p className="text-xs text-red-600 mt-1">
                        {filePreview.error}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading files...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        </Card>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <Button
          onClick={uploadFiles}
          disabled={uploading || files.filter(f => f.isValid).length === 0}
          className="w-full h-12 text-base"
        >
          {uploading ? 'Uploading...' : `Upload ${files.filter(f => f.isValid).length} File(s)`}
        </Button>
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
