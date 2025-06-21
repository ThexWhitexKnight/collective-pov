'use client';

import { useState, useEffect } from 'react';
import { Image, Video, ExternalLink, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Upload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  driveUrl: string;
  thumbnailUrl?: string;
  uploadedAt: string;
}

interface GalleryGridProps {
  refreshTrigger: number;
}

export default function GalleryGrid({ refreshTrigger }: GalleryGridProps) {
  const getDirectDriveUrl = (driveUrl: string, mimeType: string) => {
    console.log('Original driveUrl:', driveUrl);
    
    const fileIdMatch = driveUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!fileIdMatch) return driveUrl;
    
    const fileId = fileIdMatch[1];
    console.log('Extracted fileId:', fileId);
    
    if (isImage(mimeType)) {
      const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=view`;
      console.log('Generated directUrl:', directUrl);
      return directUrl;
    }
    
    if (isVideo(mimeType)) {
      const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
      console.log('Generated video directUrl:', directUrl);
      return directUrl;
    }
    
    return driveUrl;
  };

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/uploads');
      if (!response.ok) throw new Error('Failed to fetch uploads');
      
      const data = await response.json();
      setUploads(data.uploads);
    } catch (error) {
      console.error('Error fetching uploads:', error);
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, [refreshTrigger]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isVideo = (mimeType: string) => mimeType.startsWith('video/');
  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {[...Array(10)].map((_, i) => (
          <Card key={i} className="aspect-square animate-pulse bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Simple Header */}
      <h2 className="text-xl font-bold text-primary">The Collective POV Gallery</h2>

      {/* Gallery Grid */}
      {uploads.length === 0 ? (
        <Card className="p-8 text-center bg-white border border-gray-200">
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Image className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900">No uploads found</h3>
              <p className="text-sm text-gray-500">Start the action by uploading some photos or videos</p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {uploads.map((upload) => (
            <Card key={upload.id} className="group overflow-hidden bg-white border border-gray-200 hover:border-primary transition-colors cursor-pointer" onClick={() => setSelectedUpload(upload)}>
              <div className="aspect-square relative bg-gray-50">
                {isImage(upload.mimeType) ? (
                  upload.thumbnailUrl ? (
                    <img
                      src={upload.thumbnailUrl}
                      alt="thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-6 h-6 text-gray-400" />
                    </div>
                  )
                ) : isVideo(upload.mimeType) ? (
                  upload.thumbnailUrl ? (
                    <div className="relative w-full h-full">
                      <img
                        src={upload.thumbnailUrl}
                        alt="video thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/60 rounded-full p-1.5">
                          <Video className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Video className="w-6 h-6 text-gray-400" />
                    </div>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ExternalLink className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-2">
                    <Eye className="w-4 h-4 text-primary" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Full Screen Dialog */}
      <Dialog open={!!selectedUpload} onOpenChange={() => setSelectedUpload(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-white">
          {selectedUpload && (
            <>
              <DialogHeader className="p-4 pb-0">
                <DialogTitle className="text-lg font-medium text-gray-900 truncate">
                  {selectedUpload.originalName || 'Upload'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="p-4 pt-2">
                {isImage(selectedUpload.mimeType) ? (
                  <div className="max-h-[60vh] overflow-hidden rounded-lg bg-gray-50">
                    <img
                      src={getDirectDriveUrl(selectedUpload.driveUrl, selectedUpload.mimeType)}
                      alt="Full size image"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-hidden rounded-lg bg-black">
                    <video
                      controls
                      className="w-full h-full"
                      src={selectedUpload.driveUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                
                <div className="mt-3 flex justify-between text-sm text-gray-600">
                  <span>{formatFileSize(selectedUpload.fileSize)}</span>
                  <span>{format(new Date(selectedUpload.uploadedAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
