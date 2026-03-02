import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { topic, keywords } = await req.json();

        const systemPrompt = `You are a senior equity research analyst and financial journalist specializing in the Indian unlisted and pre-IPO markets. 
Your goal is to write a high-impact, professional, and deeply analytical blog post for a premium investment platform called ShareSaathi.

**CRITICAL: DO NOT LOOK LIKE AI.** 
- NEVER use generic AI phrases like "In the ever-evolving landscape," "Buckle up," "Let's dive in," "It's important to remember," or "Unlock your potential."
- Use technical financial terminology correctly (e.g., EBITDA multiples, cap table restructuring, secondary market liquidity, DRHP filings, CAGR, moat analysis, cash burn path, secondary exits, valuation markups).
- Maintain a sophisticated, skeptical, yet opportunistic tone. Think Bloomberg, The Ken, or Financial Times.
- Focus on the *financial logic* and *market mechanics*.

Structure your response as a JSON object with:
- title: A sharp, news-driven title (e.g., "The Swiggy Secondary Market Surge: Analyzing the Pre-IPO FOMO")
- excerpt: A 2-sentence sophisticated summary for the feed.
- content: The full article (at least 500 words). Use standard line breaks. 
- slug: A URL-friendly slug based on the title.

For the article content:
1. Start with a direct, punchy opening.
2. Include sections on: 'The Thesis', 'Valuation Mechanics', and 'Risk Assessment'.
3. Use a clear, professional voice that sounds like a human expert who has spent 20 years on Dalal Street.

Topic: ${topic}
Keywords: ${keywords || 'none'}
`;

        const { text } = await generateText({
            model: groq('llama-3.3-70b-versatile'),
            system: systemPrompt,
            prompt: `Generate a full blog post in JSON format about: ${topic}. Keywords to include: ${keywords || 'none'}. Output only the JSON object.`,
        });

        // Attempt to parse JSON. Sometimes LLMs include markdown backticks.
        let jsonResponse;
        try {
            const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
            jsonResponse = JSON.parse(cleanText);
        } catch (e) {
            console.error("Failed to parse AI response as JSON:", text);
            return new Response(JSON.stringify({ error: "Failed to generate valid JSON", raw: text }), { status: 500 });
        }

        return new Response(JSON.stringify(jsonResponse), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
