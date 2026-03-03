import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client to bypass RLS for payment webhooks
// Fallback to anon key if service_role is unavailable (for local dev sims)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { link_token, payment_method, razorpay_order_id, razorpay_payment_id } = body;

        if (!link_token) {
            return NextResponse.json({ error: 'Missing link token' }, { status: 400 });
        }

        // Fetch the order
        const { data: order, error: fetchError } = await supabaseAdmin
            .from('agent_client_orders')
            .select('*')
            .eq('link_token', link_token)
            .single();

        if (fetchError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.status === 'paid') {
            return NextResponse.json({ error: 'Order already paid' }, { status: 400 });
        }

        // Calculate final cuts
        const baseCost = order.base_price;
        const platformFixedMarkup = order.fixed_markup;
        const agentCost = baseCost + platformFixedMarkup;
        const grossMargin = order.selling_price - agentCost;

        // Fetch margin threshold logic dynamically
        // 1. Fetch relevant rules from agent_settings
        const { data: agentRules } = await supabaseAdmin.from('agent_settings')
            .select('*')
            .or(`agent_id.eq.${order.agent_id},agent_id.is.null`);

        // Resolve rule hierarchically
        let resolvedRule = { margin_threshold: 10, margin_percentage: 20 };
        if (agentRules && agentRules.length > 0) {
            let r = agentRules.find(r => r.agent_id === order.agent_id && r.company_id === order.company_id);
            if (!r) r = agentRules.find(r => r.agent_id === order.agent_id && r.company_id === null);
            if (!r) r = agentRules.find(r => r.agent_id === null && r.company_id === order.company_id);
            if (!r) r = agentRules.find(r => r.agent_id === null && r.company_id === null);

            if (r) resolvedRule = r;
        }

        const marginThreshold = resolvedRule.margin_threshold || 10;
        const marginPercentage = (resolvedRule.margin_percentage || 20) / 100.0;
        let platformVariableCut = 0;

        if (grossMargin > marginThreshold) {
            platformVariableCut = grossMargin * marginPercentage;
        }

        const agentNetEarnings = grossMargin - platformVariableCut;
        const totalPlatformCut = platformFixedMarkup + platformVariableCut;

        // Update the order to paid and assign the earnings
        const { error: updateError } = await supabaseAdmin
            .from('agent_client_orders')
            .update({
                status: 'paid',
                payment_method: payment_method || 'razorpay',
                razorpay_order_id,
                razorpay_payment_id,
                platform_cut: totalPlatformCut * order.quantity,
                agent_earnings: agentNetEarnings * order.quantity,
                updated_at: new Date().toISOString()
            })
            .eq('link_token', link_token);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
        }

        // Update the agent profile earnings
        // We read it first, then update it. In production use an RPC to avoid race conditions.
        const { data: agentData } = await supabaseAdmin
            .from('agent_profiles')
            .select('total_earnings')
            .eq('agent_id', order.agent_id)
            .single();

        if (agentData) {
            await supabaseAdmin
                .from('agent_profiles')
                .update({
                    total_earnings: Number(agentData.total_earnings || 0) + (agentNetEarnings * order.quantity)
                })
                .eq('agent_id', order.agent_id);
        }

        return NextResponse.json({ success: true, agentNetEarnings });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
