import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://guwltpbbvgedopeqcuvz.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_CQPGU6ycM6qzzC8D766fdw_UIEAon-P';

export const supabase = createClient(supabaseUrl, supabaseKey);
