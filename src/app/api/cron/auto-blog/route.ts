import { NextRequest } from 'next/server';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Check if we already auto-generated a blog today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { count: todayBlogs } = await supabase
            .from('blogs')
            .select('*', { count: 'exact', head: true })
            .eq('auto_generated', true)
            .gte('created_at', todayStart.toISOString());

        if (todayBlogs && todayBlogs > 0) {
            return Response.json({ skipped: true, message: 'Already auto-generated a blog today.' });
        }

        // Step 1: Find trending companies (most news + highest price movement)
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

        // Get news counts per company in last 7 days
        const { data: newsCounts } = await supabase
            .from('market_news')
            .select('company_id')
            .gte('published_at', sevenDaysAgo)
            .not('company_id', 'is', null);

        const newsCountMap: Record<string, number> = {};
        (newsCounts || []).forEach(n => {
            if (n.company_id) newsCountMap[n.company_id] = (newsCountMap[n.company_id] || 0) + 1;
        });

        // Get companies with recent price history
        const { data: companies } = await supabase
            .from('companies')
            .select('id, name, sector, valuation, current_ask_price, status, description');

        if (!companies || companies.length === 0) {
            return Response.json({ skipped: true, message: 'No companies found.' });
        }

        // Score companies by trending-ness
        const scored = companies.map(c => {
            const newsScore = (newsCountMap[c.id] || 0) * 10;
            const stageScore = c.status === 'pre_ipo' ? 20 : c.status === 'series_c' ? 10 : 0;
            const valuationScore = c.valuation >= 50000 ? 15 : c.valuation >= 20000 ? 10 : 5;
            return { ...c, trendingScore: newsScore + stageScore + valuationScore };
        }).sort((a, b) => b.trendingScore - a.trendingScore);

        // Pick top trending company
        const trending = scored[0];
        if (!trending || trending.trendingScore < 10) {
            return Response.json({ skipped: true, message: 'No sufficiently trending company found.' });
        }

        // Fetch recent news for context
        const { data: recentNews } = await supabase
            .from('market_news')
            .select('title, summary, sentiment')
            .eq('company_id', trending.id)
            .order('published_at', { ascending: false })
            .limit(5);

        // Fetch IPO score
        const { data: ipoScore } = await supabase
            .from('ipo_scores')
            .select('*')
            .eq('company_id', trending.id)
            .single();

        const newsContext = (recentNews || []).map(n => `[${n.sentiment}] ${n.title}: ${n.summary || ''}`).join('\n');

        // Step 2: Generate the blog
        const { text } = await generateText({
            model: groq('llama-3.3-70b-versatile'),
            temperature: 0.7,
            system: `You are a senior equity research analyst and financial journalist specializing in the Indian unlisted and pre-IPO markets.
Write a high-impact, professional, analytical blog post for ShareSaathi.

**CRITICAL: DO NOT LOOK LIKE AI.**
- NEVER use generic AI phrases like "In the ever-evolving landscape," "Buckle up," "Let's dive in."
- Use technical financial terminology correctly.
- Maintain a sophisticated, skeptical, yet opportunistic tone. Think Bloomberg or The Ken.

Structure your response as a JSON object with:
- title: A sharp, news-driven title
- excerpt: A 2-sentence sophisticated summary
- content: The full article (~600 words). Use "\\n" for line breaks in JSON strings.
- slug: A URL-friendly slug

For the article: Start punchy. Include sections on 'The Thesis', 'Valuation Mechanics', 'Risk Assessment'. Sound like a human expert from Dalal Street.`,
            prompt: `Write about: ${trending.name} (${trending.sector}, ${trending.status}, Valuation ₹${trending.valuation}Cr, Price ₹${trending.current_ask_price}).
${ipoScore ? `IPO Likelihood: ${ipoScore.ipo_likelihood}/100, Growth: ${ipoScore.growth_potential}/100, Risk: ${ipoScore.risk_level}/100. AI Signals: ${(ipoScore.ai_signals || []).join(', ')}` : ''}
Recent News:\n${newsContext || 'No recent news'}
Company Description: ${trending.description || 'N/A'}

Output ONLY valid JSON.`,
        });

        // Parse the generated blog
        let blogData;
        try {
            const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            const match = cleaned.match(/\{[\s\S]*\}/);
            blogData = match ? JSON.parse(match[0]) : JSON.parse(cleaned);
        } catch {
            return Response.json({ error: 'Failed to parse generated blog', raw: text }, { status: 500 });
        }

        // Step 3: Insert as scheduled blog (admin can review before publishing)
        const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h from now

        const { data: blog, error } = await supabase.from('blogs').insert({
            title: blogData.title,
            slug: blogData.slug || blogData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            excerpt: blogData.excerpt,
            content: blogData.content,
            status: 'scheduled',
            scheduled_at: scheduledAt,
            auto_generated: true,
            generation_source: 'auto_trending',
            trending_score: trending.trendingScore,
            author: 'ShareSaathi AI',
        }).select('id, title, slug').single();

        if (error) {
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
            success: true,
            blog: {
                id: blog?.id,
                title: blog?.title,
                slug: blog?.slug,
                trendingCompany: trending.name,
                trendingScore: trending.trendingScore,
                scheduledFor: scheduledAt,
                message: `Auto-generated blog about ${trending.name}. Scheduled for ${new Date(scheduledAt).toLocaleDateString()}. Admin can approve or edit before publishing.`,
            },
        });
    } catch (error: any) {
        console.error('Auto-blog cron error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
