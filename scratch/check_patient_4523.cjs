const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPatient() {
  const filePath = path.join(__dirname, '..', 'backup', 'Tablas de Datos', 'PACIENTES.xls');
  console.log('Reading:', filePath);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log('Searching for NROHC = 4523...');
  const p1 = data.find(p => p.NROHC === 4523);
  console.log('By NROHC 4523:', p1);

  console.log('Searching for APELLIDO "SALAZAR LOPEZ"...');
  const p2 = data.filter(p => String(p.APELLIDO || '').toLowerCase().includes('salazar'));
  console.log('Salazar patients count in Excel:', p2.length);
  p2.forEach(p => {
    console.log(`- NROHC: ${p.NROHC} | Name: ${p.APELLIDO}, ${p.NOMBRE} | DNI: ${p.DOC}`);
  });

  // Query Supabase for patients named Salazar
  console.log('\nQuerying Supabase for patients with APELLIDO like "SALAZAR"...');
  const { data: dbPacs, error } = await supabase
    .from('pacientes')
    .select('id_paciente, nro_hc, apellido, nombres, dni')
    .ilike('apellido', '%salazar%');
    
  if (error) {
    console.error('Error querying:', error.message);
  } else {
    console.log(`Found ${dbPacs.length} Salazar patients in database.`);
    dbPacs.forEach(p => {
      console.log(`- ID: ${p.id_paciente} | HC: ${p.nro_hc} | Name: ${p.apellido}, ${p.nombres} | DNI: ${p.dni}`);
    });
  }
}

checkPatient();
