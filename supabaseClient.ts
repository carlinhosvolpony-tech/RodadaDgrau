
import { createClient } from '@supabase/supabase-js';

// NOTA: Para o app funcionar em tempo real, você DEVE criar um projeto no Supabase (supabase.com),
// rodar o script SQL fornecido anteriormente no "SQL Editor" do Supabase,
// e substituir as chaves abaixo pelas do seu projeto (Project Settings -> API).

const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anon-publica';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
