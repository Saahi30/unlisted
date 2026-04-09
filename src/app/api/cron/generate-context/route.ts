import { NextRequest } from 'next/server';

export const maxDuration = 120;

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

        const res = await fetch(`${baseUrl}/api/admin/market-intel/generate-context`, {
            method: 'POST',
        });

        const data = await res.json();
        return Response.json(data);
    } catch (error: any) {
        console.error('Cron generate-context error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
