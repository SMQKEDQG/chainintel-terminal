import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xrcszfaqxgiodewznpwk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyY3N6ZmFxeGdpb2Rld3pucHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1ODI1NTAsImV4cCI6MjA5MTE1ODU1MH0.vTzAX0hTKzTPMoKWpz2miOJlWYsf4Aw6worzPru97ug';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
