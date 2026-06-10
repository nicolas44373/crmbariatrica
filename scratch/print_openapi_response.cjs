const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

async function run() {
  const url = `${supabaseUrl}/rest/v1/`;
  console.log('Fetching:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': supabaseAnonKey
      }
    });
    const text = await res.text();
    console.log('Response text (first 1000 chars):');
    console.log(text.slice(0, 1000));
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
