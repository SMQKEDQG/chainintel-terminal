import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Resets weekly free-tier view counters every Monday at midnight UTC.
export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: true, message: 'Supabase not configured — reset skipped' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase
      .from('free_view_counts')
      .update({ views: 0 })
      .gte('views', 0);

    if (error) {
      return NextResponse.json({ ok: true, message: 'Table not available — reset skipped' });
    }

    return NextResponse.json({ ok: true, message: 'Free view counts reset' });
  } catch {
    return NextResponse.json({ ok: true, message: 'Reset skipped' });
  }
}
