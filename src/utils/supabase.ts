import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fzcvflvwxoefshylhzws.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cG3Z_BUK7qRbo_OJKAZbjQ_PdrZlgZh';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
