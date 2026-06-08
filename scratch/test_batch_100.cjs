const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

async function testBatch() {
  console.log('Reading Excel file...');
  const pacientesWorkbook = XLSX.readFile(path.join(dataDir, 'PACIENTES.xls'));
  const pacientesSheet = pacientesWorkbook.Sheets[pacientesWorkbook.SheetNames[0]];
  const pacientesData = XLSX.utils.sheet_to_json(pacientesSheet);
  const realPatients = pacientesData.filter(p => p.NROHC > 0);

  // Take the second batch (index 100 to 199)
  const batch = realPatients.slice(100, 200);
  console.log(`Prepared batch size: ${batch.length}`);

  const seenDnis = new Set();
  // We can query existing patients in database to pre-populate seenDnis if needed, 
  // but let's just use the same logic
  const insertPayload = batch.map(p => {
    let dob = null;
    if (p.FENAC) {
      // excel date helper
      const serial = p.FENAC;
      const utc_days  = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      dob = date_info.toISOString().split('T')[0];
    }
    
    let docStr = p.DOC ? String(p.DOC).trim() : '';
    if (docStr.endsWith('.0')) docStr = docStr.slice(0, -2);
    if (docStr === '0' || docStr === '' || docStr === 'null' || docStr === 'undefined') {
      docStr = `N/A-${p.NROHC}`;
    }
    if (seenDnis.has(docStr)) {
      docStr = `${docStr}-DUP-${p.NROHC}`;
    }
    seenDnis.add(docStr);

    return {
      apellido: p.APELLIDO ? p.APELLIDO.trim().toUpperCase() : '(SIN APELLIDO)',
      nombres: p.NOMBRE ? p.NOMBRE.trim() : '(SIN NOMBRE)',
      dni: docStr,
      fecha_nacimiento: dob,
      direccion: p.DOMICILIO || null,
      obra_social: p.OS || '',
      nro_afiliado: p.NROOS ? String(p.NROOS).trim() : '',
      telefono: p.TEL ? String(p.TEL).trim() : '',
      email: p.EMAIL || '',
      nro_hc: p.NROHC,
      sexo: p.SEXO === 1 ? 'Masculino' : p.SEXO === 2 ? 'Femenino' : null,
      ocupacion: p.OCUPACION || null,
      localidad: p.LOCALIDAD || null,
      cp: p.CP ? String(p.CP) : null,
      telefono_2: p.TEL2 ? String(p.TEL2) : null,
      etiqueta_activa: 'NUEVO_INGRESO',
    };
  });

  console.log('Sending insert request to Supabase...');
  const { data, error } = await supabase
    .from('pacientes')
    .insert(insertPayload)
    .select('id_paciente, nro_hc, dni');

  if (error) {
    console.error('INSERT ERROR OCCURRED:');
    console.error('Message:', error.message);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
    console.error('Code:', error.code);
  } else {
    console.log(`Success! Inserted ${data.length} records.`);
    console.log('Sample inserted records:', data.slice(0, 3));
  }
}

testBatch();
