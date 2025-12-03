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

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status, payment_status, assigned_to } = body

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updateData.status = status
      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      }
    }

    if (payment_status) {
      updateData.payment_status = payment_status
    }

    if (assigned_to !== undefined) {
      updateData.assigned_to = assigned_to
      if (assigned_to) {
        updateData.assigned_at = new Date().toISOString()
      } else {
        updateData.assigned_at = null
      }
    }

    console.log('Updating order:', params.id, updateData)

    const { error } = await (supabaseAdmin
      .from('orders') as any)
      .update(updateData)
      .eq('id', params.id)

    if (error) {
      console.error('Update order error:', error)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Update order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}