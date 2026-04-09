import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
    const { companyId, forceRefresh } = await req.json();

    if (!companyId) {
        return Response.json({ error: 'companyId required' }, { status: 400 });
    }

    // Check for cached report (unless force refresh)
    if (!forceRefresh) {
        const { data: cached } = await supabase
            .from('company_deep_dives')
            .select('*')
            .eq('company_id', companyId)
            .single();

        if (cached) {
            const age = Date.now() - new Date(cached.generated_at).getTime();
            const threeDays = 3 * 24 * 60 * 60 * 1000;
            if (age < threeDays) {
                return Response.json({ report: cached.report_json, cached: true, generatedAt: cached.generated_at });
            }
        }
    }

    // Fetch all company data
    const { data: company } = await supabase.from('companies').select('*').eq('id', companyId).single();
    if (!company) {
        return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    // Fetch related data in parallel
    const [
        { data: earnings },
        { data: ipoScore },
        { data: news },
        { data: prices },
    ] = await Promise.all([
        supabase.from('earnings_data').select('*').eq('company_id', companyId).order('fiscal_year', { ascending: false }),
        supabase.from('ipo_scores').select('*').eq('company_id', companyId).single(),
        supabase.from('market_news').select('title, summary, sentiment, category, published_at').eq('company_id', companyId).order('published_at', { ascending: false }).limit(10),
        supabase.from('company_historical_prices').select('price_date, price_value').eq('company_id', companyId).order('price_date', { ascending: false }).limit(30),
    ]);

    // Build context
    const earningsStr = (earnings || []).map(e =>
        `${e.fiscal_year} ${e.quarter}: Rev ₹${e.revenue || 'N/A'}Cr, PAT ₹${e.pat || 'N/A'}Cr, EBITDA ₹${e.ebitda || 'N/A'}Cr, EPS ₹${e.eps || 'N/A'}`
    ).join('\n');

    const newsStr = (news || []).map(n => `[${n.sentiment}] ${n.title}`).join('\n');

    const priceStr = (prices || []).slice(0, 10).map(p =>
        `${p.price_date}: ₹${p.price_value}`
    ).join(', ');

    const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: `You are a senior equity research analyst writing an investment memo for an Indian unlisted/pre-IPO company. Write a comprehensive but structured research report.

Return ONLY valid JSON with this exact structure:
{
    "companyName": "string",
    "sector": "string",
    "date": "string (today's date)",
    "verdict": "BUY | HOLD | AVOID (one word)",
    "verdictReason": "1 sentence why",
    "executiveSummary": "3-4 sentences overview",
    "thesis": "2-3 paragraphs on investment thesis",
    "financialAnalysis": "2-3 paragraphs on financials, growth rates, profitability",
    "valuationAssessment": "1-2 paragraphs on current valuation vs peers, fair value estimate",
    "ipoOutlook": "1-2 paragraphs on IPO timeline, likelihood, catalysts",
    "riskFactors": ["risk 1", "risk 2", "risk 3", "risk 4"],
    "catalysts": ["catalyst 1", "catalyst 2", "catalyst 3"],
    "newsDigest": "2-3 sentences summarizing recent news sentiment",
    "priceTarget": "₹X - ₹Y (12-month range estimate)",
    "keyMetrics": {
        "revenue": "₹X Cr (latest)",
        "pat": "₹X Cr",
        "revenueGrowth": "X% YoY",
        "ipoLikelihood": "X/100",
        "riskRating": "Low/Medium/High"
    }
}

Use ₹, Cr, Lakh as units. Be specific with numbers. No disclaimers. Sound like a Bloomberg analyst, not an AI.`,
        prompt: `Company: ${company.name}
Sector: ${company.sector}
Status: ${company.status}
Valuation: ₹${company.valuation} Cr
Ask Price: ₹${company.current_ask_price}
Bid Price: ₹${company.current_bid_price}
P/E: ${company.pe_ratio || 'N/A'}, P/B: ${company.pb_ratio || 'N/A'}, D/E: ${company.debt_to_equity || 'N/A'}, ROE: ${company.roe || 'N/A'}%
Market Cap: ₹${company.market_cap || 'N/A'} Cr
52W High: ₹${company.week_52_high || 'N/A'}, 52W Low: ₹${company.week_52_low || 'N/A'}
${company.ai_context ? `AI Context: ${company.ai_context}` : `Description: ${company.description}`}

Earnings History:
${earningsStr || 'No earnings data available'}

IPO Score: ${ipoScore ? `Likelihood ${ipoScore.ipo_likelihood}/100, Growth ${ipoScore.growth_potential}/100, Risk ${ipoScore.risk_level}/100. Signals: ${(ipoScore.ai_signals || []).join(', ')}` : 'No IPO score'}

Recent News:
${newsStr || 'No recent news'}

Recent Prices: ${priceStr || 'No price history'}`,
    });

    // Parse response
    let report;
    try {
        const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        report = match ? JSON.parse(match[0]) : JSON.parse(cleaned);
    } catch {
        return Response.json({ error: 'Failed to generate report', raw: text }, { status: 500 });
    }

    // Cache the report
    await supabase.from('company_deep_dives').upsert({
        company_id: companyId,
        report_json: report,
        generated_at: new Date().toISOString(),
    }, { onConflict: 'company_id' });

    return Response.json({ report, cached: false, generatedAt: new Date().toISOString() });
}
