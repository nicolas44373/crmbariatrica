const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function testAuth() {
  console.log('Logging in as jpmendoza@plenus.ar...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'jpmendoza@plenus.ar',
    password: 'juamen'
  });

  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }
  console.log('Logged in successfully! Token:', authData.session ? 'Present' : 'Missing');

  console.log('\n--- 1. Testing Turno Update (Own Turno) ---');
  // Find a turno belonging to Mendoza
  const { data: ownTurnos } = await supabase
    .from('turnos')
    .select('*')
    .eq('profesional_email', 'jpmendoza@plenus.ar')
    .limit(1);

  if (ownTurnos && ownTurnos.length > 0) {
    const t = ownTurnos[0];
    console.log('Found own turno:', t.id_turno);
    const { data: updated, error: updateError } = await supabase
      .from('turnos')
      .update({ nota_interna: 'Test own update ' + new Date().toISOString() })
      .eq('id_turno', t.id_turno)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('Own update failed:', updateError);
    } else {
      console.log('Own update succeeded:', updated.nota_interna);
    }
  } else {
    console.log('No turnos found for Mendoza.');
  }

  console.log('\n--- 2. Testing Turno Update (Other Doctor Turno) ---');
  // Find a turno belonging to Sosa
  const { data: otherTurnos } = await supabase
    .from('turnos')
    .select('*')
    .eq('profesional_email', 'psosa@plenus.ar')
    .limit(1);

  if (otherTurnos && otherTurnos.length > 0) {
    const t = otherTurnos[0];
    console.log('Found other doctor turno:', t.id_turno);
    const { data: updated, error: updateError } = await supabase
      .from('turnos')
      .update({ nota_interna: 'Test other update ' + new Date().toISOString() })
      .eq('id_turno', t.id_turno)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('Other update failed:', updateError);
    } else {
      console.log('Other update succeeded:', updated.nota_interna);
    }
  } else {
    console.log('No turnos found for Sosa.');
  }

  await supabase.auth.signOut();
}

testAuth();
