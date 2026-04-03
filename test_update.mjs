import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zadwyjrhjczuodeurmvg.supabase.co';
const supabaseKey = 'sb_publishable_Bx1DKh4t4XcgRD27EXuvjw_m1nPP98P';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Testing update on mock company...');
    const { data: updateData, error: updateError } = await supabase.from('companies').update({ current_ask_price: 1337 }).eq('name', 'Swiggy').select();
    
    console.log('Update Error:', updateError);
    console.log('Update Data:', updateData);
    
    console.log('Fetching all companies...');
    const { data, error } = await supabase.from('companies').select('id, name');
    console.log('Select Error:', error);
    console.log('Companies Length:', data?.length);
    if(data?.length > 0) {
        console.log('First company ID:', data[0].id);
    }
}
run();
