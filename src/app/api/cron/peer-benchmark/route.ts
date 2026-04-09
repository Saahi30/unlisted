import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

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
        // Fetch all settled orders with company info
        const { data: orders } = await supabase
            .from('orders')
            .select('user_id, company_id, quantity, price, companies(name, sector)')
            .eq('status', 'in_holding');

        if (!orders || orders.length === 0) {
            return Response.json({ skipped: true, message: 'No holdings data to benchmark.' });
        }

        // Build per-user portfolio stats
        const userPortfolios: Record<string, { totalInvested: number; companies: Set<string>; sectors: Record<string, number> }> = {};

        orders.forEach(o => {
            if (!userPortfolios[o.user_id]) {
                userPortfolios[o.user_id] = { totalInvested: 0, companies: new Set(), sectors: {} };
            }
            const invested = Number(o.price) * o.quantity;
            userPortfolios[o.user_id].totalInvested += invested;
            userPortfolios[o.user_id].companies.add(o.company_id);
            const sector = (o.companies as any)?.sector || 'Unknown';
            userPortfolios[o.user_id].sectors[sector] = (userPortfolios[o.user_id].sectors[sector] || 0) + invested;
        });

        const users = Object.values(userPortfolios);
        const totalInvestors = users.length;

        if (totalInvestors === 0) {
            return Response.json({ skipped: true, message: 'No investors to benchmark.' });
        }

        // Compute aggregates
        const avgPortfolioSize = users.reduce((s, u) => s + u.totalInvested, 0) / totalInvestors;
        const avgHoldings = users.reduce((s, u) => s + u.companies.size, 0) / totalInvestors;

        // Sector distribution (aggregate across all users)
        const sectorTotals: Record<string, number> = {};
        users.forEach(u => {
            Object.entries(u.sectors).forEach(([sector, amount]) => {
                sectorTotals[sector] = (sectorTotals[sector] || 0) + amount;
            });
        });
        const totalAllInvested = Object.values(sectorTotals).reduce((s, v) => s + v, 0);
        const sectorDistribution: Record<string, number> = {};
        Object.entries(sectorTotals).forEach(([sector, amount]) => {
            sectorDistribution[sector] = Math.round((amount / totalAllInvested) * 100);
        });

        // Top companies by investor count
        const companyInvestorCount: Record<string, number> = {};
        users.forEach(u => {
            u.companies.forEach(cId => {
                companyInvestorCount[cId] = (companyInvestorCount[cId] || 0) + 1;
            });
        });
        const topCompanyIds = Object.entries(companyInvestorCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        // Fetch company names for top companies
        const { data: topCompanyData } = await supabase
            .from('companies')
            .select('id, name, sector')
            .in('id', topCompanyIds.map(([id]) => id));

        const companyNameMap = new Map((topCompanyData || []).map(c => [c.id, c]));
        const topCompanies = topCompanyIds.map(([id, count]) => ({
            id,
            name: companyNameMap.get(id)?.name || 'Unknown',
            sector: companyNameMap.get(id)?.sector || 'Unknown',
            investorCount: count,
            investorPct: Math.round((count / totalInvestors) * 100),
        }));

        // Diversification score distribution
        const diversificationScores: Record<string, number> = { low: 0, medium: 0, high: 0 };
        users.forEach(u => {
            const score = u.companies.size;
            if (score <= 2) diversificationScores.low++;
            else if (score <= 5) diversificationScores.medium++;
            else diversificationScores.high++;
        });

        // Save snapshot
        const { error } = await supabase.from('peer_benchmarks').insert({
            snapshot_date: new Date().toISOString().split('T')[0],
            total_investors: totalInvestors,
            avg_portfolio_size: Math.round(avgPortfolioSize),
            sector_distribution: sectorDistribution,
            top_companies: topCompanies,
            avg_holdings_count: Math.round(avgHoldings * 10) / 10,
            diversification_scores: diversificationScores,
        });

        if (error) {
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
            success: true,
            snapshot: {
                totalInvestors,
                avgPortfolioSize: Math.round(avgPortfolioSize),
                avgHoldings: Math.round(avgHoldings * 10) / 10,
                topCompanies: topCompanies.slice(0, 3).map(c => c.name),
            },
        });
    } catch (error: any) {
        console.error('Peer benchmark cron error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
