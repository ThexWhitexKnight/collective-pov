'use client';

import { useState, useEffect } from 'react';
import { Image, Video, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  isPublic: boolean;
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

  // Fixed: Restore video thumbnail generation function
  const getVideoThumbnailUrl = (driveUrl: string) => {
    const fileIdMatch = driveUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!fileIdMatch) return null;
    
    const fileId = fileIdMatch[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400-h400`;
  };

  const getHighQualityThumbnailUrl = (thumbnailUrl: string) => {
    if (!thumbnailUrl) return thumbnailUrl;
    
    // Replace the default small size (s220) with a larger size (s800) for better quality
    return thumbnailUrl.replace(/=s\d+/, '=s800');
  };

  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/uploads?filter=${filter}`);
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
  }, [filter, refreshTrigger]);

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
      // Fixed: Restore smaller grid size for loading state
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="aspect-square animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
     {/* <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold">Gallery</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter uploads" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Uploads</SelectItem>
            <SelectItem value="public">Public Only</SelectItem>
            <SelectItem value="private">Private Only</SelectItem>
          </SelectContent>
        </Select>
      </div>*/}

      {/* Gallery Grid */}
      {uploads.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Get the Album Started!</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'Start by uploading some photos or videos'
                  : `No ${filter} uploads found`
                }
              </p>
            </div>
          </div>
        </Card>
      ) : (
        // Fixed: Updated grid to show 2 columns on mobile
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {uploads.map((upload) => (
            <Card key={upload.id} className="group overflow-hidden">
              <div className="aspect-square relative bg-muted">
                {isImage(upload.mimeType) ? (
                  // Fixed: Use direct drive URL for images if thumbnail fails
                  <img
                    src={upload.thumbnailUrl || getDirectDriveUrl(upload.driveUrl, upload.mimeType)}
                    alt="Image thumbnail"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedUpload(upload)}
                    onError={(e) => {
                      // Fallback to direct drive URL if thumbnail fails
                      const target = e.target as HTMLImageElement;
                      if (target.src !== getDirectDriveUrl(upload.driveUrl, upload.mimeType)) {
                        target.src = getDirectDriveUrl(upload.driveUrl, upload.mimeType);
                      }
                    }}
                  />
                ) : isVideo(upload.mimeType) ? (
                  // Fixed: Use getVideoThumbnailUrl for video thumbnails
                  (() => {
                    const videoThumbnail = getVideoThumbnailUrl(upload.driveUrl);
                    return videoThumbnail ? (
                      <div className="relative w-full h-full cursor-pointer" onClick={() => setSelectedUpload(upload)}>
                        <img
                          src={videoThumbnail}
                          alt="Just a moment. Video thumbnail is still generating"
                          className="w-full h-full object-cover"
                        />
                        {/* Video play overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="bg-white/90 rounded-full p-2">
                            <Video className="w-6 h-6 text-gray-800" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="w-full h-full flex items-center justify-center cursor-pointer bg-gray-100"
                        onClick={() => setSelectedUpload(upload)}
                      >
                        <div className="text-center">
                          <Video className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                          <span className="text-xs text-muted-foreground">Video</span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                    onClick={() => setSelectedUpload(upload)}
                  >
                    <ExternalLink className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedUpload(upload)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* File Info - Made more compact for mobile */}
              <div className="p-2 sm:p-3 space-y-1">
                <p className="text-xs sm:text-sm font-medium truncate">
                  {upload.originalName}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="text-[10px] sm:text-xs">{formatFileSize(upload.fileSize)}</span>
                  <span className="text-[10px] sm:text-xs">{format(new Date(upload.uploadedAt), 'MMM d')}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Full Screen Dialog */}
      <Dialog open={!!selectedUpload} onOpenChange={() => setSelectedUpload(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {selectedUpload && (
            <>
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="flex items-center justify-between">
                  <span className="truncate">{selectedUpload.originalName}</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="p-6 pt-4">
                {isImage(selectedUpload.mimeType) ? (
                  // Fixed: Center image in popover
                  <div className="flex items-center justify-center max-h-[60vh]">
                    <img
                      src={selectedUpload.thumbnailUrl ? getHighQualityThumbnailUrl(selectedUpload.thumbnailUrl) : getDirectDriveUrl(selectedUpload.driveUrl, selectedUpload.mimeType)}
                      alt="Just a moment. Video thumbnail is still generating"
                      className="max-w-full max-h-[60vh] object-contain rounded-lg"
                      onError={(e) => {
                        // Fallback to direct drive URL if high quality thumbnail fails
                        const target = e.target as HTMLImageElement;
                        if (target.src !== getDirectDriveUrl(selectedUpload.driveUrl, selectedUpload.mimeType)) {
                          target.src = getDirectDriveUrl(selectedUpload.driveUrl, selectedUpload.mimeType);
                        }
                      }}
                    />
                  </div>
                ) : isVideo(selectedUpload.mimeType) ? (
                  // Fixed: Center video thumbnail and make it responsive
                  <div className="flex items-center justify-center max-h-[60vh] bg-black rounded-lg">
                    {(() => {
                      const videoThumbnail = getVideoThumbnailUrl(selectedUpload.driveUrl);
                      return videoThumbnail ? (
                        <div className="relative max-w-full max-h-[60vh]">
                          <img
                            src={videoThumbnail}
                            alt="Video thumbnail only"
                            className="max-w-full max-h-[60vh] object-contain"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="bg-white/90 rounded-full p-4">
                              <Video className="w-8 h-8 text-gray-800" />
                            </div>
                          </div>
                          <p className="absolute bottom-4 left-4 text-white text-sm bg-black/50 px-2 py-1 rounded">
                            Video thumbnail preview only - Full playback not available
                          </p>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center min-h-[200px]">
                          <div className="text-center text-white">
                            <Video className="w-16 h-16 mx-auto mb-4" />
                            <p>Video preview not available</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="max-h-[60vh] overflow-hidden rounded-lg bg-muted flex items-center justify-center min-h-[200px]">
                    <div className="text-center">
                      <ExternalLink className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">File preview not available</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">File Size:</span>
                    <span className="ml-2 text-muted-foreground">
                      {formatFileSize(selectedUpload.fileSize)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Uploaded:</span>
                    <span className="ml-2 text-muted-foreground">
                      {format(new Date(selectedUpload.uploadedAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
