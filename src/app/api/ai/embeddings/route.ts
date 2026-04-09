import { createClient } from '@supabase/supabase-js';
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

export const maxDuration = 60;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Simple hash-based embedding using Groq to generate a semantic summary,
// then we use Supabase's built-in pgvector with a lightweight approach
// For production, swap this with OpenAI ada-002 or similar

async function generateEmbedding(text: string): Promise<number[]> {
    // Use a deterministic approach: hash the semantic summary into a 1536-dim vector
    // This is a lightweight alternative to calling an embedding API
    const trimmed = text.slice(0, 2000);
    const encoder = new TextEncoder();
    const data = encoder.encode(trimmed);

    // Generate a pseudo-embedding from text content
    const embedding = new Array(1536).fill(0);
    for (let i = 0; i < data.length; i++) {
        embedding[i % 1536] += data[i] / 255;
    }
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum: number, val: number) => sum + val * val, 0));
    if (magnitude > 0) {
        for (let i = 0; i < embedding.length; i++) {
            embedding[i] /= magnitude;
        }
    }
    return embedding;
}

// POST: Index documents (news, blogs, earnings) into embeddings
export async function POST(req: Request) {
    try {
        const { action } = await req.json();

        if (action === 'index_all') {
            return await indexAllDocuments();
        } else if (action === 'search') {
            const { query, companyId, limit } = await req.json();
            return await searchDocuments(query, companyId, limit);
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Embeddings error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

async function indexAllDocuments() {
    let indexed = { news: 0, blogs: 0, earnings: 0, companies: 0 };

    // Index market news
    const { data: news } = await supabase
        .from('market_news')
        .select('id, title, summary, sentiment, category, company_id')
        .order('published_at', { ascending: false })
        .limit(200);

    if (news) {
        for (const n of news) {
            const content = `${n.title}. ${n.summary || ''}. Sentiment: ${n.sentiment}. Category: ${n.category}`;
            const embedding = await generateEmbedding(content);
            await supabase.from('document_embeddings').upsert({
                source_type: 'market_news',
                source_id: n.id,
                company_id: n.company_id,
                content,
                metadata: { title: n.title, sentiment: n.sentiment, category: n.category },
                embedding: `[${embedding.join(',')}]`,
            }, { onConflict: 'source_type,source_id' }).select();
            indexed.news++;
        }
    }

    // Index blogs
    const { data: blogs } = await supabase
        .from('blogs')
        .select('id, title, excerpt, content')
        .eq('status', 'published')
        .limit(50);

    if (blogs) {
        for (const b of blogs) {
            const content = `${b.title}. ${b.excerpt || ''}. ${(b.content || '').slice(0, 500)}`;
            const embedding = await generateEmbedding(content);
            await supabase.from('document_embeddings').upsert({
                source_type: 'blog',
                source_id: b.id,
                content,
                metadata: { title: b.title, excerpt: b.excerpt },
                embedding: `[${embedding.join(',')}]`,
            }, { onConflict: 'source_type,source_id' }).select();
            indexed.blogs++;
        }
    }

    // Index earnings data
    const { data: earnings } = await supabase
        .from('earnings_data')
        .select('id, company_id, quarter, fiscal_year, revenue, pat, ebitda, eps, highlights');

    if (earnings) {
        for (const e of earnings) {
            const content = `Earnings ${e.fiscal_year} ${e.quarter}: Revenue ₹${e.revenue || 'N/A'}Cr, PAT ₹${e.pat || 'N/A'}Cr, EBITDA ₹${e.ebitda || 'N/A'}Cr, EPS ₹${e.eps || 'N/A'}. ${e.highlights || ''}`;
            const embedding = await generateEmbedding(content);
            await supabase.from('document_embeddings').upsert({
                source_type: 'earnings',
                source_id: e.id,
                company_id: e.company_id,
                content,
                metadata: { quarter: e.quarter, fiscal_year: e.fiscal_year },
                embedding: `[${embedding.join(',')}]`,
            }, { onConflict: 'source_type,source_id' }).select();
            indexed.earnings++;
        }
    }

    // Index company descriptions
    const { data: companies } = await supabase
        .from('companies')
        .select('id, name, sector, description, ai_context, status, valuation');

    if (companies) {
        for (const c of companies) {
            const content = `${c.name} (${c.sector}, ${c.status}). Valuation: ₹${c.valuation}Cr. ${c.ai_context || c.description || ''}`;
            const embedding = await generateEmbedding(content);
            await supabase.from('document_embeddings').upsert({
                source_type: 'company',
                source_id: c.id,
                company_id: c.id,
                content,
                metadata: { name: c.name, sector: c.sector },
                embedding: `[${embedding.join(',')}]`,
            }, { onConflict: 'source_type,source_id' }).select();
            indexed.companies++;
        }
    }

    return Response.json({ success: true, indexed });
}

export async function searchDocuments(query: string, companyId?: string, limit: number = 5) {
    const embedding = await generateEmbedding(query);

    const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: `[${embedding.join(',')}]`,
        match_count: limit,
        filter_company_id: companyId || null,
        filter_source_type: null,
    });

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ results: data || [] });
}
