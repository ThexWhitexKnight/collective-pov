
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { googleDriveService } from '@/lib/google-drive';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const upload = await prisma.upload.findUnique({
      where: { id: params.id },
    });

    if (!upload) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    // Delete from Google Drive
    await googleDriveService.deleteFile(upload.driveFileId);

    // Delete from database
    await prisma.upload.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting upload:', error);
    return NextResponse.json(
      { error: 'Failed to delete upload' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const upload = await prisma.upload.findUnique({
      where: { id: params.id },
    });

    if (!upload) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ upload });
  } catch (error) {
    console.error('Error fetching upload:', error);
    return NextResponse.json(
      { error: 'Failed to fetch upload' },
      { status: 500 }
    );
  }
}
