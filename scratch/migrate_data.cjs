const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const dotenv = require('dotenv');

// Set TLS environment variable programmatically
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load env variables
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const supabaseSignUpClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const backupDir = 'c:/Users/nicol/Desktop/programacion/crm/backup';
const dataDir = path.join(backupDir, 'Tablas de Datos');
const masterDir = path.join(backupDir, 'Tablas Maestras');
const plenusDir = path.join(backupDir, 'Plenus');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function excelDateToJSDate(serial) {
  if (!serial || isNaN(serial)) return null;
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  
  const fractional_day = serial - Math.floor(serial) + 0.0000001;
  const total_seconds = Math.floor(86400 * fractional_day);
  const seconds = total_seconds % 60;
  const hours = Math.floor(total_seconds / 3600);
  const minutes = Math.floor((total_seconds % 3600) / 60);

  return new Date(Date.UTC(date_info.getUTCFullYear(), date_info.getUTCMonth(), date_info.getUTCDate(), hours, minutes, seconds));
}

function cleanRTF(text) {
  if (!text) return '';
  
  // 1. Remove RTF tags
  let clean = text
    .replace(/\\par/g, '\n')
    .replace(/\\b\d*/g, '')
    .replace(/\\b0/g, '')
    .replace(/\\f\d*/g, '')
    .replace(/\\fs\d*/g, '')
    .replace(/\\ql/g, '')
    .replace(/\\uc\d*/g, '')
    .replace(/\\bullet/g, '•')
    .replace(/\\tab/g, '\t');
    
  // 2. Decode hex escapes like \'e1 (\' + hex)
  clean = clean.replace(/\\\'([0-9a-fA-F]{2})/g, (match, hex) => {
    try {
      return Buffer.from(hex, 'hex').toString('latin1');
    } catch (e) {
      return match;
    }
  });

  // 3. Decode unicode characters like \u241?
  clean = clean.replace(/\\u(\d+)\??/g, (match, code) => {
    return String.fromCharCode(parseInt(code, 10));
  });

  // 4. Fix double encoding / mojibake in RTF output
  clean = clean
    .replace(/\u00c3\u00a1/g, 'á')
    .replace(/\u00c3\u00a9/g, 'é')
    .replace(/\u00c3\u00ad/g, 'í')
    .replace(/\u00c3\u00b3/g, 'ó')
    .replace(/\u00c3\u00ba/g, 'ú')
    .replace(/\u00c3\u00b1/g, 'ñ')
    .replace(/\u00c3\u0091/g, 'Ñ')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã‘/g, 'Ñ');

  clean = clean
    .replace(/\u00c3\u0192\u00c2\u00b3/g, 'ó')
    .replace(/\u00c3\u0192\u00c2\u00a1/g, 'á')
    .replace(/\u00c3\u0192\u00c2\u00a9/g, 'é')
    .replace(/\u00c3\u0192\u00c2\u00ad/g, 'í')
    .replace(/\u00c3\u0192\u00c2\u00ba/g, 'ú')
    .replace(/\u00c3\u0192\u00c2\u00b1/g, 'ñ')
    .replace(/ÃƒÂ³/g, 'ó')
    .replace(/ÃƒÂ¡/g, 'á')
    .replace(/ÃƒÂ©/g, 'é')
    .replace(/ÃƒÂ­/g, 'í')
    .replace(/ÃƒÂº/g, 'ú')
    .replace(/ÃƒÂ±/g, 'ñ');

  // 5. Clean up HTML entities and tags
  clean = clean
    .replace(/&nbsp;/g, ' ')
    .replace(/<div[^>]*>/g, '')
    .replace(/<\/div>/g, '\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // Remove other control words
  clean = clean
    .replace(/\\[a-z0-9]+/g, ' ')  // Remove remaining \control tags
    .replace(/[{}]/g, ' ')         // Remove braces
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  return clean;
}

function parseDateStr(dateStr) {
  try {
    if (dateStr.includes('/')) {
      const [datePart, timePart] = dateStr.trim().split(/\s+/);
      const [day, month, year] = datePart.split('/').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);
      return new Date(year, month - 1, day, hour, minute);
    } else {
      const [datePart, timePart] = dateStr.trim().split(/\s+/);
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);
      return new Date(year, month - 1, day, hour, minute);
    }
  } catch (e) {
    return new Date();
  }
}

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

function extractWeightHeight(text) {
  let peso = null;
  let talla = null;
  
  // Weight regexes
  const wMatch1 = text.match(/Peso\s*\[kg\]:\s*(\d+(?:\.\d+)?)/i);
  const wMatch2 = text.match(/Peso:\s*(\d+(?:\.\d+)?)\s*(?:kg|kg\b)/i);
  const wMatch3 = text.match(/Peso\s*\(Control\):\s*(\d+(?:\.\d+)?)\s*(?:kg|kg\b)/i);
  
  if (wMatch1) peso = parseFloat(wMatch1[1]);
  else if (wMatch2) peso = parseFloat(wMatch2[1]);
  else if (wMatch3) peso = parseFloat(wMatch3[1]);
  
  // Height regexes
  const hMatch1 = text.match(/Estatura\s*\[cm\]:\s*(\d+)/i);
  const hMatch2 = text.match(/Estatura:\s*(\d+)\s*(?:cms|cm)/i);
  const hMatch3 = text.match(/Estatura:\s*(\d\.\d{2})\s*(?:m|mts)/i);
  
  if (hMatch1) talla = parseInt(hMatch1[1], 10);
  else if (hMatch2) talla = parseInt(hMatch2[1], 10);
  else if (hMatch3) talla = Math.round(parseFloat(hMatch3[1]) * 100);
  
  return { peso, talla };
}

function normalizeWeightHeight(rawPeso, rawTalla) {
  let peso = rawPeso || 0;
  if (peso > 1000) peso = peso / 1000;
  if (peso > 999.9) peso = 999.9;
  
  let talla = rawTalla || 0;
  if (talla > 0 && talla < 3) talla = talla * 100;
  const tallaInt = talla ? Math.round(talla) : null;
  
  let imc = 0;
  if (peso > 0 && talla > 0) {
    const hM = talla / 100;
    imc = Number((peso / (hM * hM)).toFixed(2));
  }
  if (imc > 99.99) imc = 99.99;
  
  return { peso: peso || null, talla: tallaInt || null, imc: imc || null };
}

function mapTipoQx(name) {
  if (!name) return 'Otra';
  const lower = name.toLowerCase();
  if (lower.includes('bypass') || lower.includes('by pass') || lower.includes('bagua')) return 'Bypass Gástrico';
  if (lower.includes('manga') || lower.includes('sleeve')) return 'Manga Gástrica';
  if (lower.includes('sadi')) return 'SADI-S';
  if (lower.includes('balon') || lower.includes('balón')) return 'Balón Intragástrico';
  return 'Otra';
}


// ─── MAIN MIGRATION ───────────────────────────────────────────────────────────

async function runMigration() {
  console.log('STARTING MIGRATION PROCESS FROM EXCEL & RTF BACKUP...');

  // 0. CLEANUP EXISTING DATA (except system admin)
  console.log('\n--- 0. Cleaning up existing test data ---');
  
  const tablesToClear = [
    { table: 'evoluciones', col: 'id_paciente' },
    { table: 'historias_clinicas', col: 'id_paciente' },
    { table: 'turnos', col: 'id_paciente' },
    { table: 'cirugias', col: 'id_paciente' },
    { table: 'nutricion_info', col: 'id_paciente' },
    { table: 'psicologia_info', col: 'id_paciente' },
    { table: 'estudios', col: 'id_paciente' },
    { table: 'informes', col: 'id_paciente' },
    { table: 'crm_contactos', col: 'id_contacto' },
    { table: 'tareas', col: 'id_paciente' },
    { table: 'carpetas_quirurgicas', col: 'id_paciente' },
    { table: 'pacientes', col: 'id_paciente' }
  ];

  for (const { table, col } of tablesToClear) {
    console.log(`Clearing table: ${table}...`);
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .neq(col, 'dummy-value-nonexistent-xyz');
      
    if (deleteError) {
      console.error(`Error clearing table ${table}:`, deleteError.message);
    } else {
      console.log(`Cleared table ${table} successfully`);
    }
  }

  // Clear professionals except admin
  console.log('Clearing professionals (except admin)...');
  const { error: profClearError } = await supabase
    .from('profesionales')
    .delete()
    .neq('email', 'admin@clinicabariatrica.com');
    
  if (profClearError) {
    console.error('Error clearing professionals:', profClearError.message);
  } else {
    console.log('Cleared table profesionales successfully');
  }
  
  // 1. MIGRATE MEDICOS.xls -> profesionales
  console.log('\n--- 1. Migrating professionals (MEDICOS.xls) ---');
  const medicosWorkbook = XLSX.readFile(path.join(dataDir, 'MEDICOS.xls'));
  const medicosSheet = medicosWorkbook.Sheets[medicosWorkbook.SheetNames[0]];
  const medicosData = XLSX.utils.sheet_to_json(medicosSheet);
  
  const doctorInitialsToEmail = {};
  const doctorIdToEmail = {};
  const doctorIdToName = {};
  const activeDoctorEmails = new Set();
  
  activeDoctorEmails.add('admin@clinicabariatrica.com');
  
  for (const doc of medicosData) {
    const email = doc.MAIL ? doc.MAIL.trim().toLowerCase() : `medico_${doc.ID}@plenus.ar`;
    const initials = doc.INICIALES ? doc.INICIALES.trim().toUpperCase() : '';
    const fullName = `${doc.NOMBRE} ${doc.APELLIDO}`;
    
    doctorInitialsToEmail[initials] = email;
    doctorIdToEmail[doc.ID] = email;
    doctorIdToName[doc.ID] = fullName;
    activeDoctorEmails.add(email);
    
    let rol = 'Médico';
    const esp = doc.ESPECIALIDAD ? doc.ESPECIALIDAD.trim().toLowerCase() : '';
    if (esp.includes('admin')) {
      rol = 'Administrativo';
    }
    
    const password = doc.PASS ? String(doc.PASS).trim() : `plenus_${doc.ID}`;
    const finalPassword = password.length >= 6 ? password : `${password}12345`;
    
    console.log(`Professional: ${doc.APELLIDO}, ${doc.NOMBRE} (${initials}) -> Email: ${email} (Auth PASS: ${finalPassword})`);
    
    // Create login in Supabase Auth
    const { error: authError } = await supabaseSignUpClient.auth.signUp({
      email,
      password: finalPassword,
      options: { data: { nombre: `${doc.NOMBRE} ${doc.APELLIDO}` } },
    });
    
    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already exists') || authError.message.includes('Email link is invalid')) {
        console.log(`Auth login for ${email} already existed.`);
      } else {
        console.error(`Error creating auth login for ${email}:`, authError.message);
      }
    } else {
      console.log(`Auth login for ${email} created successfully.`);
    }
    
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
      console.error(`Error inserting professional ${email}:`, profError.message);
    }
  }

  // Manual overrides for initials mismatch in RTF files
  doctorInitialsToEmail['AJD'] = 'adiaz@plenus.ar';
  doctorInitialsToEmail['MPS'] = 'psosa@plenus.ar';
  doctorInitialsToEmail['PJT'] = 'medico_11@plenus.ar';
  doctorInitialsToEmail['EP'] = 'epuertas@plenus.ar';

  // 1b. LOAD PATIENT TAGS MAPPING FROM PACIENTES_ETIQUETAS.xls
  console.log('\n--- 1b. Loading Patient Tags (PACIENTES_ETIQUETAS.xls) ---');
  const tagsWorkbook = XLSX.readFile(path.join(dataDir, 'PACIENTES_ETIQUETAS.xls'));
  const tagsSheet = tagsWorkbook.Sheets[tagsWorkbook.SheetNames[0]];
  const tagsData = XLSX.utils.sheet_to_json(tagsSheet);
  
  const nrohcToTagId = {};
  tagsData.forEach(row => {
    nrohcToTagId[row.ID_PACIENTE] = row.ID_ETIQUETA;
  });
  console.log(`Loaded ${Object.keys(nrohcToTagId).length} patient tag mappings.`);

  // 1c. PRE-BUILD SURGERY LIST (to identify POSTBARIATRICO patients)
  console.log('\n--- 1c. Loading Bariatric Surgeries for Tag Overrides ---');
  const barDatosWorkbook = XLSX.readFile(path.join(dataDir, 'BAR_DATOS.xls'));
  const barDatosSheet = barDatosWorkbook.Sheets[barDatosWorkbook.SheetNames[0]];
  const barDatosData = XLSX.utils.sheet_to_json(barDatosSheet);
  const barDatosMap = {};
  barDatosData.forEach(row => {
    barDatosMap[row.ID] = row;
  });

  const barQxWorkbook = XLSX.readFile(path.join(dataDir, 'BAR_CIRUGIA.xls'));
  const barQxSheet = barQxWorkbook.Sheets[barQxWorkbook.SheetNames[0]];
  const barQxData = XLSX.utils.sheet_to_json(barQxSheet);

  const patientsWithSurgeries = new Set();
  barQxData.forEach(qx => {
    const datosRow = barDatosMap[qx.ID_PROCEDIMIENTO];
    if (datosRow && datosRow.NROHC && qx.FECHAQX) {
      patientsWithSurgeries.add(datosRow.NROHC);
    }
  });

  console.log(`Loaded ${patientsWithSurgeries.size} patients with surgery records.`);

    // Phone helpers for robust mapping
    function cleanPhone(val) {
      if (!val) return '';
      return String(val).replace(/\D/g, '');
    }

    function formatPhone(phone, ddi) {
      let cleaned = cleanPhone(phone);
      if (!cleaned || cleaned.length < 6) return '';
      
      if (cleaned.startsWith('15') && cleaned.length === 9) {
        cleaned = cleaned.slice(2);
      }
      
      let cleanedDdi = cleanPhone(ddi);
      
      // Default to Tucumán area code 381 if no DDI is specified and number has 7/8 digits
      if (!cleanedDdi && (cleaned.length === 7 || cleaned.length === 8)) {
        cleanedDdi = '381';
      }
      
      if (cleanedDdi && !cleaned.startsWith(cleanedDdi)) {
        return `${cleanedDdi}${cleaned}`;
      }
      return cleaned;
    }

    function getPatientPhone(p) {
      const whatsapp = formatPhone(p.WHATSAPP, p.DDI);
      if (whatsapp) return whatsapp;
      
      const tel2 = formatPhone(p.TEL2, p.DDI2 || p.DDI);
      if (tel2) return tel2;
      
      const tel = formatPhone(p.TEL, p.DDI);
      if (tel) return tel;
      
      return '';
    }

    function getPatientPhone2(p) {
      const mainPhone = getPatientPhone(p);
      const candidates = [
        formatPhone(p.WHATSAPP, p.DDI),
        formatPhone(p.TEL2, p.DDI2 || p.DDI),
        formatPhone(p.TEL, p.DDI)
      ].filter(val => val && val.length >= 6 && val !== mainPhone);
      
      return candidates[0] || null;
    }

    // 2. MIGRATE PACIENTES.xls -> pacientes
    console.log('\n--- 2. Migrating patients (PACIENTES.xls) ---');
  const pacientesWorkbook = XLSX.readFile(path.join(dataDir, 'PACIENTES.xls'));
  const pacientesSheet = pacientesWorkbook.Sheets[pacientesWorkbook.SheetNames[0]];
  const pacientesData = XLSX.utils.sheet_to_json(pacientesSheet);
  
  const realPatients = pacientesData.filter(p => {
    if (!p.NROHC || p.NROHC <= 0) return false;
    const apellido = p.APELLIDO ? String(p.APELLIDO).trim() : '';
    const nombre = p.NOMBRE ? String(p.NOMBRE).trim() : '';
    // Filter out if name/apellido starts with symbols like -, ., /, *
    if (/^[-\.\/\*]/.test(apellido) || /^[-\.\/\*]/.test(nombre)) {
      return false;
    }
    // Filter out if name or apellido is empty or consists purely of symbols/spaces
    if (!apellido.replace(/[-\.\/\*\s]/g, '') || !nombre.replace(/[-\.\/\*\s]/g, '')) {
      return false;
    }
    return true;
  });
  console.log(`Found ${realPatients.length} valid patients to migrate.`);

  const nrohcToUuid = {};
  const batchSize = 100;
  const seenDnis = new Set();
  
  for (let i = 0; i < realPatients.length; i += batchSize) {
    const batch = realPatients.slice(i, i + batchSize);
    const insertPayload = batch.map(p => {
      let dob = null;
      if (p.FENAC) {
        const d = excelDateToJSDate(p.FENAC);
        if (d) dob = d.toISOString().split('T')[0];
      }
      
      let sexoStr = null;
      if (p.SEXO === 1) sexoStr = 'Masculino';
      if (p.SEXO === 2) sexoStr = 'Femenino';
      
      const drEmail = doctorIdToEmail[p.ID_MEDICO] || null;
      
      let docStr = p.DOC ? String(p.DOC).trim() : '';
      if (docStr.endsWith('.0')) {
        docStr = docStr.slice(0, -2);
      }
      if (docStr === '0' || docStr === '' || docStr === 'null' || docStr === 'undefined') {
        docStr = `N/A-${p.NROHC}`;
      }
      if (seenDnis.has(docStr)) {
        docStr = `${docStr}-DUP-${p.NROHC}`;
      }
      seenDnis.add(docStr);
      
      const pacId = `P-${p.NROHC}`;
      
      // Determine active tag from PACIENTES_ETIQUETAS.xls
      const tagId = nrohcToTagId[p.NROHC];
      let tagStr = 'NUEVO_INGRESO';
      if (tagId === 11) tagStr = 'BARIATRICO_PRIMERA_VEZ';
      else if (tagId === 12 || tagId === 5) tagStr = 'PREBARIATRICO_INICIAL';
      else if (tagId === 13) tagStr = 'PREBARIATRICO_AVANZADO';
      else if (tagId === 15) tagStr = 'DEFINIR_CIRUGIA';
      else if (tagId === 7) tagStr = 'PERIOPERATORIO';
      else if (tagId === 6) tagStr = 'POSBARIATRICO';
      
      // Safety Override: Patients with surgery records are POSBARIATRICO
      if (patientsWithSurgeries.has(p.NROHC)) {
        tagStr = 'POSBARIATRICO';
      }
      
      return {
        id_paciente: pacId,
        apellido: p.APELLIDO ? p.APELLIDO.trim().toUpperCase() : '(SIN APELLIDO)',
        nombres: p.NOMBRE ? p.NOMBRE.trim() : '(SIN NOMBRE)',
        dni: docStr,
        fecha_nacimiento: dob,
        direccion: p.DOMICILIO || null,
        obra_social: p.OS || '',
        nro_afiliado: p.NROOS ? String(p.NROOS).trim() : '',
        telefono: getPatientPhone(p),
        email: p.EMAIL || '',
        nro_hc: p.NROHC,
        sexo: sexoStr,
        ocupacion: p.OCUPACION || null,
        localidad: p.LOCALIDAD || null,
        cp: p.CP ? String(p.CP) : null,
        telefono_2: getPatientPhone2(p),
        etiqueta_activa: tagStr,
        cirujano_asignado_email: drEmail,
      };
    });
    
    const { error: insertError } = await supabase
      .from('pacientes')
      .insert(insertPayload);
      
    if (insertError) {
      console.error(`Error inserting patient batch starting at index ${i}:`, insertError.message);
    } else {
      batch.forEach(p => {
        nrohcToUuid[p.NROHC] = `P-${p.NROHC}`;
      });

      const crmPayload = batch.map(p => ({
        id_contacto: `P-${p.NROHC}`,
        is_patient: true,
        prioridad: 'Normal',
        fecha_ingreso: new Date().toISOString().split('T')[0]
      }));

      const { error: crmError } = await supabase
        .from('crm_contactos')
        .insert(crmPayload);

      if (crmError) {
        console.error(`Error inserting crm_contactos batch starting at index ${i}:`, crmError.message);
      }
    }
  }
  
  console.log(`Successfully mapped ${Object.keys(nrohcToUuid).length} patients to database IDs.`);

  // 3. CONSOLIDATE HISTORIAS CLINICAS IN MEMORY
  console.log('\n--- 3. Consolidating clinical histories from Excel sheets ---');
  
  const nrohcToHistory = {};

  // Source 1: BAR_CONTROLPESOPRE.xls (Baseline weight controls)
  const preWb = XLSX.readFile(path.join(dataDir, 'BAR_CONTROLPESOPRE.xls'));
  const preData = XLSX.utils.sheet_to_json(preWb.Sheets[preWb.SheetNames[0]]);
  // Sort descending so earlier dates processed last and overwrite later ones
  preData.sort((a, b) => (b.FECHA || 0) - (a.FECHA || 0));
  preData.forEach(row => {
    if (row.NROHC && (row.PESO || row.TALLA)) {
      nrohcToHistory[row.NROHC] = {
        peso: row.PESO,
        talla: row.TALLA,
        antecedentesMedicos: '',
        antecedentesQuirurgicos: '',
      };
    }
  });

  // Source 2: BAR_DATOS.xls (Bariatric Baseline)
  barDatosData.forEach(row => {
    if (row.NROHC && (row.PESO || row.TALLA)) {
      nrohcToHistory[row.NROHC] = {
        peso: row.PESO || (nrohcToHistory[row.NROHC]?.peso),
        talla: row.TALLA || (nrohcToHistory[row.NROHC]?.talla),
        antecedentesMedicos: '',
        antecedentesQuirurgicos: '',
      };
    }
  });

  // Source 3: CLI_ANTECEDENTES.xls (General Clinical History)
  const antWb = XLSX.readFile(path.join(dataDir, 'CLI_ANTECEDENTES.xls'));
  const antData = XLSX.utils.sheet_to_json(antWb.Sheets[antWb.SheetNames[0]]);
  antData.forEach(row => {
    if (row.NROHC) {
      const list = [];
      if (row.ANT_HABITOSYRIESGO && row.ANT_HABITOSYRIESGO !== 'NO') list.push(`Hábitos/Riesgos: ${row.ANT_HABITOSYRIESGO}`);
      if (row.ANT_PATERNOS) list.push(`Antecedentes Paternos: ${row.ANT_PATERNOS}`);
      if (row.ANT_MATERNOS) list.push(`Antecedentes Maternos: ${row.ANT_MATERNOS}`);
      if (row.ANT_FAMILIARES) list.push(`Antecedentes Familiares: ${row.ANT_FAMILIARES}`);
      if (row.ANT_INFANCIA) list.push(`Infancia: ${row.ANT_INFANCIA}`);
      if (row.ANT_ADULTEZ) list.push(`Adultez: ${row.ANT_ADULTEZ}`);
      
      const antMedicos = list.join('\n');
      
      nrohcToHistory[row.NROHC] = {
        peso: row.PESO || (nrohcToHistory[row.NROHC]?.peso),
        talla: row.ALTURA || (nrohcToHistory[row.NROHC]?.talla),
        antecedentesMedicos: antMedicos,
        antecedentesQuirurgicos: row.ANT_QUIRURGICOS || '',
      };
    }
  });

  // 4. PROCESS RTF CLINICAL HISTORIES -> evoluciones (and extract weight/height if missing)
  console.log('\n--- 4. Processing RTF clinical files (Plenus folder) ---');
  let totalEvolucionesParsed = 0;
  const evolucionesPayloads = [];
  
  if (fs.existsSync(plenusDir)) {
    const rtfFiles = fs.readdirSync(plenusDir).filter(f => f.toLowerCase().endsWith('.rtf'));
    console.log(`Found ${rtfFiles.length} RTF history files to parse.`);
    
    rtfFiles.forEach((file, idx) => {
      const parts = file.split('-');
      if (parts.length < 2) return;
      
      const nrohc = parseInt(parts[0].trim(), 10);
      if (isNaN(nrohc)) return;
      
      const uuid = nrohcToUuid[nrohc];
      if (!uuid) return;
      
      const filePath = path.join(plenusDir, file);
      const content = fs.readFileSync(filePath, 'latin1');
      
      // 4a. If empty header (no notes), skip completely to avoid empty placeholders
      if (isRTFEmptyHeader(content)) {
        return;
      }

      // 4b. Extract weight/height if they are missing in Excel sources
      const existingHistory = nrohcToHistory[nrohc];
      if (!existingHistory || !existingHistory.peso || !existingHistory.talla) {
        const { peso: extPeso, talla: extTalla } = extractWeightHeight(content);
        if (extPeso || extTalla) {
          if (!nrohcToHistory[nrohc]) {
            nrohcToHistory[nrohc] = { peso: extPeso, talla: extTalla, antecedentesMedicos: '', antecedentesQuirurgicos: '' };
          } else {
            if (!nrohcToHistory[nrohc].peso) nrohcToHistory[nrohc].peso = extPeso;
            if (!nrohcToHistory[nrohc].talla) nrohcToHistory[nrohc].talla = extTalla;
          }
        }
      }
      
      // 4c. Find entries using unified regex supporting YYYY-MM-DD and DD/MM/YYYY
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
          
          evolucionesPayloads.push({
            id_paciente: uuid,
            fecha_consulta: dateISO,
            profesional_email: authorEmail,
            especialidad: esp,
            nota_clinica: cleaned,
            nota_confidencial: '',
            is_deleted: false
          });
          totalEvolucionesParsed++;
        }
      }
    });
  } else {
    console.log('Plenus folder not found. Skipping RTF clinical parsing.');
  }

  // 5. INSERT COLLECTED HISTORIAS CLINICAS
  console.log('\n--- 5. Uploading clinical histories ---');
  const historyPayloads = [];
  for (const [nrohcStr, data] of Object.entries(nrohcToHistory)) {
    const nrohc = parseInt(nrohcStr, 10);
    const uuid = nrohcToUuid[nrohc];
    if (!uuid) continue;
    
    // Normalize measurements
    const norm = normalizeWeightHeight(data.peso, data.talla);
    
    historyPayloads.push({
      id_paciente: uuid,
      peso_inicial: norm.peso,
      talla_cm: norm.talla,
      imc_inicial: norm.imc,
      comorbilidades: [],
      antecedentes_medicos: data.antecedentesMedicos || '',
      antecedentes_quirurgicos: data.antecedentesQuirurgicos || '',
      medicacion_cronica: '',
      antecedentes_nutricionales: ''
    });
  }

  for (let i = 0; i < historyPayloads.length; i += batchSize) {
    const batch = historyPayloads.slice(i, i + batchSize);
    const { error: histError } = await supabase.from('historias_clinicas').insert(batch);
    if (histError) console.error(`Error inserting history batch at ${i}:`, histError.message);
  }
  console.log(`Successfully inserted ${historyPayloads.length} patient clinical histories.`);

  // 6. UPLOAD EVOLUCIONES CLINICAS
  console.log('\n--- 6. Uploading clinical evolutions (consultations) ---');
  for (let i = 0; i < evolucionesPayloads.length; i += batchSize) {
    const batch = evolucionesPayloads.slice(i, i + batchSize);
    const { error: evError } = await supabase.from('evoluciones').insert(batch);
    if (evError) console.error(`Error inserting evoluciones batch at ${i}:`, evError.message);
  }
  console.log(`Successfully inserted ${evolucionesPayloads.length} consultation entries.`);

  // 7. MIGRATE TURNOS.xls -> turnos
  console.log('\n--- 7. Migrating appointments (TURNOS.xls) ---');
  const turnosWorkbook = XLSX.readFile(path.join(dataDir, 'TURNOS.xls'));
  const turnosSheet = turnosWorkbook.Sheets[turnosWorkbook.SheetNames[0]];
  const turnosData = XLSX.utils.sheet_to_json(turnosSheet);
  
  const turnosPayloads = [];
  for (const t of turnosData) {
    const uuid = nrohcToUuid[t.ID_PACIENTE];
    if (!uuid) continue;
    
    const drEmail = doctorInitialsToEmail[t.MEDICO ? t.MEDICO.trim().toUpperCase() : ''] || 'admin@clinicabariatrica.com';
    
    let fecha = null;
    if (t.FECHA) {
      const d = excelDateToJSDate(t.FECHA);
      if (d) fecha = d.toISOString();
    }
    
    if (!fecha) continue;
    
    let horaLlegada = null;
    let horaAtencion = null;
    let estado = 'AGENDADO';
    
    if (t.AUSENTE === 1) {
      estado = 'AUSENTE';
    } else if (t.ATENDIDO && t.ATENDIDO !== 0) {
      estado = 'ATENDIDO';
      const dAtendido = excelDateToJSDate(t.ATENDIDO);
      if (dAtendido) {
        horaAtencion = dAtendido.toISOString();
        horaLlegada = dAtendido.toISOString();
      }
    } else if (t.LLEGO && t.LLEGO !== 0) {
      estado = 'EN_ESPERA';
      const dLlego = excelDateToJSDate(t.LLEGO);
      if (dLlego) horaLlegada = dLlego.toISOString();
    } else if (t.CONFIRMADO === 1) {
      estado = 'CONFIRMADO';
    }
    
    turnosPayloads.push({
      id_paciente: uuid,
      fecha_turno: fecha,
      profesional_email: drEmail,
      especialidad: 'Consulta',
      estado,
      creado_por_email: 'admin@clinicabariatrica.com',
      valor_cobrado: t.PAGO || 0,
      metodo_pago: 'Efectivo',
      nota_interna: t.OBS || '',
      hora_llegada: horaLlegada,
      hora_atencion: horaAtencion,
      es_videoconsulta: false,
      es_sobreturno: t.SOBRETURNO === 1
    });
  }
  
  for (let i = 0; i < turnosPayloads.length; i += batchSize) {
    const batch = turnosPayloads.slice(i, i + batchSize);
    const { error: turnError } = await supabase.from('turnos').insert(batch);
    if (turnError) console.error(`Error inserting turnos batch at ${i}:`, turnError.message);
  }
  console.log(`Migrated ${turnosPayloads.length} turnos.`);

  // 8. MIGRATE BAR_CIRUGIA.xls & BAR_DATOS.xls -> cirugias
  console.log('\n--- 8. Migrating bariatric surgery logs (BAR_CIRUGIA & BAR_DATOS) ---');
  
  const tipoQxWorkbook = XLSX.readFile(path.join(masterDir, 'M_BAR_TIPOSCIRUGIA.xls'));
  const tipoQxSheet = tipoQxWorkbook.Sheets[tipoQxWorkbook.SheetNames[0]];
  const tipoQxData = XLSX.utils.sheet_to_json(tipoQxSheet);
  const tipoQxIdToName = {};
  tipoQxData.forEach(row => {
    tipoQxIdToName[row.ID] = row.TIPOCIRUGIA;
  });

  const cirugiasPayloads = [];
  const seenCirugias = new Set();
  
  for (const qx of barQxData) {
    const datosRow = barDatosMap[qx.ID_PROCEDIMIENTO];
    if (!datosRow) continue;
    
    const nrohc = datosRow.NROHC;
    const uuid = nrohcToUuid[nrohc];
    if (!uuid) continue;
    
    if (seenCirugias.has(uuid)) continue;
    seenCirugias.add(uuid);
    
    let fechaQx = null;
    if (qx.FECHAQX) {
      const d = excelDateToJSDate(qx.FECHAQX);
      if (d) fechaQx = d.toISOString().split('T')[0];
    }
    
    let fechaQxProg = null;
    if (qx.FECHAQXPROGRAMADA) {
      const d = excelDateToJSDate(qx.FECHAQXPROGRAMADA);
      if (d) fechaQxProg = d.toISOString().split('T')[0];
    }

    if (!fechaQx && !fechaQxProg) {
      continue; // Skip empty/garbage surgery logs
    }
    
    const qxTypeName = tipoQxIdToName[qx.TIPOQX] || 'Otra';
    const bariatricType = mapTipoQx(qxTypeName);
    
    cirugiasPayloads.push({
      id_paciente: uuid,
      fecha_programada: fechaQxProg,
      fecha_realizada: fechaQx,
      tipo_cirugia: bariatricType,
      notas: qx.OBSERVACIONESQX || '',
      nombre_archivo_protocolo: ''
    });
  }

  
  for (let i = 0; i < cirugiasPayloads.length; i += batchSize) {
    const batch = cirugiasPayloads.slice(i, i + batchSize);
    const { error: qxError } = await supabase.from('cirugias').insert(batch);
    if (qxError) console.error(`Error inserting surgery batch at ${i}:`, qxError.message);
  }
  console.log(`Migrated ${cirugiasPayloads.length} surgery logs.`);

  // 9. POPULATE NUTRICION_INFO & PSICOLOGIA_INFO
  console.log('\n--- 9. Populating Nutrition and Psychology Specialty files ---');
  
  // Load nutrition habits from BAR_ANTECEDENTES.xls
  const anteWorkbook = XLSX.readFile(path.join(dataDir, 'BAR_ANTECEDENTES.xls'));
  const anteSheet = anteWorkbook.Sheets[anteWorkbook.SheetNames[0]];
  const anteData = XLSX.utils.sheet_to_json(anteSheet);
  const anteMap = {};
  anteData.forEach(row => {
    anteMap[row.NROHC] = row.HABITOSALIMENTARIOS || '';
  });

  const nutricionPayloads = [];
  const psicologiaPayloads = [];
  const seenNutrition = new Set();
  const seenPsicologia = new Set();

  for (const [idProc, datosRow] of Object.entries(barDatosMap)) {
    const nrohc = datosRow.NROHC;
    const uuid = nrohcToUuid[nrohc];
    if (!uuid) continue;

    // Nutrition Info
    if (datosRow.CINTURA || datosRow.CUELLO || anteMap[nrohc]) {
      if (!seenNutrition.has(uuid)) {
        seenNutrition.add(uuid);
        nutricionPayloads.push({
          id_paciente: uuid,
          perimetro_cintura: datosRow.CINTURA || null,
          perimetro_cuello: datosRow.CUELLO || null,
          composicion_corporal: '',
          habitos_alimentarios: anteMap[nrohc] || '',
          habitos_ejercicio: ''
        });
      }
    }

    // Psychology Info
    if (datosRow.ANTECEDENTESPSICOLOGICOS || datosRow.DIAGNOSTICOPSIQUIATRICO || datosRow.OTRODIAGPSICO) {
      if (!seenPsicologia.has(uuid)) {
        seenPsicologia.add(uuid);
        
        const psiNotes = [];
        if (datosRow.ANTECEDENTESPSICOLOGICOS) psiNotes.push(`Antecedentes: ${datosRow.ANTECEDENTESPSICOLOGICOS}`);
        if (datosRow.DIAGNOSTICOPSIQUIATRICO) psiNotes.push(`Diagnóstico Psiquiátrico: ${datosRow.DIAGNOSTICOPSIQUIATRICO}`);
        if (datosRow.OTRODIAGPSICO) psiNotes.push(`Otro Diagnóstico: ${datosRow.OTRODIAGPSICO}`);
        
        // Find assigned psychologist email
        const psiInitials = datosRow.QUIENINFORMEPSICOLOGO ? String(datosRow.QUIENINFORMEPSICOLOGO).trim().toUpperCase() : '';
        const psiAuthor = doctorInitialsToEmail[psiInitials] || 'admin@clinicabariatrica.com';

        psicologiaPayloads.push({
          id_paciente: uuid,
          psicologo_email_autor: psiAuthor,
          notas_privadas: psiNotes.join('\n')
        });
      }
    }
  }

  // Upload nutrition files
  for (let i = 0; i < nutricionPayloads.length; i += batchSize) {
    const batch = nutricionPayloads.slice(i, i + batchSize);
    const { error: nutError } = await supabase.from('nutricion_info').insert(batch);
    if (nutError) console.error(`Error inserting nutrition batch at ${i}:`, nutError.message);
  }

  // Upload psychology files
  for (let i = 0; i < psicologiaPayloads.length; i += batchSize) {
    const batch = psicologiaPayloads.slice(i, i + batchSize);
    const { error: psiError } = await supabase.from('psicologia_info').insert(batch);
    if (psiError) console.error(`Error inserting psychology batch at ${i}:`, psiError.message);
  }

  console.log(`Migrated ${nutricionPayloads.length} nutrition files and ${psicologiaPayloads.length} psychology notes.`);

  // 10. MIGRATE CARPETAS QUIRURGICAS
  console.log('\n--- 10. Migrating clinical folders (carpetas_quirurgicas) ---');
  
  const carpetasPayloads = [];
  const seenCarpetas = new Set();
  
  for (const datosRow of barDatosData) {
    const nrohc = datosRow.NROHC;
    const uuid = nrohcToUuid[nrohc];
    if (!uuid) continue;
    
    // Check if they have folder-related dates
    if (datosRow.FECHARECEPCION || datosRow.FECHAENTREGACARPETA || datosRow.FECHARTAFINANCIADORA || datosRow.FECHAINFORMECIRUJANO || datosRow.FECHAINFORMENUTRICION || datosRow.FECHAINFORMEPSICOLOGO) {
      if (seenCarpetas.has(uuid)) continue;
      seenCarpetas.add(uuid);
      
      let fechaPedido = null;
      if (datosRow.FECHARECEPCION) {
        const d = excelDateToJSDate(datosRow.FECHARECEPCION);
        if (d) fechaPedido = d.toISOString().split('T')[0];
      }
      
      let fechaEntrega = null;
      if (datosRow.FECHAENTREGACARPETA) {
        const d = excelDateToJSDate(datosRow.FECHAENTREGACARPETA);
        if (d) fechaEntrega = d.toISOString().split('T')[0];
      }
      
      let fechaAutorizacion = null;
      if (datosRow.FECHARTAFINANCIADORA) {
        const d = excelDateToJSDate(datosRow.FECHARTAFINANCIADORA);
        if (d) fechaAutorizacion = d.toISOString().split('T')[0];
      }
      
      // Determine tracking state
      let trackingState = 'No Presentada';
      if (fechaAutorizacion) trackingState = 'Autorizada';
      else if (fechaEntrega) trackingState = 'Entregada al Paciente';
      else if (fechaPedido) trackingState = 'Pedido Generado';
      
      // Determine checklist reports
      const infCir = datosRow.FECHAINFORMECIRUJANO ? 'Recibido' : 'Pendiente';
      const infNut = datosRow.FECHAINFORMENUTRICION ? 'Recibido' : 'Pendiente';
      const infPsi = datosRow.FECHAINFORMEPSICOLOGO ? 'Recibido' : 'Pendiente';
      
      const checklist = {
        consentimiento: 'Pendiente',
        presupuesto: 'Pendiente',
        informeCirujano: infCir,
        informeNutricionista: infNut,
        informePsicologo: infPsi
      };
      
      const cirId = datosRow.QUIENINFORMECIRUJANO ? String(datosRow.QUIENINFORMECIRUJANO).trim() : '';
      const cirujanoNombre = doctorIdToName[cirId] || '';
      
      const nutId = datosRow.QUIENINFORMENUTRICION ? String(datosRow.QUIENINFORMENUTRICION).trim() : '';
      const nutricionistaNombre = doctorIdToName[nutId] || '';
      
      const psiId = datosRow.QUIENINFORMEPSICOLOGO ? String(datosRow.QUIENINFORMEPSICOLOGO).trim() : '';
      const psicologoNombre = doctorIdToName[psiId] || '';
      
      carpetasPayloads.push({
        id_paciente: uuid,
        estado_tracking: trackingState,
        checklist: checklist,
        fecha_pedido: fechaPedido,
        fecha_entrega_paciente: fechaEntrega,
        fecha_presentacion_os: null,
        fecha_autorizacion: fechaAutorizacion,
        link_drive: '',
        notas: datosRow.OBSERVACIONESCIRUJANO || '',
        cirujano_nombre: cirujanoNombre,
        nutricionista_nombre: nutricionistaNombre,
        psicologo_nombre: psicologoNombre,
        fecha_cirugia_programada: null,
        hora_cirugia_programada: null
      });
    }
  }
  
  for (let i = 0; i < carpetasPayloads.length; i += batchSize) {
    const batch = carpetasPayloads.slice(i, i + batchSize);
    const { error: carpError } = await supabase.from('carpetas_quirurgicas').insert(batch);
    if (carpError) console.error(`Error inserting carpetas batch at ${i}:`, carpError.message);
  }
  console.log(`Migrated ${carpetasPayloads.length} patient clinical folders.`);

  console.log('\n=========================================');
  console.log('MIGRATION COMPLETED SUCCESSFULLY!');
  console.log('=========================================');
}

runMigration().catch(err => {
  console.error('Migration failed with critical error:', err);
});
