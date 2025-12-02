import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Get the user to determine redirect
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, kyc_status')
      .eq('id', session.user.id)
      .single()

    if (profile) {
      if (profile.role === 'admin') {
        return NextResponse.redirect(`${origin}/admin/dashboard`)
      } else if (profile.role === 'logistics') {
        return NextResponse.redirect(`${origin}/logistics/dashboard`)
      } else if (profile.kyc_status === 'approved') {
        return NextResponse.redirect(`${origin}/`)
      } else {
        return NextResponse.redirect(`${origin}/kyc`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
