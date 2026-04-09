import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
    const { userId } = await req.json();

    if (!userId) {
        return Response.json({ error: 'userId required' }, { status: 400 });
    }

    // Fetch latest benchmark snapshot
    const { data: benchmark } = await supabase
        .from('peer_benchmarks')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

    // Fetch user's portfolio
    const { data: orders } = await supabase
        .from('orders')
        .select('company_id, quantity, price, companies(name, sector)')
        .eq('user_id', userId)
        .eq('status', 'in_holding');

    if (!orders || orders.length === 0) {
        return Response.json({
            benchmark: benchmark || null,
            userStats: null,
            analysis: 'Start investing to see how your portfolio compares to other investors on ShareSaathi.',
        });
    }

    // Build user stats
    const userCompanies = new Set(orders.map(o => o.company_id));
    const userSectors: Record<string, number> = {};
    let totalInvested = 0;

    orders.forEach(o => {
        const invested = Number(o.price) * o.quantity;
        totalInvested += invested;
        const sector = (o.companies as any)?.sector || 'Unknown';
        userSectors[sector] = (userSectors[sector] || 0) + invested;
    });

    const userSectorPcts: Record<string, number> = {};
    Object.entries(userSectors).forEach(([sector, amount]) => {
        userSectorPcts[sector] = Math.round((amount / totalInvested) * 100);
    });

    const userStats = {
        totalInvested,
        companiesHeld: userCompanies.size,
        sectors: userSectorPcts,
        diversificationLevel: userCompanies.size <= 2 ? 'low' : userCompanies.size <= 5 ? 'medium' : 'high',
    };

    // Generate AI comparison if we have benchmark data
    let analysis = '';
    if (benchmark) {
        const { text } = await generateText({
            model: groq('llama-3.3-70b-versatile'),
            system: `You are a portfolio benchmarking analyst. Compare a user's portfolio to peer averages. Write 120-150 words. Structure: 1) How they compare (above/below average), 2) Key difference in allocation, 3) One strength, 4) One improvement suggestion. Use ₹, Cr. Be direct and specific. No disclaimers.`,
            prompt: `USER PORTFOLIO:
- Invested: ₹${totalInvested.toLocaleString()}
- Companies: ${userCompanies.size}
- Sectors: ${Object.entries(userSectorPcts).map(([s, p]) => `${s} ${p}%`).join(', ')}
- Diversification: ${userStats.diversificationLevel}

PEER AVERAGES (${benchmark.total_investors} investors):
- Avg Portfolio: ₹${benchmark.avg_portfolio_size.toLocaleString()}
- Avg Holdings: ${benchmark.avg_holdings_count} companies
- Sector Split: ${Object.entries(benchmark.sector_distribution as Record<string, number>).map(([s, p]) => `${s} ${p}%`).join(', ')}
- Diversification: Low ${(benchmark.diversification_scores as any).low}, Med ${(benchmark.diversification_scores as any).medium}, High ${(benchmark.diversification_scores as any).high}
- Top Companies: ${((benchmark.top_companies as any[]) || []).slice(0, 5).map((c: any) => `${c.name} (${c.investorPct}% hold)`).join(', ')}`,
        });
        analysis = text;
    } else {
        analysis = 'Peer benchmark data is being compiled. Check back after the next weekly snapshot.';
    }

    return Response.json({ benchmark, userStats, analysis });
}
