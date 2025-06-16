
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all', 'public', 'private'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let whereClause = {};
    
    if (filter === 'public') {
      whereClause = { isPublic: true };
    } else if (filter === 'private') {
      whereClause = { isPublic: false };
    }

    const [uploads, total] = await Promise.all([
      prisma.upload.findMany({
        where: whereClause,
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.upload.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      uploads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching uploads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch uploads' },
      { status: 500 }
    );
  }
}
