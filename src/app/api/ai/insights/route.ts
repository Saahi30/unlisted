import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const maxDuration = 30;

// Shared AI insights endpoint — handles compare, digest, sentiment, search
// Uses compact prompts + pre-computed data to minimize token usage

export async function POST(req: Request) {
    const body = await req.json();
    const { type } = body;

    try {
        switch (type) {
            case 'compare':
                return handleCompare(body);
            case 'digest':
                return handleDigest(body);
            case 'sentiment':
                return handleSentiment(body);
            case 'search':
                return handleSearch(body);
            default:
                return Response.json({ error: 'Invalid type' }, { status: 400 });
        }
    } catch (err: any) {
        console.error('AI insights error:', err);
        return Response.json({ error: err.message || 'AI generation failed' }, { status: 500 });
    }
}

// ── Compare: narrative comparison of 2-3 companies ──
async function handleCompare(body: any) {
    const { companies } = body; // array of { name, sector, valuation, askPrice, bidPrice, peRatio, pbRatio, roe, debtToEquity, marketCap, financials }

    if (!companies || companies.length < 2) {
        return Response.json({ error: 'Need at least 2 companies' }, { status: 400 });
    }

    // Build minimal data string
    const dataStr = companies.map((c: any) =>
        `${c.name} (${c.sector}): Val ₹${c.valuation}Cr, Ask ₹${c.askPrice}, P/E ${c.peRatio ?? 'N/A'}, ROE ${c.roe ?? 'N/A'}%, D/E ${c.debtToEquity ?? 'N/A'}, MCap ₹${c.marketCap ?? 'N/A'}Cr` +
        (c.financials ? `, Rev ₹${c.financials.revenue ?? 'N/A'}Cr, PAT ₹${c.financials.pat ?? 'N/A'}Cr, EBITDA ₹${c.financials.ebitda ?? 'N/A'}Cr, EPS ₹${c.financials.eps ?? 'N/A'}` : '')
    ).join('\n');

    const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: `You are a concise Indian equity analyst. Compare unlisted companies in 150-200 words. Structure: 1) One-line verdict, 2) Key strengths of each, 3) Risk comparison, 4) Which suits what investor type. Use ₹, Cr. No disclaimers. No markdown headers.`,
        prompt: dataStr,
    });

    return Response.json({ analysis: text });
}

// ── Digest: personalized weekly AI summary ──
async function handleDigest(body: any) {
    const { portfolio, movers, weeklyChange, totalPnL, totalPnLPct, activeOrders, sectors } = body;
    // portfolio: array of { name, qty, invested, currentPrice, weekChange }
    // movers: top 3 movers with weekChange %

    if (!portfolio || portfolio.length === 0) {
        return Response.json({ analysis: 'Start investing to get your personalized AI digest. Browse our catalog to find high-growth unlisted companies.' });
    }

    const dataStr = [
        `Weekly: ${weeklyChange >= 0 ? '+' : ''}${weeklyChange.toFixed(2)}%, P&L: ${totalPnL >= 0 ? '+' : ''}₹${Math.abs(totalPnL).toLocaleString()} (${totalPnLPct >= 0 ? '+' : ''}${totalPnLPct.toFixed(1)}%), Active Orders: ${activeOrders}`,
        `Sectors: ${sectors.join(', ')}`,
        `Holdings: ${portfolio.map((h: any) => `${h.name} ${h.qty}sh ₹${h.currentPrice} (${h.weekChange >= 0 ? '+' : ''}${h.weekChange.toFixed(1)}%)`).join(', ')}`,
    ].join('\n');

    const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: `You are a portfolio advisor for an Indian unlisted shares platform. Write a crisp 120-150 word weekly briefing. Structure: 1) Portfolio pulse (1-2 lines), 2) Top mover insight, 3) One risk flag if any, 4) One actionable suggestion. Tone: sharp, professional. Use ₹, Cr. No disclaimers.`,
        prompt: dataStr,
    });

    return Response.json({ analysis: text });
}

// ── Sentiment: AI summary of news sentiment for companies ──
async function handleSentiment(body: any) {
    const { companyId, companyName } = body;

    const supabase = await createClient(cookies());

    // Fetch recent news for this company
    const query = supabase
        .from('market_news')
        .select('title, summary, sentiment, category, published_at')
        .order('published_at', { ascending: false })
        .limit(10);

    if (companyId) {
        query.eq('company_id', companyId);
    }

    const { data: news } = await query;

    if (!news || news.length === 0) {
        return Response.json({
            analysis: `No recent news data available${companyName ? ` for ${companyName}` : ''}. Check back after the next market intelligence update.`,
            stats: { bullish: 0, bearish: 0, neutral: 0 },
        });
    }

    const stats = {
        bullish: news.filter(n => n.sentiment === 'bullish').length,
        bearish: news.filter(n => n.sentiment === 'bearish').length,
        neutral: news.filter(n => n.sentiment === 'neutral').length,
    };

    const newsStr = news.map(n => `[${n.sentiment}] ${n.title}`).join('\n');

    const { text } = await generateText({
        model: groq('openai/gpt-oss-20b'),
        system: `You are a market sentiment analyst. Summarize news sentiment in 80-100 words. Structure: 1) Overall mood (1 line), 2) Key bullish/bearish drivers, 3) Outlook. Be direct. No disclaimers.`,
        prompt: `${companyName ? `Company: ${companyName}\n` : 'Market-wide\n'}Recent headlines:\n${newsStr}`,
    });

    return Response.json({ analysis: text, stats });
}

// ── Search: natural language → filters + AI summary ──
async function handleSearch(body: any) {
    const { query, sectors, priceRange, companies } = body;
    // sectors: available sector names, priceRange: { min, max } of all companies
    // companies: array of { name, sector, status, valuation, price, description }

    const supabase = await createClient(cookies());

    // Fetch IPO scores and sentiment data to enrich search context
    const [{ data: ipoScores }, { data: recentNews }] = await Promise.all([
        supabase.from('ipo_scores').select('company_id, ipo_likelihood, growth_potential, risk_level, overall_score, ai_signals'),
        supabase.from('market_news').select('company_id, sentiment').order('published_at', { ascending: false }).limit(100),
    ]);

    // Build sentiment map per company
    const sentimentMap: Record<string, { bullish: number; bearish: number; neutral: number }> = {};
    (recentNews || []).forEach((n: any) => {
        if (!n.company_id) return;
        if (!sentimentMap[n.company_id]) sentimentMap[n.company_id] = { bullish: 0, bearish: 0, neutral: 0 };
        if (n.sentiment === 'bullish') sentimentMap[n.company_id].bullish++;
        else if (n.sentiment === 'bearish') sentimentMap[n.company_id].bearish++;
        else sentimentMap[n.company_id].neutral++;
    });

    // Build IPO score map
    const ipoMap: Record<string, any> = {};
    (ipoScores || []).forEach((s: any) => { ipoMap[s.company_id] = s; });

    // Build compact catalog: name + scores only (~15 tokens per company)
    const catalogStr = (companies || []).map((c: any) => {
        const ipo = ipoMap[c.id];
        const sent = sentimentMap[c.id];
        let line = `${c.name}|${c.sector}|${c.status}|${c.price}`;
        if (ipo) line += `|I${ipo.ipo_likelihood}G${ipo.growth_potential}R${ipo.risk_level}`;
        if (sent) {
            const total = sent.bullish + sent.bearish + sent.neutral;
            if (total > 0) line += `|${sent.bullish}b${sent.bearish}r`;
        }
        return line;
    }).join('\n');

    const { text } = await generateText({
        model: groq('openai/gpt-oss-20b'),
        system: `Translate investment queries into JSON filters. Sectors: ${(sectors || []).join(', ')}. Prices: ₹${priceRange?.min || 0}-${priceRange?.max || 999999}. Statuses: pre_seed,seed,series_a,series_b,series_c,pre_ipo.

Catalog (Name|Sector|Status|Price|I=IPO G=Growth R=Risk scores 1-10|Sentiment b=bull r=bear):
${catalogStr}

Return ONLY JSON. Optional fields: sectors[], maxPrice, minPrice, minValuation, maxValuation, sortBy("valuation"|"price"), sortDir("asc"|"desc"), keywords[], statuses[], sentiment("bullish"|"bearish"), minIpoScore, minGrowthScore, maxRiskLevel, matchedCompanies[] (EXACT names from catalog for semantic matches), summary (1 sentence, only for ambiguous queries).
Prefer matchedCompanies over keywords. Omit irrelevant fields.`,
        prompt: query,
    });

    // Parse the JSON from the response
    try {
        const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const filters = JSON.parse(cleaned);
        return Response.json({ filters });
    } catch {
        return Response.json({ filters: { keywords: [query] } });
    }
}
