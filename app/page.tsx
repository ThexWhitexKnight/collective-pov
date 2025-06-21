'use client';

import { useState, useEffect } from 'react';
import { Camera, Upload, Image as ImageIcon } from 'lucide-react';
import UploadZone from '@/components/upload-zone';
import GalleryGrid from '@/components/gallery-grid';
import { Toaster } from 'sonner';

export default function HomePage() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Check configuration status
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setIsConfigured(data.googleDriveConfigured);
      })
      .catch(error => {
        console.error('Error checking configuration:', error);
        setIsConfigured(false);
      });
  }, []);

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">The Collective POV Experience</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  by 2IP Events & White Knights Media
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Gift Them Your Memories
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The Guests of Honor have requested YOU! Help them experience the day again and again, by sharing YOUR perspective. Help them fill this gallery with photos and videos of the day's moments.
          </p>
        </div>

        {/* Upload & Gallery Section */}
        {isConfigured === null ? (
          // Loading state
          <div className="bg-card rounded-lg border p-12 text-center shadow-sm">
            <div>
              <h3 className="text-2xl font-bold mb-4">Loading...</h3>
              <p className="text-muted-foreground">Checking configuration...</p>
            </div>
          </div>
        ) : isConfigured ? (
          // Configured state - show upload functionality and gallery
          <div className="space-y-8">
            {/* Upload Section */}
            <div className="bg-card rounded-lg border p-6 shadow-sm">
              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Upload Files</h3>
                <p className="text-muted-foreground">
                  Choose photos and videos to add to the Collective POV Gallery
                </p>
              </div>
              <UploadZone onUploadComplete={handleUploadComplete} />
            </div>

            {/* Gallery Section */}
            <div className="bg-card rounded-lg border p-6 shadow-sm">
              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">The Collective POV Gallery</h3>
                <p className="text-muted-foreground">
                  Video uploads take a moment to generate thumbnails. Please be patient, or share more photos and videos while we process your uploads.
                </p>
              </div>
              <GalleryGrid refreshTrigger={refreshTrigger} />
            </div>
          </div>
        ) : (
          // Not configured state - show setup message
          <div className="bg-card rounded-lg border p-12 text-center shadow-sm">
            <div>
              <h3 className="text-2xl font-bold mb-4">Setup Required</h3>
              <p className="text-muted-foreground mb-6">
                Please configure Google Drive credentials to enable uploads.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur mt-12">
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Powered by 2IP Events & White Knights Media
            </p>
          </div>
        </div>
      </footer>
      
      {/* Toast Notifications */}
      <Toaster position="top-center" richColors />
    </div>
  );
}
