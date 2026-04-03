import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://zadwyjrhjczuodeurmvg.supabase.co';
const supabaseKey = 'sb_publishable_Bx1DKh4t4XcgRD27EXuvjw_m1nPP98P';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Inserting with a proper UUID...');
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const { error: e } = await supabase.from('company_historical_prices').insert([{
        id: '123e4567-e89b-12d3-a456-426614174000', company_id: 'comp_5', price_date: '2026-03-20', price_value: 120
    }]);
    console.log('Error with comp_5 string:', e?.message || 'Success');

    const { error: e2 } = await supabase.from('company_historical_prices').insert([{
        id: '123e4567-e89b-12d3-a456-426614174000', company_id: uuid, price_date: '2026-03-20', price_value: 120
    }]);
    console.log('Error with proper UUID:', e2?.message || 'Success');
}
run();
