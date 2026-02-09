import path from 'path';
import { config } from 'dotenv';
config({ path: path.join(__dirname, '..', '.env') });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testLogin() {
  const result = await supabase.auth.signInWithPassword({
    email: 'engenharia11@engeletraconstrucao.com.br',
    password: '12345678'
  });
  console.log(JSON.stringify(result, null, 2));
}

testLogin().catch(err => {
  console.error('Erro no teste de login:', err);
  process.exit(1);
});
