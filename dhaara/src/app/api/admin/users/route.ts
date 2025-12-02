import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // Check if user is admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, fullName, phone, role, adminRole, regionId } = body

    // Validate required fields
    if (!email || !password || !fullName || !phone || !role || !regionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Regional admins can only create users in their region
    const isSuper = adminProfile.admin_role === 'super_admin'
    const finalRegionId = isSuper ? regionId : adminProfile.region_id

    // Regional admins cannot create admins
    if (!isSuper && role === 'admin') {
      return NextResponse.json({ error: 'Only Super Admins can create admin accounts' }, { status: 403 })
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        full_name: fullName,
        phone,
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Update profile
    const { error: profileError } = await (supabaseAdmin
      .from('profiles') as any)
      .update({
        full_name: fullName,
        email: email,
        phone: phone,
        role: role,
        admin_role: role === 'admin' ? (adminRole || 'regional_admin') : null,
        region_id: finalRegionId,
        kyc_status: 'approved',
        is_active: true,
      })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('Profile error:', profileError)
      // Cleanup: delete auth user if profile update fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    // If logistics, create delivery_agents entry
    if (role === 'logistics') {
      const { error: agentError } = await (supabaseAdmin
        .from('delivery_agents') as any)
        .insert({
          user_id: authData.user.id,
          region_id: finalRegionId,
          vehicle_type: 'bike',
          status: 'active',
        })

      if (agentError) {
        console.error('Delivery agent error:', agentError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      user: { 
        id: authData.user.id, 
        email: authData.user.email,
        role,
      } 
    })
  } catch (error: any) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const isSuper = adminProfile.admin_role === 'super_admin'
    
    let query = supabase
      .from('profiles')
      .select('*, region:regions(name, code)')
      .order('created_at', { ascending: false })

    if (!isSuper && adminProfile.region_id) {
      query = query.eq('region_id', adminProfile.region_id)
    }

    const { data: users, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}