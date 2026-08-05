import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { errorResponse, handleApiError } from '@/lib/api-helpers';

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token || '';
    if (!/^[a-f0-9]{32}$/.test(token)) return errorResponse('כתובת לא תקינה', 400);
    const page = await prisma.salePage.findUnique({ where: { token } });
    if (!page || page.revoked || page.expiresAt < new Date() || !page.infocarData) {
      return errorResponse('הדוח אינו זמין', 404);
    }
    const match = page.infocarData.match(/^data:([a-z/]+);base64,(.+)$/s);
    if (!match) return errorResponse('הדוח אינו זמין', 404);
    const buf = Buffer.from(match[2], 'base64');
    return new NextResponse(buf, {
      headers: {
        'Content-Type': match[1],
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=300',
        'X-Robots-Tag': 'noindex',
      },
    });
  } catch (e) {
    return handleApiError(e);
  }
}
