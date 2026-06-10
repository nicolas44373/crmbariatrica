const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function testInsert() {
  const profs = [
    {
      email: 'epuertas@plenus.ar',
      nombres: 'Eliana',
      apellido: 'PUERTAS',
      rol: 'Nutricionista',
      activo: false,
      iniciales: 'EP'
    },
    {
      email: 'medico_11@plenus.ar',
      nombres: 'Pedro Jose',
      apellido: 'TOMAS',
      rol: 'Médico',
      activo: false,
      iniciales: 'PJT'
    }
  ];

  for (const prof of profs) {
    console.log(`Inserting ${prof.email}...`);
    const { data, error } = await supabase.from('profesionales').insert(prof);
    if (error) {
      console.error(`Error inserting ${prof.email}:`, error);
    } else {
      console.log(`Inserted ${prof.email} successfully:`, data);
    }
  }
}

testInsert();
