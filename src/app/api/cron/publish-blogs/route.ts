import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function GET(request: Request) {
    // Verify cron secret (optional, for Vercel Cron)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Find scheduled blogs that are due for publishing
    const { data: blogs, error } = await supabase
        .from('blogs')
        .select('id')
        .eq('status', 'scheduled')
        .lte('scheduled_at', new Date().toISOString());

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!blogs || blogs.length === 0) {
        return NextResponse.json({ published: 0 });
    }

    // Publish each blog
    const ids = blogs.map(b => b.id);
    const { error: updateError } = await supabase
        .from('blogs')
        .update({
            status: 'published',
            published_at: new Date().toISOString(),
        })
        .in('id', ids);

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ published: ids.length, ids });
}
