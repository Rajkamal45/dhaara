import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a logistics partner
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'logistics') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify order is assigned to this logistics partner
    const { data: order } = await supabase
      .from('orders')
      .select('id, assigned_to, status')
      .eq('id', id)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.assigned_to !== user.id) {
      return NextResponse.json({ error: 'Order not assigned to you' }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending: ['shipped'],
      confirmed: ['shipped'],
      processing: ['shipped'],
      shipped: ['delivered'],
    }

    if (!validTransitions[order.status]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${order.status} to ${status}` },
        { status: 400 }
      )
    }

    // Update the order
    const updateData: Record<string, unknown> = { status }

    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('Error in PATCH /api/logistics/orders/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a logistics partner
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'logistics') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:profiles!orders_user_id_fkey (full_name, phone, email, business_name),
        region:regions (name),
        order_items (
          *,
          product:products (name, image_url)
        )
      `)
      .eq('id', id)
      .eq('assigned_to', user.id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error in GET /api/logistics/orders/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
