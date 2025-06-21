
'use client';

import { useState, useEffect } from 'react';
import { Image, Video, ExternalLink, Eye, X } from 'lucide-react';
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

  // Get high-resolution thumbnail URL for pop-over display
  const getHighResThumbnailUrl = (thumbnailUrl: string | undefined) => {
    if (!thumbnailUrl) return thumbnailUrl;
    // Change s220 to s800 for larger thumbnails in pop-over
    return thumbnailUrl.replace(/s220/g, 's800');
  };

  // Get video thumbnail URL for pop-over
  const getVideoThumbnailUrl = (driveUrl: string) => {
  const fileIdMatch = driveUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!fileIdMatch) return null;
  
  const fileId = fileIdMatch[1];
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
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
      {/* CSS Variables for Red Theme */}
      <style jsx global>{`
        :root {
          --brand-red: rgb(203 33 66);
          --brand-red-hover: rgb(185 28 60);
          --brand-red-light: rgba(203, 33, 66, 0.1);
        }
      `}</style>

      {/* Simple Header */}
      <h2 className="text-xl font-bold text-primary">Contributions</h2>

      {/* Gallery Grid */}
      {uploads.length === 0 ? (
        <Card className="p-8 text-center bg-white border border-gray-200">
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Image className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900">No uploads found</h3>
              <p className="text-sm text-gray-500">Start by uploading some photos or videos</p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {uploads.map((upload) => (
            <Card key={upload.id} className="group overflow-hidden bg-white border border-gray-200 hover:border-[var(--brand-red)] transition-colors cursor-pointer" onClick={() => setSelectedUpload(upload)}>
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
                <div className="absolute inset-0 bg-[var(--brand-red-light)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/90 rounded-full p-2">
                    <Eye className="w-4 h-4 text-[var(--brand-red)]" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Full Screen Dialog with Improved Pop-over */}
      <Dialog open={!!selectedUpload} onOpenChange={() => setSelectedUpload(null)}>
        <DialogContent 
          className="max-w-[90vw] max-h-[90vh] w-full h-full p-0 bg-white border-2 border-[var(--brand-red)] overflow-hidden"
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            width: 'fit-content',
            height: 'fit-content'
          }}
        >
          {selectedUpload && (
            <div className="flex flex-col h-full">
              <DialogHeader className="p-4 pb-2 border-b border-gray-200 bg-[var(--brand-red-light)] flex-shrink-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-medium text-gray-900 truncate pr-4">
                    Low Res Preview (Full Resolution for Honoree(s) Only)
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUpload(null)}
                    className="flex-shrink-0 w-11 h-11 p-0 hover:bg-[var(--brand-red-light)] rounded-full"
                    style={{ minWidth: '44px', minHeight: '44px' }}
                  >
                    <X className="w-5 h-5 text-[var(--brand-red)]" />
                  </Button>
                </div>
              </DialogHeader>
              
              <div className="flex-1 p-4 overflow-auto">
                <div className="flex flex-col items-center justify-center min-h-full">
                  {isImage(selectedUpload.mimeType) ? (
                    <div className="max-w-full max-h-[calc(90vh-200px)] overflow-hidden rounded-lg bg-gray-50 border border-gray-200">
                      <img
                        src={getHighResThumbnailUrl(selectedUpload.thumbnailUrl) || getDirectDriveUrl(selectedUpload.driveUrl, selectedUpload.mimeType)}
                        alt="High resolution preview"
                        className="max-w-full max-h-full object-contain"
                        style={{
                          maxWidth: 'calc(90vw - 2rem)',
                          maxHeight: 'calc(90vh - 200px)'
                        }}
                      />
                    </div>
                  ) : isVideo(selectedUpload.mimeType) ? (
                    <div className="max-w-full max-h-[calc(90vh-200px)] overflow-hidden rounded-lg bg-black border border-gray-200">
                      <video
                        controls
                        muted
                        poster={getVideoThumbnailUrl(selectedUpload.driveUrl) || undefined}
                        className="max-w-full max-h-full"
                        style={{
                          maxWidth: 'calc(90vw - 2rem)',
                          maxHeight: 'calc(90vh - 200px)'
                        }}
                        src={selectedUpload.driveUrl}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <ExternalLink className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">Preview not available for this file type</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-600">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <span className="font-medium">{selectedUpload.originalName || 'Upload'}</span>
                    <span>{formatFileSize(selectedUpload.fileSize)}</span>
                  </div>
                  <span>{format(new Date(selectedUpload.uploadedAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
