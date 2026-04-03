import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zadwyjrhjczuodeurmvg.supabase.co';
const supabaseKey = 'sb_publishable_Bx1DKh4t4XcgRD27EXuvjw_m1nPP98P';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Testing companies update...');
    const { error: err1 } = await supabase.from('companies').update({ current_ask_price: 1337 }).eq('id', 'comp_1');
    console.log('Companies text check error:', err1?.message);

    console.log('Testing historical prices insert...');
    const { error: err2 } = await supabase.from('company_historical_prices').insert([{
        id: 'hp_1', company_id: 'comp_1', price_date: '2026-02-01', price_value: 58
    }]);
    console.log('Historical prices text check error:', err2?.message);
}
run();
