const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

async function run() {
  const url = `${supabaseUrl}/rest/v1/`;
  console.log('Fetching from:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    const schema = await res.json();
    console.log('Exposed tables/views:', Object.keys(schema.definitions || {}));
    console.log('Exposed paths/RPCs:', Object.keys(schema.paths || {}));
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
