import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { tavily } from '@tavily/core';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 120;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY! });

// Refresh intervals
const TRENDING_REFRESH_DAYS = 7;
const NORMAL_REFRESH_DAYS = 25;

function isStale(updatedAt: string | null, isFeatured: boolean): boolean {
    if (!updatedAt) return true;
    const maxAgeDays = isFeatured ? TRENDING_REFRESH_DAYS : NORMAL_REFRESH_DAYS;
    const age = Date.now() - new Date(updatedAt).getTime();
    return age > maxAgeDays * 24 * 60 * 60 * 1000;
}

export async function POST(req: Request) {
    try {
        const url = new URL(req.url);
        const force = url.searchParams.get('force') === 'true';
        // Admin can target specific companies by ID (comma-separated)
        const targetIds = url.searchParams.get('companies')?.split(',').filter(Boolean);

        let query = supabase
            .from('companies')
            .select('id, name, sector, valuation, status, current_ask_price, current_bid_price, description, is_featured, updated_at, ai_context');

        if (targetIds && targetIds.length > 0) {
            query = query.in('id', targetIds);
        }

        const { data: companies } = await query;

        if (!companies || companies.length === 0) {
            return Response.json({ error: 'No companies found' }, { status: 400 });
        }

        // Filter to only companies that need a refresh (unless force=true)
        const toProcess = force
            ? companies
            : companies.filter(c => !c.ai_context || isStale(c.updated_at, c.is_featured));

        if (toProcess.length === 0) {
            return Response.json({
                success: true,
                message: 'All companies are up to date. Use ?force=true to regenerate.',
                skipped: companies.length,
                results: [],
            });
        }

        const results: { company: string; status: string; featured: boolean }[] = [];

        // Process companies in batches of 3 to stay within rate limits
        for (let i = 0; i < toProcess.length; i += 3) {
            const batch = toProcess.slice(i, i + 3);

            const batchResults = await Promise.allSettled(
                batch.map(company => generateContextForCompany(company))
            );

            for (let j = 0; j < batch.length; j++) {
                const result = batchResults[j];
                if (result.status === 'fulfilled') {
                    results.push({ company: batch[j].name, status: result.value, featured: batch[j].is_featured });
                } else {
                    console.error(`Failed for ${batch[j].name}:`, result.reason);
                    results.push({ company: batch[j].name, status: `error: ${result.reason?.message || 'unknown'}`, featured: batch[j].is_featured });
                }
            }
        }

        const updated = results.filter(r => r.status === 'updated').length;
        const skipped = companies.length - toProcess.length;
        return Response.json({
            success: true,
            message: `Generated ai_context for ${updated}/${toProcess.length} companies. ${skipped} skipped (still fresh).`,
            results,
            skipped,
        });
    } catch (error: any) {
        console.error('Generate context error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

async function generateContextForCompany(company: any): Promise<string> {
    // 1. Fetch existing IPO scores
    const { data: ipoScore } = await supabase
        .from('ipo_scores')
        .select('*')
        .eq('company_id', company.id)
        .single();

    // 2. Fetch existing earnings data (latest 4 quarters)
    const { data: earnings } = await supabase
        .from('earnings_data')
        .select('*')
        .eq('company_id', company.id)
        .order('fiscal_year', { ascending: false })
        .order('quarter', { ascending: false })
        .limit(4);

    // 3. Fetch recent news for this company
    const { data: recentNews } = await supabase
        .from('market_news')
        .select('title, summary, sentiment, category')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
        .limit(5);

    // 4. Fresh Tavily search for this company
    let tavilyContext = '';
    try {
        const searchResults = await tavilyClient.search(
            `${company.name} India unlisted shares pre-IPO latest news financials 2026`,
            { maxResults: 5, searchDepth: 'basic' }
        );
        tavilyContext = searchResults.results
            .map((r: any) => `- ${r.title}: ${r.content?.slice(0, 300)}`)
            .join('\n');
    } catch (err) {
        console.warn(`Tavily search failed for ${company.name}, continuing with DB data`);
    }

    // 5. Build the prompt with all available data
    let dataContext = `COMPANY: ${company.name}
Sector: ${company.sector}
Valuation: ₹${company.valuation} Cr
Status: ${company.status}
Ask Price: ₹${company.current_ask_price} | Bid Price: ₹${company.current_bid_price}
Description: ${company.description || 'N/A'}`;

    if (ipoScore) {
        dataContext += `\n\nIPO SCORE DATA:
- IPO Likelihood: ${ipoScore.ipo_likelihood}/100
- Growth Potential: ${ipoScore.growth_potential}/100
- Risk Level: ${ipoScore.risk_level}/100 (100 = safest)
- Overall Score: ${ipoScore.overall_score}/100
- AI Signals: ${JSON.stringify(ipoScore.ai_signals)}`;
    }

    if (earnings && earnings.length > 0) {
        dataContext += `\n\nEARNINGS DATA (Recent Quarters):`;
        for (const e of earnings) {
            dataContext += `\n- ${e.quarter} ${e.fiscal_year}: Revenue ₹${e.revenue || '?'} Cr, PAT ₹${e.pat || '?'} Cr, EBITDA ₹${e.ebitda || '?'} Cr, EPS ₹${e.eps || '?'}`;
            if (e.highlights) dataContext += ` | ${e.highlights}`;
        }
    }

    if (recentNews && recentNews.length > 0) {
        dataContext += `\n\nRECENT NEWS:`;
        for (const n of recentNews) {
            dataContext += `\n- [${n.sentiment}] ${n.title}: ${n.summary}`;
        }
    }

    if (tavilyContext) {
        dataContext += `\n\nLATEST WEB INTELLIGENCE:\n${tavilyContext}`;
    }

    // 6. Generate ai_context using Groq
    const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        prompt: `You are an elite unlisted shares research analyst. Based on ALL the data below, write a comprehensive AI intelligence brief for "${company.name}".

${dataContext}

Write a dense, insight-packed brief (300-500 words) covering:
1. **Company Overview** — what they do, market position, competitive moat
2. **Financial Health** — revenue trends, profitability, key metrics from earnings
3. **IPO Outlook** — likelihood, timeline signals, DRHP/SEBI status if known
4. **Investment Thesis** — bull case vs bear case, key risks
5. **Recent Developments** — latest news, partnerships, regulatory changes
6. **Price Action** — current secondary market pricing context

RULES:
- Be specific with numbers and data points — no vague statements
- If data is missing for a section, note it briefly and move on
- Write in professional analyst tone — direct, no fluff
- This will be injected as context for an AI chatbot, so make it information-dense
- Do NOT use markdown headers — use plain text with clear section labels
- Include a 1-line "TLDR" at the top summarizing the investment case`,
    });

    // 7. Update the company's ai_context
    const { error } = await supabase
        .from('companies')
        .update({
            ai_context: text.trim(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', company.id);

    if (error) throw new Error(`DB update failed: ${error.message}`);

    return 'updated';
}
