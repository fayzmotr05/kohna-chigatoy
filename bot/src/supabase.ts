import { createClient } from '@supabase/supabase-js';

// Uses service_role key — bypasses RLS, full DB access
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
