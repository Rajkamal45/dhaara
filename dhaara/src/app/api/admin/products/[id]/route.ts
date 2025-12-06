import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET single product
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: product, error } = await supabase
      .from('products')
      .select('*, region:regions(name, code)')
      .eq('id', params.id)
      .single()

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// UPDATE product
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if product exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const isSuper = adminProfile.admin_role === 'super_admin'
    
    // Regional admin can only edit products in their region
    if (!isSuper && existingProduct.region_id !== adminProfile.region_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      description,
      sku,
      category,
      price,
      price_per_quantity,
      mrp,
      stock_quantity,
      unit,
      min_order_quantity,
      max_order_quantity,
      region_id,
      is_active,
      image_url,
    } = body

    const finalRegionId = isSuper ? (region_id || existingProduct.region_id) : adminProfile.region_id

    // Update product
    const { data: product, error } = await (supabaseAdmin
      .from('products') as any)
      .update({
        name,
        description: description || null,
        sku,
        category,
        price,
        price_per_quantity: price_per_quantity || 1,
        mrp: mrp || null,
        stock_quantity,
        unit,
        min_order_quantity,
        max_order_quantity,
        region_id: finalRegionId,
        is_active,
        image_url: image_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Product update error:', error)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    return NextResponse.json({ success: true, product })
  } catch (error: any) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - partial update (for toggling status)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const { error } = await (supabaseAdmin
      .from('products') as any)
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (error) {
      console.error('Product patch error:', error)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Patch product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE product
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if product exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const isSuper = adminProfile.admin_role === 'super_admin'

    // Regional admin can only delete products in their region
    if (!isSuper && existingProduct.region_id !== adminProfile.region_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if product has any active (non-delivered/non-cancelled) orders
    const { data: activeOrderItems, error: orderCheckError } = await supabaseAdmin
      .from('order_items')
      .select(`
        id,
        order:orders!inner (
          id,
          status
        )
      `)
      .eq('product_id', params.id)

    if (orderCheckError) {
      console.error('Order check error:', orderCheckError)
    }

    // Filter for orders that are NOT delivered or cancelled
    const pendingOrders = (activeOrderItems || []).filter((item: any) => {
      const status = item.order?.status
      return status && !['delivered', 'cancelled', 'refunded'].includes(status)
    })

    if (pendingOrders.length > 0) {
      return NextResponse.json({
        error: `Cannot delete product. It has ${pendingOrders.length} pending order(s). Wait until all orders are delivered or deactivate it instead.`
      }, { status: 400 })
    }

    // Remove product reference from completed order items (set to NULL)
    // This preserves order history while allowing product deletion
    if (activeOrderItems && activeOrderItems.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('order_items')
        .update({
          product_id: null,
          product_name: existingProduct.name,
          product_image: existingProduct.image_url
        })
        .eq('product_id', params.id)

      if (updateError) {
        console.error('Error updating order items:', updateError)
        return NextResponse.json({
          error: 'Failed to update order history before deletion'
        }, { status: 500 })
      }
    }

    // Delete product
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Product delete error:', error)
      // Check for foreign key constraint error
      if (error.code === '23503') {
        return NextResponse.json({
          error: 'Cannot delete product. It is referenced in other records. Deactivate it instead.'
        }, { status: 400 })
      }
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}