import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { tavily } from '@tavily/core';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY! });

export async function POST() {
    try {
        // Check if data was already updated today (admin pasted manually)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { count } = await supabase
            .from('market_news')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', todayStart.toISOString());

        if (count && count > 0) {
            return Response.json({ skipped: true, message: 'Data already updated today by admin.' });
        }

        // Fetch companies
        const { data: companies } = await supabase
            .from('companies')
            .select('id, name, sector, current_ask_price, status');

        if (!companies || companies.length === 0) {
            return Response.json({ error: 'No companies found' }, { status: 400 });
        }

        const companyNames = companies.map(c => c.name);

        // Use Tavily to search for news (1 search call — optimized for free tier)
        const searchQuery = `India unlisted shares pre-IPO market news ${companyNames.slice(0, 5).join(' ')} 2026`;
        const searchResults = await tavilyClient.search(searchQuery, {
            maxResults: 10,
            searchDepth: 'basic',
        });

        const searchContext = searchResults.results
            .map((r: any) => `Title: ${r.title}\nSource: ${r.url}\nContent: ${r.content}`)
            .join('\n\n---\n\n');

        const companyList = companies
            .map(c => `${c.name} (Sector: ${c.sector}, Price: ₹${c.current_ask_price}, Status: ${c.status})`)
            .join('\n');

        // Use Groq to structure the search results into our JSON format
        const { text } = await generateText({
            model: groq('llama-3.3-70b-versatile'),
            prompt: `You are a financial data analyst. Based on the web search results below, extract and structure data about Indian unlisted/pre-IPO companies.

OUR TRACKED COMPANIES:
${companyList}

WEB SEARCH RESULTS:
${searchContext}

Return ONLY valid JSON in this exact format (no other text, no markdown):
{
  "news": [
    { "title": "...", "summary": "2-3 sentence summary", "category": "market|company|regulatory|ipo", "sentiment": "bullish|bearish|neutral", "source": "source name", "companyName": "company name from our list or null" }
  ],
  "ipoScores": [
    { "companyName": "exact name from our list", "ipoLikelihood": 0-100, "growthPotential": 0-100, "riskLevel": 0-100, "overallScore": 0-100, "aiSignals": ["signal1", "signal2"] }
  ],
  "earnings": [
    { "companyName": "exact name from our list", "quarter": "Q1/Q2/Q3/Q4", "fiscalYear": "FY26", "revenue": number_in_crores_or_null, "pat": number_in_crores_or_null, "ebitda": number_in_crores_or_null, "eps": number_or_null, "highlights": "key takeaway" }
  ]
}

RULES:
- Only include news items that are actually present in the search results — do not fabricate
- Only include IPO scores if you have real evidence from the search results
- Only include earnings if actual financial data was found
- companyName must exactly match names from our tracked list, or null for general market news
- If you can't find relevant data for a section, return an empty array
- Return ONLY the JSON, no explanation`,
        });

        // Parse and save — reuse the parse logic
        let jsonStr = text.trim();
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) jsonStr = jsonMatch[1].trim();

        const parsed = JSON.parse(jsonStr);
        const companyMap = new Map(companies.map(c => [c.name.toLowerCase(), c.id]));

        const findCompanyId = (name: string | null): string | null => {
            if (!name) return null;
            const lower = name.toLowerCase();
            if (companyMap.has(lower)) return companyMap.get(lower)!;
            for (const [key, id] of companyMap) {
                if (key.includes(lower) || lower.includes(key)) return id;
            }
            return null;
        };

        const results = { news: 0, ipoScores: 0, earnings: 0 };

        if (parsed.news?.length) {
            const newsRows = parsed.news.map((n: any) => ({
                title: n.title,
                summary: n.summary,
                category: n.category || 'general',
                sentiment: n.sentiment || 'neutral',
                source: n.source || 'Tavily Auto-Fetch',
                company_id: findCompanyId(n.companyName),
                published_at: new Date().toISOString(),
            }));
            const { error } = await supabase.from('market_news').insert(newsRows);
            if (!error) results.news = newsRows.length;
        }

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
            source: 'tavily_auto_fetch',
            results,
            message: `Auto-fetched: ${results.news} news, ${results.ipoScores} IPO scores, ${results.earnings} earnings.`
        });
    } catch (error: any) {
        console.error('Auto-fetch error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
