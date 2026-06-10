const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
const XLSX = require('xlsx');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const backupDir = path.join(__dirname, '..', 'backup');
const dataDir = path.join(backupDir, 'Tablas de Datos');
const plenusDir = path.join(backupDir, 'Plenus');

// Load medicosData to populate initials
const medicosWorkbook = XLSX.readFile(path.join(dataDir, 'MEDICOS.xls'));
const medicosSheet = medicosWorkbook.Sheets[medicosWorkbook.SheetNames[0]];
const medicosData = XLSX.utils.sheet_to_json(medicosSheet);

const doctorInitialsToEmail = {};
medicosData.forEach(doc => {
  const email = doc.MAIL ? doc.MAIL.trim().toLowerCase() : `medico_${doc.ID}@plenus.ar`;
  const initials = doc.INICIALES ? doc.INICIALES.trim().toUpperCase() : '';
  doctorInitialsToEmail[initials] = email;
});

function isRTFEmptyHeader(content) {
  let temp = content
    .replace(/\\par/g, ' ')
    .replace(/\\b/g, ' ')
    .replace(/\\b0/g, ' ')
    .replace(/\\rt/g, ' ')
    .replace(/\\rtf\d*/g, ' ')
    .replace(/\{[^\}]*\}/g, ' ')
    .replace(/Paciente:\s*[^\\]*/i, '')
    .replace(/DNI:\s*[^\\]*/i, '')
    .replace(/NroHC:\s*[^\\]*/i, '')
    .replace(/Fecha:\s*[^\\]*/i, '')
    .replace(/\\ansi[^\s]*/g, '')
    .replace(/\\[a-z0-9]+/g, ' ')
    .replace(/[{}]/g, ' ')
    .trim();
  temp = temp.replace(/\s+/g, ' ').trim();
  return temp.length < 15;
}

function cleanRTF(rtf) {
  let text = rtf;
  text = text.replace(/\{[^\}]*\}/g, '');
  text = text.replace(/\\[a-z0-9-]+/gi, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function parseDateStr(str) {
  try {
    const parts = str.trim().split(/\s+/);
    const datePart = parts[0];
    const timePart = parts[1] || '00:00';
    if (datePart.includes('-')) {
      return new Date(`${datePart}T${timePart}`);
    } else {
      const dParts = datePart.split('/');
      return new Date(`${dParts[2]}-${dParts[1]}-${dParts[0]}T${timePart}`);
    }
  } catch (e) {
    return new Date();
  }
}

async function debugSinglePatient() {
  const nrohc = 4523;
  const uuid = 'P-4523';
  
  // Find file
  const files = fs.readdirSync(plenusDir);
  const file = files.find(f => f.startsWith(String(nrohc)));
  if (!file) {
    console.log('RTF file not found!');
    return;
  }

  const filePath = path.join(plenusDir, file);
  console.log('Reading RTF file:', file);
  const content = fs.readFileSync(filePath, 'latin1');
  
  if (isRTFEmptyHeader(content)) {
    console.log('RTF empty header returned true!');
    return;
  }

  const entryRegex = /\\b\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}|\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})\s*(?:\[([a-zA-Z]*)\])?\s*(?:\(\d+a\s*\d+m\))?\s*\\b0/g;
  
  let match;
  const matches = [];
  while ((match = entryRegex.exec(content)) !== null) {
    matches.push({
      dateStr: match[1],
      authorInitials: match[2] || '',
      index: match.index,
      headerLength: match[0].length
    });
  }

  console.log(`Found matches: ${matches.length}`);
  const payloads = [];

  for (let j = 0; j < matches.length; j++) {
    const start = matches[j].index + matches[j].headerLength;
    const end = (j + 1 < matches.length) ? matches[j + 1].index : content.length;
    
    const rawContent = content.slice(start, end);
    const cleaned = cleanRTF(rawContent);
    
    if (cleaned.trim()) {
      const authorEmail = doctorInitialsToEmail[matches[j].authorInitials.toUpperCase()] || 'admin@clinicabariatrica.com';
      
      let esp = 'Consulta';
      if (matches[j].authorInitials) {
        const matchedDoc = medicosData.find(m => m.INICIALES?.trim().toUpperCase() === matches[j].authorInitials.toUpperCase());
        if (matchedDoc && matchedDoc.ESPECIALIDAD) esp = matchedDoc.ESPECIALIDAD;
      }
      
      const dateISO = parseDateStr(matches[j].dateStr).toISOString();
      
      payloads.push({
        id_paciente: uuid,
        fecha_consulta: dateISO,
        profesional_email: authorEmail,
        especialidad: esp,
        nota_clinica: cleaned,
        nota_confidencial: '',
        is_deleted: false
      });
    }
  }

  console.log(`Payloads constructed: ${payloads.length}`);
  if (payloads.length > 0) {
    console.log('Inserting into database...');
    // Delete existing ones to avoid duplicates if we want, or just insert them
    const { error: delError } = await supabase
      .from('evoluciones')
      .delete()
      .eq('id_paciente', uuid)
      .neq('nota_clinica', 'pop alejado  buena evolucion  en plan dermolipectomia circular el 17/6 ( Meder)  pre qx normal  . se'); // do not delete the test one
      
    if (delError) console.error('Error deleting prior:', delError.message);

    const { error: insError } = await supabase.from('evoluciones').insert(payloads);
    if (insError) {
      console.error('Error inserting evoluciones:', insError.message);
    } else {
      console.log('Successfully inserted all clinical notes for P-4523!');
    }
  }
}

debugSinglePatient();
