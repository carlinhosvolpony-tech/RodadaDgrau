
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.39.7';

// Substitua pelas suas credenciais do projeto Supabase
const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anon-publica';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
