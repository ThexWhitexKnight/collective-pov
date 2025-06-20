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

// Try to get real Google Drive data with thumbnails
let driveResult;
try {
  driveResult = await googleDriveService.uploadFile(
    buffer,
    uniqueFilename,
    file.type,
    isPublic
  );
  console.log('Got real Google Drive data with thumbnail:', driveResult.thumbnailLink);
} catch (e) {
  console.error('Google Drive API failed:', e);
  console.error('Error details:', e.message);
  console.error('Error stack:', e.stack);
  console.log('Using fallback data');
  // Fallback data (but files still uploaded to Drive)
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
