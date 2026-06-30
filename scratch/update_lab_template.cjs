const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const defaultLabParams = [
  { id: "lab-hematocrito", parametro: "Hematocrito", unidad: "%" },
  { id: "lab-hb", parametro: "Hb", unidad: "g/dL" },
  { id: "lab-leucocitos", parametro: "Leucocitos", unidad: "/mm3" },
  { id: "lab-insulina", parametro: "Insulina", unidad: "uU/mL" },
  { id: "lab-glucosa", parametro: "Glucosa", unidad: "mg/dl" },
  { id: "lab-glucosa120", parametro: "Glucosa 120", unidad: "mg/dl" },
  { id: "lab-homa", parametro: "HOMA", unidad: "" },
  { id: "lab-colesterol-tot", parametro: "Colesterol Total", unidad: "mg/dl" },
  { id: "lab-colesterol-hdl", parametro: "Colesterol HDL", unidad: "mg/dl" },
  { id: "lab-colesterol-ldl", parametro: "Colesterol LDL", unidad: "mg/dl" },
  { id: "lab-trigliceridos", parametro: "Triglicéridos", unidad: "mg/dl" },
  { id: "lab-urea", parametro: "Urea", unidad: "mg/dl" },
  { id: "lab-creatinina", parametro: "Creatinina", unidad: "mg/dl" },
  { id: "lab-tp", parametro: "TP", unidad: "%" },
  { id: "lab-tsh", parametro: "TSH", unidad: "uUI/mL" },
  { id: "lab-t4", parametro: "T4", unidad: "ug/dL" },
  { id: "lab-albumina", parametro: "Albúmina", unidad: "g/dL" },
  { id: "lab-calcemia", parametro: "Calcemia", unidad: "mg/dl" },
  { id: "lab-vitd3", parametro: "Vit D3", unidad: "ng/mL" },
  { id: "lab-vitb12", parametro: "Vit B12", unidad: "pg/mL" },
  { id: "lab-fosfatemia", parametro: "Fosfatemia", unidad: "mg/dl" },
  { id: "lab-psa", parametro: "PSA", unidad: "ng/mL" },
  { id: "lab-dheas", parametro: "DHEA-S", unidad: "ug/dL" },
  { id: "lab-cortisol", parametro: "Cortisol Matutino", unidad: "ug/dL" },
  { id: "lab-testo-tot", parametro: "Testosterona Total", unidad: "ng/dL" },
  { id: "lab-testo-lib", parametro: "Testosterona Libre", unidad: "nmol/L" },
  { id: "lab-estradiol", parametro: "Estradiol", unidad: "pg/mL" },
  { id: "lab-lh", parametro: "LH", unidad: "mUI/mL" },
  { id: "lab-fsh", parametro: "FSH", unidad: "mUI/mL" },
  { id: "lab-glae", parametro: "GLAE", unidad: "mmol/L" }
];

async function updateLabTemplate() {
  console.log('Updating global laboratory template in database...');
  const { error } = await supabase.from('configuracion_sistema').update({
    plantilla_laboratorio: defaultLabParams
  }).eq('id', 1);

  if (error) {
    console.error('Error updating template:', error.message);
  } else {
    console.log('Success! Global laboratory template updated.');
  }
}

updateLabTemplate();
