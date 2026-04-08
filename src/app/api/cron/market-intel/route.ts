import { NextRequest } from 'next/server';

export const maxDuration = 60;

export async function GET(req: NextRequest) {
    // Verify cron secret (Vercel sets this automatically)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Call the auto-fetch route which checks if admin already updated today
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000';

        const res = await fetch(`${baseUrl}/api/admin/market-intel/auto-fetch`, {
            method: 'POST',
        });

        const data = await res.json();
        return Response.json(data);
    } catch (error: any) {
        console.error('Cron market-intel error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
