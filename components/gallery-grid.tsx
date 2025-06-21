'use client';

import { useState, useEffect } from 'react';
import { Image, Video, ExternalLink, Eye, EyeOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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

  // Generate video thumbnail URL from Google Drive
  const getVideoThumbnailUrl = (driveUrl: string) => {
    const fileIdMatch = driveUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!fileIdMatch) return null;
    
    const fileId = fileIdMatch[1];
// Use Google Drive's thumbnail API with size parameter
return `https://drive.google.com/thumbnail?id=${fileId}&sz=s400`;  // ✅ Proper syntax + Google Drive

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="aspect-square animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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
      </div>

      {/* Gallery Grid */}
      {uploads.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No uploads found</h3>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {uploads.map((upload) => (
            <Card key={upload.id} className="group overflow-hidden">
              <div className="aspect-square relative bg-muted">
                {isImage(upload.mimeType) ? (
                  upload.thumbnailUrl ? (
                    <img
                      src={upload.thumbnailUrl}
                      alt="img thumb"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setSelectedUpload(upload)}
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      onClick={() => setSelectedUpload(upload)}
                    >
                      <Image className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )
                ) : isVideo(upload.mimeType) ? (
                  // Fixed video thumbnail logic
                  (() => {
                    const videoThumbnail = upload.thumbnailUrl || getVideoThumbnailUrl(upload.driveUrl);
                    return videoThumbnail ? (
                      <div className="relative w-full h-full cursor-pointer" onClick={() => setSelectedUpload(upload)}>
                        <img
                          src={videoThumbnail}
                          alt="video thumb"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if thumbnail fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-gray-100">
                                  <div class="text-center">
                                    <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                    </svg>
                                    <span class="text-xs text-gray-500">Video</span>
                                  </div>
                                </div>
                              `;
                            }
                          }}
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
              
              {/* File Info */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate flex-1">
                    {upload.originalName}
                  </p>
                  <Badge variant={upload.isPublic ? 'default' : 'secondary'}>
                    {upload.isPublic ? (
                      <><Eye className="w-3 h-3 mr-1" />Public</>
                    ) : (
                      <><EyeOff className="w-3 h-3 mr-1" />Private</>
                    )}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatFileSize(upload.fileSize)}</span>
                  <span>{format(new Date(upload.uploadedAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Mobile-Optimized Full Screen Dialog */}
      <Dialog open={!!selectedUpload} onOpenChange={() => setSelectedUpload(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] p-0 gap-0">
          {selectedUpload && (
            <>
              {/* Custom Header with Single Close Button */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <h2 className="text-lg font-semibold truncate">
                    {selectedUpload.originalName}
                  </h2>
                  <Badge variant={selectedUpload.isPublic ? 'default' : 'secondary'}>
                    {selectedUpload.isPublic ? (
                      <><Eye className="w-3 h-3 mr-1" />Public</>
                    ) : (
                      <><EyeOff className="w-3 h-3 mr-1" />Private</>
                    )}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUpload(null)}
                  className="ml-2 h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Media Content */}
              <div className="flex-1 p-2 sm:p-4 overflow-hidden">
                {isImage(selectedUpload.mimeType) ? (
                  <div className="h-full max-h-[60vh] sm:max-h-[65vh] flex items-center justify-center">
                    <img
                      src={getDirectDriveUrl(selectedUpload.driveUrl, selectedUpload.mimeType)}
                      alt="Full size image"
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>
                ) : isVideo(selectedUpload.mimeType) ? (
                  <div className="h-full max-h-[60vh] sm:max-h-[65vh] flex items-center justify-center bg-black rounded-lg overflow-hidden">
                    <video
                      controls
                      className="max-w-full max-h-full"
                      src={selectedUpload.driveUrl}
                      poster={selectedUpload.thumbnailUrl || getVideoThumbnailUrl(selectedUpload.driveUrl) || undefined}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <div className="h-full max-h-[60vh] sm:max-h-[65vh] flex items-center justify-center bg-muted rounded-lg">
                    <div className="text-center">
                      <ExternalLink className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">File preview not available</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* File Details */}
              <div className="p-4 sm:p-6 pt-2 border-t bg-muted/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between sm:block">
                    <span className="font-medium">File Size:</span>
                    <span className="text-muted-foreground sm:ml-0 ml-2">
                      {formatFileSize(selectedUpload.fileSize)}
                    </span>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="font-medium">Uploaded:</span>
                    <span className="text-muted-foreground sm:ml-0 ml-2">
                      {format(new Date(selectedUpload.uploadedAt), 'PPP')}
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
