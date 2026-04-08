import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface NewsItem {
    title: string;
    summary: string;
    category: string;
    sentiment: string;
    source: string;
    companyName: string | null;
}

interface IpoScore {
    companyName: string;
    ipoLikelihood: number;
    growthPotential: number;
    riskLevel: number;
    overallScore: number;
    aiSignals: string[];
}

interface EarningsItem {
    companyName: string;
    quarter: string;
    fiscalYear: string;
    revenue: number | null;
    pat: number | null;
    ebitda: number | null;
    eps: number | null;
    highlights: string;
}

interface ParsedData {
    news: NewsItem[];
    ipoScores: IpoScore[];
    earnings: EarningsItem[];
}

export async function POST(req: Request) {
    try {
        const { response } = await req.json();

        if (!response || typeof response !== 'string') {
            return Response.json({ error: 'No response text provided' }, { status: 400 });
        }

        // Extract JSON from the response (handle markdown code blocks)
        let jsonStr = response.trim();
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        let parsed: ParsedData;
        try {
            parsed = JSON.parse(jsonStr);
        } catch {
            return Response.json({ error: 'Could not parse JSON from response. Make sure you copied the full output.' }, { status: 400 });
        }

        // Fetch companies for name-to-id mapping
        const { data: companies } = await supabase.from('companies').select('id, name');
        const companyMap = new Map((companies || []).map(c => [c.name.toLowerCase(), c.id]));

        const findCompanyId = (name: string | null): string | null => {
            if (!name) return null;
            const lower = name.toLowerCase();
            // Exact match
            if (companyMap.has(lower)) return companyMap.get(lower)!;
            // Partial match
            for (const [key, id] of companyMap) {
                if (key.includes(lower) || lower.includes(key)) return id;
            }
            return null;
        };

        const results = { news: 0, ipoScores: 0, earnings: 0 };

        // Insert news
        if (parsed.news?.length) {
            const newsRows = parsed.news.map(n => ({
                title: n.title,
                summary: n.summary,
                category: n.category || 'general',
                sentiment: n.sentiment || 'neutral',
                source: n.source || null,
                company_id: findCompanyId(n.companyName),
                published_at: new Date().toISOString(),
            }));
            const { error } = await supabase.from('market_news').insert(newsRows);
            if (!error) results.news = newsRows.length;
        }

        // Upsert IPO scores
        if (parsed.ipoScores?.length) {
            for (const score of parsed.ipoScores) {
                const companyId = findCompanyId(score.companyName);
                if (!companyId) continue;
                const { error } = await supabase.from('ipo_scores').upsert({
                    company_id: companyId,
                    ipo_likelihood: score.ipoLikelihood,
                    growth_potential: score.growthPotential,
                    risk_level: score.riskLevel,
                    overall_score: score.overallScore,
                    ai_signals: score.aiSignals || [],
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'company_id' });
                if (!error) results.ipoScores++;
            }
        }

        // Upsert earnings
        if (parsed.earnings?.length) {
            for (const e of parsed.earnings) {
                const companyId = findCompanyId(e.companyName);
                if (!companyId) continue;
                const { error } = await supabase.from('earnings_data').upsert({
                    company_id: companyId,
                    quarter: e.quarter,
                    fiscal_year: e.fiscalYear,
                    revenue: e.revenue,
                    pat: e.pat,
                    ebitda: e.ebitda,
                    eps: e.eps,
                    highlights: e.highlights || '',
                    earnings_date: new Date().toISOString().split('T')[0],
                }, { onConflict: 'company_id,quarter,fiscal_year' });
                if (!error) results.earnings++;
            }
        }

        return Response.json({
            success: true,
            results,
            message: `Saved ${results.news} news, ${results.ipoScores} IPO scores, ${results.earnings} earnings records.`
        });
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
