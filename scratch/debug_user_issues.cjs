const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAll() {
  console.log('--- 1. Testing Patient Insertion ---');
  const tempDni = 'TEST-' + Math.floor(Math.random() * 1000000);
  const { data: pac, error: pacError } = await supabase
    .from('pacientes')
    .insert({
      apellido: 'TEST_LN',
      nombres: 'TEST_FN',
      dni: tempDni,
      email: 'test@email.com',
      telefono: '12345678',
      etiqueta_activa: 'NUEVO_INGRESO'
    })
    .select()
    .maybeSingle();

  if (pacError) {
    console.error('Patient insertion failed:', pacError);
  } else {
    console.log('Patient insertion succeeded:', pac);
  }

  console.log('\n--- 2. Testing Prospect Insertion ---');
  const tempProspectId = 'prospect-test-' + Math.floor(Math.random() * 1000000);
  const { data: prop, error: propError } = await supabase
    .from('crm_contactos')
    .insert({
      id_contacto: tempProspectId,
      nombres: 'Carlos',
      apellido: 'Guzmán',
      telefono: '3815123456',
      email: 'carlos.guz@email.com',
      is_patient: false,
      canal_origen: 'Instagram',
      estado_seguimiento: 'NUEVO',
      prioridad: 'Normal',
      fecha_ingreso: new Date().toISOString().split('T')[0]
    })
    .select()
    .maybeSingle();

  if (propError) {
    console.error('Prospect insertion failed:', propError);
  } else {
    console.log('Prospect insertion succeeded:', prop);
  }

  console.log('\n--- 3. Testing Turno Update (Llegada & Cobro) ---');
  // Find a turno
  const { data: turnos } = await supabase.from('turnos').select('*').limit(1);
  if (turnos && turnos.length > 0) {
    const t = turnos[0];
    console.log('Found turno to update:', t.id_turno);
    
    const { data: updated, error: turnError } = await supabase
      .from('turnos')
      .update({
        estado: 'EN_ESPERA',
        valor_cobrado: 5000,
        metodo_pago: 'Efectivo',
        hora_llegada: new Date().toISOString()
      })
      .eq('id_turno', t.id_turno)
      .select()
      .maybeSingle();

    if (turnError) {
      console.error('Turno update failed:', turnError);
    } else {
      console.log('Turno update succeeded:', updated);
    }
  } else {
    console.log('No turnos found to test update.');
  }

  // Cleanup test patient & prospect
  if (pac) {
    await supabase.from('pacientes').delete().eq('id_paciente', pac.id_paciente);
  }
  if (prop) {
    await supabase.from('crm_contactos').delete().eq('id_contacto', prop.id_contacto);
  }
}

testAll();
