
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

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);

    // Upload to Google Drive
    const driveResult = await googleDriveService.uploadFile(
      buffer,
      uniqueFilename,
      file.type,
      isPublic
    );

    // Save to database
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
