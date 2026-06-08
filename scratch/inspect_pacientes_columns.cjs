const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTable() {
  console.log('Querying table information for "pacientes"...');
  
  // Query table columns and default values
  const { data: cols, error: colsError } = await supabase.rpc('get_table_columns_info'); // if rpc exists, else run query
  
  // Since we don't know if rpc exists, let's use a query that uses postgrest to query information_schema if allowed
  // Wait, PostgREST might not expose information_schema by default. Let's try to query it.
  const { data: infSchema, error: infError } = await supabase
    .from('pacientes')
    .select('*')
    .limit(1);

  if (infError) {
    console.error('Error querying patients:', infError.message);
  } else {
    console.log('Sample row keys:', Object.keys(infSchema[0] || {}));
  }

  // Let's run a custom SQL query if we can by executing an arbitrary query.
  // Wait, does Supabase have a way to run arbitrary SQL through RPC? Some setups have a 'exec_sql' RPC or similar.
  // Let's check if there are any SQL functions defined.
  // We can also check by trying to insert a dummy patient and seeing what id is generated.
  console.log('\nInserting dummy patient to see what id is generated...');
  const { data: dummy, error: dummyError } = await supabase
    .from('pacientes')
    .insert({
      apellido: 'TEST_LN',
      nombres: 'TEST_FN',
      dni: 'TEST-DNI-XYZ',
      nro_hc: 999999
    })
    .select('*');

  if (dummyError) {
    console.error('Error inserting dummy patient:', dummyError.message);
  } else {
    console.log('Inserted dummy patient:', dummy[0]);
    // Delete it
    await supabase.from('pacientes').delete().eq('id_paciente', dummy[0].id_paciente);
    console.log('Deleted dummy patient.');
  }
}

inspectTable();
