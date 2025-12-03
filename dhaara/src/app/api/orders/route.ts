import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// Generate order number
function generateOrderNumber() {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD${year}${month}${day}${random}`
}

// POST - Create new order
export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('Order API: Unauthorized - no user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('Order API: Profile error', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check KYC status
    if (profile.kyc_status !== 'approved') {
      console.log('Order API: KYC not approved', profile.kyc_status)
      return NextResponse.json({ error: 'KYC not approved' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    console.log('Order API: Request body', JSON.stringify(body, null, 2))

    const {
      items,
      delivery_address,
      delivery_city,
      delivery_state,
      delivery_pincode,
      delivery_phone,
      payment_method,
      notes,
      total_amount,
    } = body

    // Validate items
    if (!items || items.length === 0) {
      console.log('Order API: No items')
      return NextResponse.json({ error: 'No items in order' }, { status: 400 })
    }

    // Validate required fields
    if (!delivery_address || !delivery_city || !delivery_pincode || !delivery_phone) {
      return NextResponse.json({ error: 'Missing delivery information' }, { status: 400 })
    }

    // Generate order number
    const orderNumber = generateOrderNumber()
    console.log('Order API: Creating order', orderNumber)

    // Prepare order data
    const orderData = {
        order_number: orderNumber,
        user_id: user.id,
        region_id: profile.region_id || null,
        status: 'pending',
        payment_status: 'pending',
        payment_method: payment_method || 'cod',
        subtotal: total_amount || 0,
        total_amount: total_amount || 0,
        delivery_address: delivery_address || '',
        delivery_city: delivery_city || '',
        delivery_state: delivery_state || '',
        delivery_pincode: delivery_pincode || '',
        delivery_phone: delivery_phone || '',
        delivery_lat: body.delivery_lat || null,        // ADD
        delivery_lng: body.delivery_lng || null,        // ADD
        location_accuracy: body.location_accuracy || null, // ADD
        location_verified: body.delivery_lat ? true : false, // ADD
        notes: notes || '',
      }

    console.log('Order API: Order data', JSON.stringify(orderData, null, 2))

    // Create order using admin client (bypasses RLS)
    const { data: order, error: orderError } = await (supabaseAdmin
      .from('orders') as any)
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      console.error('Order API: Order creation error', orderError)
      return NextResponse.json({ 
        error: 'Failed to create order',
        details: orderError.message 
      }, { status: 500 })
    }

    console.log('Order API: Order created', order.id)

    // Prepare order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity || 1,
      price: item.price || 0,
      price_per_quantity: item.price_per_quantity || 1,
      unit: item.unit || 'piece',
      total: ((item.price || 0) / (item.price_per_quantity || 1)) * (item.quantity || 1),
    }))

    console.log('Order API: Creating order items', orderItems.length)

    // Create order items
    const { error: itemsError } = await (supabaseAdmin
      .from('order_items') as any)
      .insert(orderItems)

    if (itemsError) {
      console.error('Order API: Order items error', itemsError)
      // Rollback - delete the order
      await (supabaseAdmin.from('orders') as any).delete().eq('id', order.id)
      return NextResponse.json({ 
        error: 'Failed to create order items',
        details: itemsError.message 
      }, { status: 500 })
    }

    console.log('Order API: Order completed successfully')

    // Return success
    return NextResponse.json({ 
      success: true, 
      order: {
        id: order.id,
        order_number: order.order_number,
      }
    })

  } catch (error: any) {
    console.error('Order API: Unexpected error', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

// GET - Get orders for current user
export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's orders with items
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          product:products (name, image_url)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get orders error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ orders })

  } catch (error: any) {
    console.error('Get orders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}