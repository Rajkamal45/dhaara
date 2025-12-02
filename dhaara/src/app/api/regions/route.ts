import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('regions')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Regions error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
