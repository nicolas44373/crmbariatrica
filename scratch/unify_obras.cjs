const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function unifyObras() {
  console.log('Unifying Obras Sociales in database...');

  const mappings = [
    // Sancor
    {
      targets: ['SANCOR SALUD 3000', 'SANCOR SALUD 1000', 'SANCOR SALUD 1500', 'Sancor Salud 3000', 'Sancor Salud 1000', 'Sancor Salud 1500'],
      replacement: 'SANCOR SALUD'
    },
    // Boreal
    {
      targets: ['BOREAL VIP', 'Boreal VIP'],
      replacement: 'BOREAL'
    },
    // OSDE
    {
      targets: ['OSDE 310', 'OSDE 210', 'Osde 310', 'Osde 210'],
      replacement: 'OSDE'
    },
    // Galeno
    {
      targets: ['GALENO Azul', 'GALENO Plata', 'GALENO Oro', 'Galeno Azul', 'Galeno Plata', 'Galeno Oro'],
      replacement: 'GALENO'
    },
    // Prevencion Salud
    {
      targets: ['PREVENCION SALUD A2', 'PREVENCION SALUD A4', 'Prevencion Salud A2', 'Prevencion Salud A4'],
      replacement: 'PREVENCION SALUD'
    }
  ];

  for (const map of mappings) {
    console.log(`Mapping ${map.targets.join(', ')} -> ${map.replacement}`);
    
    // Update pacientes
    const { error: pacErr } = await supabase
      .from('pacientes')
      .update({ obra_social: map.replacement })
      .in('obra_social', map.targets);
    if (pacErr) console.error('Error updating pacientes:', pacErr.message);

    // Update crm_contactos
    const { error: crmErr } = await supabase
      .from('crm_contactos')
      .update({ obra_social: map.replacement })
      .in('obra_social', map.targets);
    if (crmErr) console.error('Error updating crm_contactos:', crmErr.message);
  }

  console.log('Finished unifying Obras Sociales.');
}

unifyObras();
