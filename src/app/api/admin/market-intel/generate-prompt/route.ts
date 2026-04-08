import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST() {
    try {
        // Fetch current companies from DB
        const { data: companies } = await supabase
            .from('companies')
            .select('id, name, sector, current_ask_price, status, category');

        const companyList = (companies || [])
            .map(c => `- ${c.name} (Sector: ${c.sector}, Price: ₹${c.current_ask_price}, Status: ${c.status})`)
            .join('\n');

        const today = new Date().toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const { text: prompt } = await generateText({
            model: groq('llama-3.3-70b-versatile'),
            prompt: `You are generating a research prompt that an admin will paste into Claude AI (which has web search). The prompt should ask Claude to research and return structured JSON data about Indian unlisted/pre-IPO companies.

Today's date: ${today}

Our platform tracks these companies:
${companyList}

Generate a single prompt that asks Claude to:
1. Search for the latest news about these unlisted companies and the Indian unlisted/pre-IPO market (last 7 days)
2. Find any IPO filing updates (DRHP, RHP, SEBI approvals) for these companies
3. Find any recent quarterly earnings/financial results for these companies

The prompt MUST instruct Claude to return ONLY a JSON response in this exact format (no other text):
{
  "news": [
    { "title": "...", "summary": "2-3 sentence summary", "category": "market|company|regulatory|ipo", "sentiment": "bullish|bearish|neutral", "source": "source name", "companyName": "company name or null for general news" }
  ],
  "ipoScores": [
    { "companyName": "...", "ipoLikelihood": 0-100, "growthPotential": 0-100, "riskLevel": 0-100, "overallScore": 0-100, "aiSignals": ["signal1", "signal2"] }
  ],
  "earnings": [
    { "companyName": "...", "quarter": "Q1/Q2/Q3/Q4", "fiscalYear": "FY26", "revenue": number_in_crores_or_null, "pat": number_in_crores_or_null, "ebitda": number_in_crores_or_null, "eps": number_or_null, "highlights": "key takeaway" }
  ]
}

IMPORTANT RULES FOR THE PROMPT YOU GENERATE:
- Keep the prompt under 500 words
- Tell Claude to only include news it actually found with real sources
- Tell Claude to only include earnings data it can verify
- For IPO scores, tell Claude to base them on publicly available information (DRHP filings, media reports, etc.)
- Tell Claude if it can't find data for a section, return an empty array
- The prompt should be direct and professional
- Start the prompt with "Search the internet and provide..."`,
        });

        return Response.json({ prompt, companies: companies || [] });
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
