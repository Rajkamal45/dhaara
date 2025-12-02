import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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

    // Validate required fields
    if (!name || !sku || !category || price === undefined || !region_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Regional admins can only create products in their region
    const isSuper = adminProfile.admin_role === 'super_admin'
    const finalRegionId = isSuper ? region_id : adminProfile.region_id

    // Check if SKU already exists in this region
    const { data: existingProduct } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('sku', sku)
      .eq('region_id', finalRegionId)
      .maybeSingle()

    if (existingProduct) {
      return NextResponse.json({ error: 'SKU already exists in this region' }, { status: 400 })
    }

    // Create product
    const { data: product, error } = await (supabaseAdmin
      .from('products') as any)
      .insert({
        name,
        description: description || null,
        sku,
        category,
        price,
        price_per_quantity: price_per_quantity || 1,
        mrp: mrp || price,
        stock_quantity: stock_quantity || 0,
        unit: unit || 'piece',
        min_order_quantity: min_order_quantity || 1,
        max_order_quantity: max_order_quantity || 100,
        region_id: finalRegionId,
        is_active: is_active ?? true,
        image_url: image_url || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Product creation error:', error)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    return NextResponse.json({ success: true, product })
  } catch (error: any) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
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

    const isSuper = adminProfile.admin_role === 'super_admin'

    let query = supabase
      .from('products')
      .select('*, region:regions(name, code)')
      .order('created_at', { ascending: false })

    if (!isSuper && adminProfile.region_id) {
      query = query.eq('region_id', adminProfile.region_id)
    }

    const { data: products, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}