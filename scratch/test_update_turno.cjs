const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function run() {
  try {
    console.log('Fetching a sample turno from the database...');
    const { data: turnos, error: fetchError } = await supabase
      .from('turnos')
      .select('id_turno, valor_cobrado, metodo_pago, estado')
      .limit(5);

    if (fetchError) {
      console.error('Error fetching turnos:', fetchError.message);
      return;
    }

    if (!turnos || turnos.length === 0) {
      console.log('No turnos found in the database to test.');
      return;
    }

    const testTurno = turnos[0];
    console.log('Sample turno found:', testTurno);

    console.log(`Testing update on turno ${testTurno.id_turno}: setting valor_cobrado to 7500 and metodo_pago to 'Efectivo'...`);
    const { data: updated, error: updateError } = await supabase
      .from('turnos')
      .update({
        valor_cobrado: 7500,
        metodo_pago: 'Efectivo'
      })
      .eq('id_turno', testTurno.id_turno)
      .select();

    if (updateError) {
      console.error('Update failed with error:');
      console.error(JSON.stringify(updateError, null, 2));
    } else {
      console.log('Update succeeded!', updated);
      // Restore original values
      console.log('Restoring original values...');
      await supabase
        .from('turnos')
        .update({
          valor_cobrado: testTurno.valor_cobrado || 0,
          metodo_pago: testTurno.metodo_pago || null
        })
        .eq('id_turno', testTurno.id_turno);
      console.log('Restored successfully.');
    }

  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

run();
