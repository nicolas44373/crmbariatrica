const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEvos() {
  console.log('Querying Supabase for P-4523 evoluciones...');
  const { data, error } = await supabase
    .from('evoluciones')
    .select('*')
    .eq('id_paciente', 'P-4523');
    
  if (error) {
    console.error('Error querying:', error.message);
  } else {
    console.log(`Found ${data.length} evoluciones in database for P-4523.`);
    data.forEach((e, idx) => {
      console.log(`Evo ${idx}: Date=${e.fecha_consulta} | NoteSnippet=${e.nota_clinica.substring(0, 100)}`);
    });
  }

  // Now, let's simulate the parsing of the file to see where it breaks!
  const filePath = path.join(__dirname, '..', 'backup', 'Plenus', '4523 - SALAZAR LOPEZ, MARIA ESTHER - 93280890.rtf');
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist!');
    return;
  }

  const content = fs.readFileSync(filePath, 'latin1');
  console.log('\n--- Simulation ---');
  
  // Clean RTF function from migrate_data.cjs
  function cleanRTF(rtf) {
    let text = rtf;
    // Remove RTF groups
    text = text.replace(/\{[^\}]*\}/g, '');
    // Remove formatting tags
    text = text.replace(/\\[a-z0-9-]+/gi, ' ');
    // Remove leading/trailing spaces
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

  console.log(`Regex matches found: ${matches.length}`);
  matches.forEach((m, idx) => {
    console.log(`Match ${idx}: dateStr="${m.dateStr}" | initials="${m.authorInitials}"`);
  });

  // Let's print out what cleanRTF produces for the entire file just to see if we clean it up differently
  console.log('\nCleaned content snippet from the file (first 400 chars):');
  console.log(cleanRTF(content).substring(0, 400));
}

checkEvos();
