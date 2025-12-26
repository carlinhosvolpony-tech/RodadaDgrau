
import { createClient } from '@supabase/supabase-js';

// ATENÇÃO: Se as edições não funcionarem, verifique:
// 1. Se a URL e KEY abaixo estão corretas.
// 2. No painel Supabase, vá em "Table Editor" -> selecione a tabela -> "RLS is enabled" -> clique em "Disable RLS" 
//    ou adicione políticas (Policies) que permitam UPDATE/INSERT.

const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anon-publica';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
