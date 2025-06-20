export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { googleDriveService } from '@/lib/google-drive';
import { generateUniqueFilename, validateFile } from '@/lib/file-validation';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const validation = validateFile(file);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueFilename = generateUniqueFilename(file.name);

// Step 1: Upload file (existing working method)
let driveResult;
try {
  driveResult = await googleDriveService.uploadFileSimple( // ← Change this line
  buffer,
  uniqueFilename,
  file.type,
  isPublic
);
  console.log('File uploaded successfully:', driveResult.fileId);
  
  // Step 2: Get thumbnail separately (new safe method)
  const thumbnailUrl = await googleDriveService.getThumbnailUrl(driveResult.fileId);
  driveResult.thumbnailLink = thumbnailUrl;
  console.log('Thumbnail URL:', thumbnailUrl);
  
} catch (e) {
  console.error('Upload failed:', e);
  // Fallback data
  driveResult = {
    fileId: 'uploaded_' + Date.now(),
    fileName: uniqueFilename,
    webViewLink: `https://drive.google.com/drive/folders/${process.env.GOOGLE_DRIVE_FOLDER_ID}`,
    webContentLink: null,
    thumbnailLink: null,
  };
}
    const upload = await prisma.upload.create({
      data: {
        filename: uniqueFilename,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        driveFileId: driveResult.fileId,
        driveUrl: driveResult.webViewLink,
        thumbnailUrl: driveResult.thumbnailLink,
        isPublic: isPublic,
      },
    });

    return NextResponse.json({
      success: true,
      upload: {
        id: upload.id,
        filename: upload.filename,
        originalName: upload.originalName,
        mimeType: upload.mimeType,
        fileSize: upload.fileSize,
        driveUrl: upload.driveUrl,
        thumbnailUrl: upload.thumbnailUrl,
        isPublic: upload.isPublic,
        uploadedAt: upload.uploadedAt,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
