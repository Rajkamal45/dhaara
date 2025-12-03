import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role, admin_role, region_id')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status, rejection_reason } = body

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update user KYC status
    const updateData: any = {
      kyc_status: status,
      kyc_verified_at: new Date().toISOString(),
      kyc_verified_by: user.id,
    }

    if (status === 'rejected' && rejection_reason) {
      updateData.kyc_rejection_reason = rejection_reason
    }

    const { error } = await (supabaseAdmin
      .from('profiles') as any)
      .update(updateData)
      .eq('id', params.id)

    if (error) {
      console.error('KYC update error:', error)
      return NextResponse.json({ error: 'Failed to update KYC' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('KYC API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}