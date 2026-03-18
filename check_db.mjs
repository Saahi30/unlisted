import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zadwyjrhjczuodeurmvg.supabase.co';
const supabaseKey = 'sb_publishable_Bx1DKh4t4XcgRD27EXuvjw_m1nPP98P';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data } = await supabase.from('companies').select('*');
    console.log(data);
}

check();
