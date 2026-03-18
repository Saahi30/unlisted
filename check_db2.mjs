import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zadwyjrhjczuodeurmvg.supabase.co';
const supabaseKey = 'sb_publishable_Bx1DKh4t4XcgRD27EXuvjw_m1nPP98P';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: cols } = await supabase.rpc('get_table_columns', { p_table_name: 'companies' }).catch(() => ({ data: 'rpc failed' }));
    console.log("Cols:", cols);
    
    // trying standard select with limits and getting types wouldn't work easily through standard REST without swagger.
    // Instead we can just try to insert one and see the error.
    const { error } = await supabase.from('companies').insert({ id: 'comp_1', name: 'Test' });
    console.log(error);
}

check();
