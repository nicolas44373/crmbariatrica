const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fetchAll(queryBuilder, batchSize = 1000) {
  let allData = [];
  let from = 0;
  let to = batchSize - 1;
  let finished = false;

  while (!finished) {
    const { data, error } = await queryBuilder.range(from, to);
    if (error) throw error;
    if (!data || data.length === 0) {
      finished = true;
    } else {
      allData = allData.concat(data);
      if (data.length < batchSize) {
        finished = true;
      } else {
        from += batchSize;
        to += batchSize;
      }
    }
  }
  return allData;
}

async function test() {
  console.log('Testing fetchAll on pacientes...');
  const start = Date.now();
  const data = await fetchAll(supabase.from('pacientes').select('id_paciente, apellido'));
  console.log(`Successfully fetched ${data.length} patients in ${Date.now() - start}ms.`);
}

test();
