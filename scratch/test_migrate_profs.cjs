const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
const XLSX = require('xlsx');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');

const medicosWorkbook = XLSX.readFile(path.join(dataDir, 'MEDICOS.xls'));
const medicosSheet = medicosWorkbook.Sheets[medicosWorkbook.SheetNames[0]];
const medicosData = XLSX.utils.sheet_to_json(medicosSheet);

async function run() {
  console.log('Testing professionals insertion...');
  for (const doc of medicosData) {
    const email = doc.MAIL ? doc.MAIL.trim().toLowerCase() : `medico_${doc.ID}@plenus.ar`;
    const initials = doc.INICIALES ? doc.INICIALES.trim().toUpperCase() : '';
    
    let rol = 'Médico';
    const esp = doc.ESPECIALIDAD ? doc.ESPECIALIDAD.trim().toLowerCase() : '';
    if (esp.includes('admin')) {
      rol = 'Administrativo';
    }
    
    console.log(`Doc: ${doc.NOMBRE} ${doc.APELLIDO} (${initials}) -> Email: ${email}, Rol calculated: ${rol}`);
    
    const { error: profError } = await supabase.from('profesionales').upsert({
      email,
      nombres: doc.NOMBRE,
      apellido: doc.APELLIDO,
      rol,
      activo: doc.ACTIVO === 1,
      especialidad: doc.ESPECIALIDAD || null,
      matricula: doc.MATRICULA || null,
      telefono: doc.TELEFONO || doc.CELULAR || null,
      iniciales: initials || null,
      config_turnos: {
        duracionTurnoMinutos: 30,
        horarios: [],
        diasBloqueados: [],
        horariosEspeciales: []
      }
    }, { onConflict: 'email' });
    
    if (profError) {
      console.error(`Error inserting professional ${email}:`, profError);
    } else {
      console.log(`Inserted/upserted ${email} successfully.`);
    }
  }
}

run();
