const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function fetchAllPatients() {
  let allPatients = [];
  let from = 0;
  const batchSize = 1000;
  let finished = false;

  while (!finished) {
    const to = from + batchSize - 1;
    console.log(`Fetching patients from ${from} to ${to}...`);
    const { data, error } = await supabase
      .from('pacientes')
      .select('id_paciente, created_at')
      .range(from, to);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      finished = true;
    } else {
      allPatients = allPatients.concat(data);
      if (data.length < batchSize) {
        finished = true;
      } else {
        from += batchSize;
      }
    }
  }
  return allPatients;
}

async function fetchAllContacts() {
  let allContacts = [];
  let from = 0;
  const batchSize = 1000;
  let finished = false;

  while (!finished) {
    const to = from + batchSize - 1;
    console.log(`Fetching crm_contactos from ${from} to ${to}...`);
    const { data, error } = await supabase
      .from('crm_contactos')
      .select('id_contacto')
      .range(from, to);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      finished = true;
    } else {
      allContacts = allContacts.concat(data);
      if (data.length < batchSize) {
        finished = true;
      } else {
        from += batchSize;
      }
    }
  }
  return allContacts;
}

async function run() {
  try {
    console.log('Fetching patients...');
    const patients = await fetchAllPatients();
    console.log(`Found ${patients.length} patients in total.`);

    console.log('Fetching crm_contactos...');
    const contacts = await fetchAllContacts();
    console.log(`Found ${contacts.length} crm_contactos in total.`);

    const existingContactIds = new Set(contacts.map(c => c.id_contacto));
    const missingPatients = patients.filter(p => !existingContactIds.has(p.id_paciente));

    console.log(`There are ${missingPatients.length} patients missing from crm_contactos.`);

    if (missingPatients.length === 0) {
      console.log('No missing contacts to insert.');
      return;
    }

    const batchSize = 500;
    for (let i = 0; i < missingPatients.length; i += batchSize) {
      const batch = missingPatients.slice(i, i + batchSize);
      const insertPayload = batch.map(p => ({
        id_contacto: p.id_paciente,
        is_patient: true,
        prioridad: 'Normal', // Case sensitive enum value in Supabase: 'Normal'
        fecha_ingreso: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
      }));

      console.log(`Inserting batch ${i / batchSize + 1} (${insertPayload.length} rows)...`);
      const { error: insertError } = await supabase
        .from('crm_contactos')
        .insert(insertPayload);

      if (insertError) {
        console.error(`Error inserting batch starting at index ${i}:`, insertError.message);
      }
    }

    console.log('Done populating crm_contactos!');
  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

run();
