import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zadwyjrhjczuodeurmvg.supabase.co';
const supabaseKey = 'sb_publishable_Bx1DKh4t4XcgRD27EXuvjw_m1nPP98P';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Fetching companies...');
    const { data, error } = await supabase.from('companies').select('id, name, current_ask_price');
    if (error) console.error(error);
    else console.log('Companies:', data);
    
    console.log('Fetching historical prices...');
    const { data: data2, error: error2 } = await supabase.from('company_historical_prices').select('*').limit(3);
    if (error2) console.error(error2);
    else console.log('Historical Prices:', data2);
}
run();
