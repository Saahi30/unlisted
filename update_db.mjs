import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zadwyjrhjczuodeurmvg.supabase.co';
const supabaseKey = 'sb_publishable_Bx1DKh4t4XcgRD27EXuvjw_m1nPP98P';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Updating Zepto company details...');
    const { error: updateError } = await supabase.from('companies').update({
        current_ask_price: 54,
        current_bid_price: 50,
        change: '-6.90%',
        status: 'pre_ipo',
        valuation: 51229
    }).eq('id', 'comp_5');

    if (updateError) {
        console.error('Error updating company:', updateError);
    } else {
        console.log('Company updated successfully.');
    }

    console.log('Inserting historical prices...');
    const prices = [
        { id: 'hp_1', company_id: 'comp_5', price_date: '2026-02-01', price_value: 58 },
        { id: 'hp_2', company_id: 'comp_5', price_date: '2026-02-08', price_value: 56 },
        { id: 'hp_3', company_id: 'comp_5', price_date: '2026-02-15', price_value: 56 },
        { id: 'hp_4', company_id: 'comp_5', price_date: '2026-02-22', price_value: 56 },
        { id: 'hp_5', company_id: 'comp_5', price_date: '2026-03-01', price_value: 56 },
        { id: 'hp_6', company_id: 'comp_5', price_date: '2026-03-02', price_value: 54 },
        { id: 'hp_7', company_id: 'comp_5', price_date: '2026-03-08', price_value: 54 },
        { id: 'hp_8', company_id: 'comp_5', price_date: '2026-03-14', price_value: 54 }
    ];

    for (const price of prices) {
        const { error: insertError } = await supabase.from('company_historical_prices').upsert(price);
        if (insertError) {
            console.error('Error inserting price:', insertError);
        }
    }
    console.log('Historical prices updated successfully.');
}

run();
