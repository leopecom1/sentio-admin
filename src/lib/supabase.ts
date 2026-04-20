import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://supabase-b2better-app-supabase-b2better-app.b3uer4.easypanel.host';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzEzMTk2MDAwLCJleHAiOjIwMjg3MzA2MDB9.Fi1nuUn5TI9ZNY_CdZEDtDPmxWrsk653hfK82ss3AhQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
