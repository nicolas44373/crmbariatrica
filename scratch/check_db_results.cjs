const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('--- Querying Patients Tag Distribution ---');
  const { data: tagCounts, error: err1 } = await supabase
    .from('pacientes')
    .select('etiqueta_activa');

  if (err1) {
    console.error('Error querying patients:', err1.message);
    return;
  }

  const tagDistribution = {};
  tagCounts.forEach(p => {
    const t = p.etiqueta_activa || 'NULL';
    tagDistribution[t] = (tagDistribution[t] || 0) + 1;
  });
  console.log(tagDistribution);

  console.log('\n--- Querying Surgeries Distribution ---');
  const { data: qxCounts, error: err2 } = await supabase
    .from('cirugias')
    .select('tipo_cirugia, fecha_realizada');

  if (err2) {
    console.error('Error querying surgeries:', err2.message);
    return;
  }

  const qxDistribution = {};
  let nullRealizada = 0;
  qxCounts.forEach(q => {
    const type = q.tipo_cirugia || 'NULL';
    qxDistribution[type] = (qxDistribution[type] || 0) + 1;
    if (!q.fecha_realizada) {
      nullRealizada++;
    }
  });
  console.log(qxDistribution);
  console.log(`Surgeries in table: ${qxCounts.length}, without fecha_realizada: ${nullRealizada}`);
}

run();
