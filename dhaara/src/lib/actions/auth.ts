'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { 
  loginSchema, 
  registerSchema, 
  otpRequestSchema, 
  otpVerifySchema,
  forgotPasswordSchema,
} from '@/lib/validations/auth'

// Types for action results
interface ActionResult {
  success: boolean
  error?: string
  data?: Record<string, any>
}

// Email/Password Login
export async function loginWithEmail(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validationResult = loginSchema.safeParse(rawData)
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors[0].message,
    }
  }

  const { email, password } = validationResult.data

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: error.message === 'Invalid login credentials' 
          ? 'Invalid email or password' 
          : error.message,
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Login failed. Please try again.',
      }
    }

    // Update last login timestamp
    await supabaseAdmin
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id)

    // Get user profile to determine redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, kyc_status')
      .eq('id', data.user.id)
      .single()

    return {
      success: true,
      data: {
        role: profile?.role || 'user',
        kycStatus: profile?.kyc_status || 'pending',
      },
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

// User Registration
export async function registerUser(formData: FormData): Promise<ActionResult> {
  console.log('=== registerUser called ===')
  
  const supabase = createClient()
  
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    phone: formData.get('phone') as string,
    fullName: formData.get('fullName') as string,
    businessName: formData.get('businessName') as string,
    businessType: formData.get('businessType') as string,
    gstin: (formData.get('gstin') as string) || '',
    regionId: formData.get('regionId') as string,
    addressLine1: formData.get('addressLine1') as string,
    addressLine2: (formData.get('addressLine2') as string) || '',
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    postalCode: formData.get('postalCode') as string,
  }

  console.log('Form data received:', rawData)

  const validationResult = registerSchema.safeParse(rawData)
  if (!validationResult.success) {
    console.log('Validation failed:', validationResult.error.errors[0].message)
    return {
      success: false,
      error: validationResult.error.errors[0].message,
    }
  }

  const data = validationResult.data
  console.log('Validation passed')

  try {
    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .or(`email.eq.${data.email},phone.eq.${data.phone}`)
      .maybeSingle()

    if (existingProfile) {
      console.log('User already exists')
      return {
        success: false,
        error: 'An account with this email or phone already exists.',
      }
    }

    console.log('Creating auth user...')
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: 'user',
          full_name: data.fullName,
          phone: data.phone,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`,
      },
    })

    if (authError) {
      console.log('Auth error:', authError.message)
      return {
        success: false,
        error: authError.message,
      }
    }

    if (!authData.user) {
      console.log('No user returned')
      return {
        success: false,
        error: 'Failed to create account. Please try again.',
      }
    }

    console.log('User created:', authData.user.id)

    // Update profile with additional details
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        phone: data.phone,
        full_name: data.fullName,
        business_name: data.businessName,
        business_type: data.businessType,
        gstin: data.gstin || null,
        region_id: data.regionId,
        address_line1: data.addressLine1,
        address_line2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        postal_code: data.postalCode,
        kyc_status: 'pending',
      })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
    } else {
      console.log('Profile updated successfully')
    }

    return {
      success: true,
      data: {
        userId: authData.user.id,
        email: authData.user.email,
        requiresEmailConfirmation: !authData.session,
      },
    }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

// Request OTP for phone login
export async function requestLoginOTP(formData: FormData): Promise<ActionResult> {
  const rawData = {
    phone: formData.get('phone') as string,
  }

  const validationResult = otpRequestSchema.safeParse(rawData)
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors[0].message,
    }
  }

  const { phone } = validationResult.data

  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, is_active, email')
      .eq('phone', phone)
      .single()

    if (!profile) {
      return {
        success: false,
        error: 'No account found with this phone number.',
      }
    }

    if (!profile.is_active) {
      return {
        success: false,
        error: 'Your account is inactive. Please contact support.',
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await supabaseAdmin.from('otp_codes').insert({
      reference_type: 'user_login',
      reference_id: profile.id,
      code: otp,
      phone: phone,
      expires_at: expiresAt.toISOString(),
    })

    console.log(`OTP for ${phone}: ${otp}`)

    return {
      success: true,
      data: { phone },
    }
  } catch (error) {
    console.error('OTP request error:', error)
    return {
      success: false,
      error: 'Failed to send OTP. Please try again.',
    }
  }
}

// Verify OTP and login
export async function verifyOTPAndLogin(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  
  const rawData = {
    phone: formData.get('phone') as string,
    otp: formData.get('otp') as string,
  }

  const validationResult = otpVerifySchema.safeParse(rawData)
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors[0].message,
    }
  }

  const { phone, otp } = validationResult.data

  try {
    const { data: otpRecord } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('reference_type', 'user_login')
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!otpRecord) {
      return {
        success: false,
        error: 'OTP expired or invalid. Please request a new one.',
      }
    }

    const maxAttempts = (otpRecord as any).max_attempts || 3
    const attempts = (otpRecord as any).attempts || 0
    const code = (otpRecord as any).code

    if (attempts >= maxAttempts) {
      return {
        success: false,
        error: 'Maximum attempts exceeded. Please request a new OTP.',
      }
    }

    if (code !== otp) {
      await supabaseAdmin
        .from('otp_codes')
        .update({ attempts: attempts + 1 })
        .eq('id', otpRecord.id)

      return {
        success: false,
        error: `Invalid OTP. ${maxAttempts - attempts - 1} attempts remaining.`,
      }
    }

    await supabaseAdmin
      .from('otp_codes')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', otpRecord.id)

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, kyc_status')
      .eq('phone', phone)
      .single()

    if (!profile) {
      return {
        success: false,
        error: 'User not found.',
      }
    }

    const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
    })

    if (signInError || !signInData.properties?.hashed_token) {
      return {
        success: false,
        error: 'Failed to authenticate. Please try again.',
      }
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: signInData.properties.hashed_token,
      type: 'magiclink',
    })

    if (verifyError) {
      return {
        success: false,
        error: 'Authentication failed. Please try again.',
      }
    }

    await supabaseAdmin
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', profile.id)

    return {
      success: true,
      data: {
        role: profile.role,
        kycStatus: profile.kyc_status,
      },
    }
  } catch (error) {
    console.error('OTP verification error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

// Forgot password
export async function forgotPassword(formData: FormData): Promise<ActionResult> {
  const supabase = createClient()
  
  const rawData = {
    email: formData.get('email') as string,
  }

  const validationResult = forgotPasswordSchema.safeParse(rawData)
  if (!validationResult.success) {
    return {
      success: false,
      error: validationResult.error.errors[0].message,
    }
  }

  const { email } = validationResult.data

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: { email },
    }
  } catch (error) {
    console.error('Forgot password error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

// Logout
export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// Get current user with profile
export async function getCurrentUser() {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      region:regions(*)
    `)
    .eq('id', session.user.id)
    .single()

  return {
    user: session.user,
    profile,
  }
}

// Get all active regions
export async function getRegions() {
  const supabase = createClient()
  
  const { data: regions, error } = await supabase
    .from('regions')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching regions:', error)
    return []
  }

  return regions || []
}