
'use client';

import { useState, useEffect } from 'react';
import { Camera, Upload, Image as ImageIcon, Share2 } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Mobile Gallery</h1>
                <p className="text-sm text-gray-600 hidden sm:block">
                  Share photos and videos instantly
                </p>
              </div>
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              <Share2 className="w-4 h-4" />
              Share Gallery
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Share memories instantly
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload photos and videos from your mobile device. Share with friends and family through a simple link. No registration required.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg border p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Easy Upload</h3>
            <p className="text-sm text-gray-600">
              Drag & drop or use your camera to upload instantly
            </p>
          </div>
          
          <div className="bg-white rounded-lg border p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Mobile Optimized</h3>
            <p className="text-sm text-gray-600">
              Perfect experience on phones and tablets
            </p>
          </div>
          
          <div className="bg-white rounded-lg border p-6 text-center shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Secure Sharing</h3>
            <p className="text-sm text-gray-600">
              Choose public or private for each upload
            </p>
          </div>
        </div>

        {/* Upload & Gallery Section */}
        {isConfigured === null ? (
          // Loading state
          <div className="bg-white rounded-lg border p-12 text-center shadow-sm">
            <div>
              <h3 className="text-2xl font-bold mb-4">Loading...</h3>
              <p className="text-gray-600">Checking configuration...</p>
            </div>
          </div>
        ) : isConfigured ? (
          // Configured state - show upload functionality and gallery
          <div className="space-y-8">
            {/* Upload Section */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Upload Files</h3>
                <p className="text-gray-600">
                  Upload photos and videos to your gallery. Choose files or use your camera.
                </p>
              </div>
              <UploadZone onUploadComplete={handleUploadComplete} />
            </div>

            {/* Gallery Section */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <GalleryGrid refreshTrigger={refreshTrigger} />
            </div>
          </div>
        ) : (
          // Not configured state - show setup message
          <div className="bg-white rounded-lg border p-12 text-center shadow-sm">
            <div>
              <h3 className="text-2xl font-bold mb-4">Upload & Gallery Features</h3>
              <p className="text-gray-600 mb-6">
                The upload and gallery functionality will be available once Google Drive credentials are configured.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Setup Required:</strong> Please configure your Google Drive API credentials in the .env file to enable file uploads and gallery features.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/95 backdrop-blur">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Mobile Gallery</span>
            </div>
            <p className="text-sm text-gray-600">
              Secure photo and video sharing powered by 2IP Events & White Knights Media
            </p>
          </div>
        </div>
      </footer>
      
      {/* Toast Notifications */}
      <Toaster position="top-center" richColors />
    </div>
  );
}
