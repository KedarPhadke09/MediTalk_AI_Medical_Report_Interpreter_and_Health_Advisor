import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await supabase.from('patients').select('count', { count: 'exact' });
  if (error) {
    console.log('Tables not created yet in Supabase:', error.message);
  } else {
    console.log('Successfully connected to Supabase! patients count:', data);
  }
}

check();
