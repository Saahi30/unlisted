import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
    const { companyId, userId, scenarioType, multiplier, customParams } = await req.json();

    if (!companyId) {
        return Response.json({ error: 'companyId required' }, { status: 400 });
    }

    // Fetch company data
    const { data: company } = await supabase.from('companies').select('*').eq('id', companyId).single();
    if (!company) {
        return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    // Fetch user holdings if userId provided
    let userHoldings: any = null;
    if (userId) {
        const { data: orders } = await supabase
            .from('orders')
            .select('quantity, price')
            .eq('user_id', userId)
            .eq('company_id', companyId)
            .eq('status', 'in_holding');

        if (orders && orders.length > 0) {
            const totalQty = orders.reduce((s, o) => s + o.quantity, 0);
            const totalInvested = orders.reduce((s, o) => s + (o.quantity * Number(o.price)), 0);
            userHoldings = { quantity: totalQty, invested: totalInvested, avgPrice: totalInvested / totalQty };
        }
    }

    const currentPrice = Number(company.current_ask_price);
    const mult = multiplier || 2;
    const projectedPrice = currentPrice * mult;

    // Calculate financial projections
    const projection = {
        currentPrice,
        projectedPrice,
        multiplier: mult,
        priceChange: ((mult - 1) * 100).toFixed(1),
        currentMarketCap: company.valuation,
        projectedMarketCap: Math.round(company.valuation * mult),
    };

    // User-specific impact
    let userImpact = null;
    if (userHoldings) {
        const currentValue = userHoldings.quantity * currentPrice;
        const projectedValue = userHoldings.quantity * projectedPrice;
        const gain = projectedValue - userHoldings.invested;

        // Tax calculation (Indian capital gains)
        const holdingPeriod = 'long'; // simplified
        const taxRate = holdingPeriod === 'long' ? 0.125 : 0.20; // LTCG 12.5% for unlisted, STCG 20%
        const taxableGain = Math.max(0, gain);
        const tax = taxableGain * taxRate;

        userImpact = {
            quantity: userHoldings.quantity,
            invested: userHoldings.invested,
            avgPrice: userHoldings.avgPrice,
            currentValue,
            projectedValue,
            absoluteGain: gain,
            percentGain: ((gain / userHoldings.invested) * 100).toFixed(1),
            estimatedTax: Math.round(tax),
            netGain: Math.round(gain - tax),
            taxRate: `${(taxRate * 100).toFixed(1)}%`,
        };
    }

    // Generate AI narrative
    const { text: narrative } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: `You are a sharp financial scenario analyst. Write a 100-150 word analysis of a what-if scenario for an unlisted company. Be specific with numbers. Include: 1) Whether this scenario is realistic, 2) What would need to happen for this, 3) Timeline estimate, 4) Key risk in this scenario. Use ₹, Cr. No disclaimers. Be direct.`,
        prompt: `What if ${company.name} (${company.sector}, currently valued at ₹${company.valuation}Cr, price ₹${currentPrice}) ${scenarioType === 'ipo' ? `IPOs at ${mult}x current valuation (₹${Math.round(company.valuation * mult)}Cr)?` : `sees a ${mult}x valuation change to ₹${Math.round(company.valuation * mult)}Cr, price moving to ₹${projectedPrice}?`}${userHoldings ? ` The investor holds ${userHoldings.quantity} shares with ₹${userHoldings.invested.toLocaleString()} invested.` : ''}`,
    });

    // Save simulation if user is logged in
    if (userId) {
        await supabase.from('whatif_simulations').insert({
            user_id: userId,
            company_id: companyId,
            scenario_type: scenarioType || 'valuation_change',
            parameters: { multiplier: mult, customParams },
            result_json: { projection, userImpact, narrative },
        });
    }

    return Response.json({ projection, userImpact, narrative, company: { name: company.name, sector: company.sector } });
}
