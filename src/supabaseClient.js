import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://votre-projet.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'votre-cle-publique-anon';

// IMPORTANT: For production deployments, ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY
// are properly configured as environment variables. The fallback values are placeholders and will not
// work for a live Supabase project.

export const supabase = createClient(supabaseUrl, supabaseKey);