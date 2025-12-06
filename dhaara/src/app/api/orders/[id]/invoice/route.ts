import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, id')
      .eq('id', user.id)
      .single()

    // Fetch order
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !order) {
      console.error('Order fetch error:', error)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check access permissions
    const isAdmin = profile?.role === 'admin'
    const isLogistics = profile?.role === 'logistics' && order.assigned_to === user.id
    const isOwner = order.user_id === user.id

    if (!isAdmin && !isLogistics && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch user profile for the order
    const { data: orderUser } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email, phone, business_name, gstin, address_line1, address_line2, city, state, postal_code')
      .eq('id', order.user_id)
      .single()

    // Fetch region
    const { data: region } = order.region_id ? await supabaseAdmin
      .from('regions')
      .select('name, code, support_email, support_phone')
      .eq('id', order.region_id)
      .single() : { data: null }

    // Fetch order items
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('id, quantity, price, price_per_quantity, unit, total, product_id, product_name, product_image')
      .eq('order_id', params.id)

    // Fetch product details for each item
    const itemsWithProducts = await Promise.all(
      (orderItems || []).map(async (item: any) => {
        let productData = null
        if (item.product_id) {
          const { data: product } = await supabaseAdmin
            .from('products')
            .select('name, sku, image_url')
            .eq('id', item.product_id)
            .single()
          productData = product
        }
        return {
          ...item,
          name: productData?.name || item.product_name || 'Product',
          sku: productData?.sku || 'N/A',
          image_url: productData?.image_url || item.product_image
        }
      })
    )

    // Combine all data
    const invoiceData = {
      ...order,
      user: orderUser || {
        full_name: 'Customer',
        email: '',
        phone: order.delivery_phone || ''
      },
      region: region,
      order_items: itemsWithProducts
    }

    return NextResponse.json(invoiceData)

  } catch (error: any) {
    console.error('Invoice API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
