const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function queryObras() {
  const { data, error } = await supabase.from('pacientes').select('obra_social');
  if (error) {
    console.error('Error:', error);
    return;
  }
  const counts = {};
  data.forEach(p => {
    const os = p.obra_social || 'N/A';
    counts[os] = (counts[os] || 0) + 1;
  });
  console.log('Unique Obras Sociales in patients table:');
  console.log(JSON.stringify(counts, null, 2));

  const { data: contacts, error: contactsError } = await supabase.from('crm_contactos').select('social_insurance');
  if (contactsError) {
    console.error('Error contacts:', contactsError);
    return;
  }
  const contactCounts = {};
  contacts.forEach(c => {
    const os = c.social_insurance || 'N/A';
    contactCounts[os] = (contactCounts[os] || 0) + 1;
  });
  console.log('Unique Obras Sociales in crm_contactos table:');
  console.log(JSON.stringify(contactCounts, null, 2));
}

queryObras();
