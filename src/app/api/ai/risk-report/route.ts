import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const maxDuration = 30;

export async function POST(req: Request) {
    const { userId } = await req.json();

    if (!userId) {
        return Response.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = await createClient(cookies());

    // Fetch user orders
    const { data: orders } = await supabase
        .from('orders')
        .select('*, companies(name, sector, current_ask_price, valuation, status, pe_ratio, debt_to_equity, roe)')
        .eq('user_id', userId)
        .eq('status', 'in_holding');

    if (!orders || orders.length === 0) {
        return Response.json({ analysis: 'No holdings to analyze. Start investing to get your AI risk report.' });
    }

    // Build holdings
    const holdings: Record<string, any> = {};
    orders.forEach(o => {
        const c = o.companies;
        if (!holdings[o.company_id]) {
            holdings[o.company_id] = {
                name: c?.name || 'Unknown',
                sector: c?.sector || 'Unknown',
                status: c?.status,
                askPrice: c?.current_ask_price || o.price,
                valuation: c?.valuation,
                peRatio: c?.pe_ratio,
                debtToEquity: c?.debt_to_equity,
                roe: c?.roe,
                qty: 0,
                invested: 0,
            };
        }
        holdings[o.company_id].qty += o.quantity;
        holdings[o.company_id].invested += o.price * o.quantity;
    });

    const holdingsList = Object.values(holdings);
    const totalInvested = holdingsList.reduce((s: number, h: any) => s + h.invested, 0);

    // Build portfolio data string
    const portfolioStr = holdingsList.map((h: any) => {
        const pct = ((h.invested / totalInvested) * 100).toFixed(1);
        return `${h.name} (${h.sector}, ${h.status}): ${pct}% of portfolio, ₹${h.invested.toLocaleString()} invested, ${h.qty} shares @ ₹${h.askPrice}, Val ₹${h.valuation}Cr, P/E ${h.peRatio ?? 'N/A'}, D/E ${h.debtToEquity ?? 'N/A'}, ROE ${h.roe ?? 'N/A'}%`;
    }).join('\n');

    // Fetch IPO scores for held companies
    const companyIds = Object.keys(holdings);
    const { data: ipoScores } = await supabase
        .from('ipo_scores')
        .select('company_id, ipo_likelihood, growth_potential, risk_level')
        .in('company_id', companyIds);

    const ipoStr = (ipoScores || []).map(s => {
        const name = holdings[s.company_id]?.name || 'Unknown';
        return `${name}: IPO Likelihood ${s.ipo_likelihood}/100, Growth ${s.growth_potential}/100, Risk ${s.risk_level}/100`;
    }).join('\n');

    const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: `You are a senior portfolio risk analyst for an Indian unlisted shares platform. Write a detailed but structured risk report in 250-350 words.

Structure EXACTLY as:
**RISK SCORE: X/100** (compute based on concentration, liquidity, sector risk)

**Concentration Risk:**
(analyze single-stock and sector concentration)

**Liquidity Risk:**
(unlisted shares are illiquid — assess based on stage, valuation, IPO likelihood)

**Valuation Risk:**
(assess P/E, debt levels, ROE relative to sector norms)

**Key Recommendations:**
(3-4 bullet points, actionable, specific to this portfolio)

Use ₹, Cr. Be direct and specific. No disclaimers. Reference actual holdings by name.`,
        prompt: `Portfolio (Total: ₹${totalInvested.toLocaleString()}, ${holdingsList.length} companies, ${new Set(holdingsList.map((h: any) => h.sector)).size} sectors):\n${portfolioStr}\n\nIPO Intelligence:\n${ipoStr || 'No IPO data available'}`,
    });

    return Response.json({ analysis: text });
}
