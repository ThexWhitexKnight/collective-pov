import { NextResponse } from 'next/server';
import { isGoogleDriveConfigured } from '@/lib/config';

export async function GET() {
  try {
    const isConfigured = isGoogleDriveConfigured();
    
    return NextResponse.json({
      googleDriveConfigured: isConfigured,
      status: isConfigured ? 'ready' : 'setup_required'
    });
  } catch (error) {
    console.error('Error checking configuration:', error);
    return NextResponse.json(
      { error: 'Failed to check configuration' },
      { status: 500 }
    );
  }
}
