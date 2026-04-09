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

        const companyNames = (companies || []).map(c => c.name);
        const companySearchInstructions = companyNames.map(name =>
            `- "${name}": Search for latest news, IPO updates, DRHP/RHP filings, SEBI approvals, quarterly results, funding rounds, valuation changes, management updates, and any regulatory developments`
        ).join('\n');

        const { text: prompt } = await generateText({
            model: groq('openai/gpt-oss-20b'),
            prompt: `You are generating a comprehensive research prompt that an admin will paste into Claude AI (which has web search). The prompt must ask Claude to do deep research on each company individually.

Today's date: ${today}

Our platform tracks these unlisted/pre-IPO Indian companies:
${companyList}

Generate an EXPANSIVE and DETAILED prompt that instructs Claude to:

1. COMPANY-BY-COMPANY RESEARCH — For EACH of the following companies, search the internet individually:
${companySearchInstructions}

2. MARKET-WIDE RESEARCH:
   - Search for "Indian unlisted shares market news ${today}"
   - Search for "pre-IPO market India latest updates"
   - Search for "SEBI unlisted shares regulations 2026"
   - Search for any new DRHP or RHP filings with SEBI
   - Search for secondary market volume trends

3. IPO SCORECARD — For each company, tell Claude to evaluate and score based on:
   - IPO likelihood (0-100): DRHP status, banker appointments, media reports, management commentary
   - Growth potential (0-100): Revenue trajectory, market position, TAM, competitive moat
   - Risk level (0-100 where 100 = safest): Profitability, debt, regulatory risk, sector headwinds
   - Overall score (0-100): Weighted composite
   - AI signals: 3-5 specific data-backed observations per company

4. EARNINGS DATA — For each company, search for:
   - Most recent quarterly/annual financial results
   - Revenue, PAT, EBITDA, EPS figures
   - Key highlights from earnings announcements

The prompt MUST tell Claude to search for EACH company by name individually — do NOT let it skip any. List every company name explicitly in the prompt.

The prompt MUST instruct Claude to return ONLY a JSON response in this exact format (no other text, no markdown):
{
  "news": [
    { "title": "...", "summary": "2-3 sentence summary with specific numbers/facts", "category": "market|company|regulatory|ipo", "sentiment": "bullish|bearish|neutral", "source": "actual source name (e.g. Moneycontrol, Economic Times, LiveMint)", "companyName": "exact company name from list or null for general news" }
  ],
  "ipoScores": [
    { "companyName": "exact company name from list", "ipoLikelihood": 0-100, "growthPotential": 0-100, "riskLevel": 0-100, "overallScore": 0-100, "aiSignals": ["specific signal with data", "another signal"] }
  ],
  "earnings": [
    { "companyName": "exact company name from list", "quarter": "Q1/Q2/Q3/Q4", "fiscalYear": "FY25/FY26", "revenue": number_in_crores_or_null, "pat": number_in_crores_or_null, "ebitda": number_in_crores_or_null, "eps": number_or_null, "highlights": "specific key takeaway with numbers" }
  ]
}

IMPORTANT RULES FOR THE PROMPT:
- EXPLICITLY name every single company in the prompt — do not use "etc." or "the above companies"
- Tell Claude to search for each company name individually on the internet
- Tell Claude to cite real sources (Moneycontrol, Economic Times, LiveMint, Business Standard, Inc42, Entrackr, VCCircle, etc.)
- Tell Claude to ONLY include data it actually found — never fabricate
- Tell Claude to provide IPO scores for ALL companies even if limited info is available (use best judgment)
- Tell Claude if it cannot find data for a specific company's earnings, skip that company in the earnings array
- The prompt should be thorough and professional
- Start the prompt with "Search the internet thoroughly for each company listed below and provide..."`,
        });

        return Response.json({ prompt, companies: companies || [] });
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
