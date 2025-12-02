'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { loginSchema, otpRequestSchema, type LoginFormData, type OTPRequestFormData } from '@/lib/validations/auth'
import { loginWithEmail, requestLoginOTP } from '@/lib/actions/auth'
import { cn } from '@/lib/utils/cn'

type LoginMethod = 'email' | 'phone'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const redirectTo = searchParams.get('redirectTo') || '/'
  
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const emailForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const phoneForm = useForm<OTPRequestFormData>({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: {
      phone: '',
    },
  })

  const handleEmailLogin = async (data: LoginFormData) => {
    setIsLoading(true)
    console.log('=== Login attempt ===')
    
    const formData = new FormData()
    formData.append('email', data.email)
    formData.append('password', data.password)
    
    const result = await loginWithEmail(formData)
    console.log('Login result:', result)
    
    setIsLoading(false)
    
    if (!result.success) {
      toast({
        title: 'Login failed',
        description: result.error,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Welcome back!',
      description: 'You have successfully logged in.',
      variant: 'success',
    })

    const { role, kycStatus } = result.data!
    console.log('Role:', role, 'KYC Status:', kycStatus)
    
    // Small delay to ensure cookies are set
    await new Promise(resolve => setTimeout(resolve, 100))
    
    let targetUrl = '/dashboard'
    if (role === 'admin') {
      targetUrl = '/admin/dashboard'
    } else if (role === 'logistics') {
      targetUrl = '/logistics/dashboard'
    } else if (kycStatus !== 'approved') {
      targetUrl = '/kyc'
    } else {
      targetUrl = redirectTo
    }
    
    console.log('Redirecting to:', targetUrl)
    
    // Use window.location for hard redirect (more reliable)
    window.location.href = targetUrl
  }

  const handleOTPRequest = async (data: OTPRequestFormData) => {
    setIsLoading(true)
    
    const formData = new FormData()
    formData.append('phone', data.phone)
    
    const result = await requestLoginOTP(formData)
    
    setIsLoading(false)
    
    if (!result.success) {
      toast({
        title: 'Failed to send OTP',
        description: result.error,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'OTP Sent',
      description: 'Please check your phone for the verification code.',
      variant: 'success',
    })

    router.push(`/verify-otp?phone=${encodeURIComponent(data.phone)}&type=login&redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      <div className="flex bg-muted p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setLoginMethod('email')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all',
            loginMethod === 'email'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Mail className="h-4 w-4" />
          Email
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod('phone')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all',
            loginMethod === 'phone'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Phone className="h-4 w-4" />
          Phone OTP
        </button>
      </div>

      {loginMethod === 'email' && (
        <form onSubmit={emailForm.handleSubmit(handleEmailLogin)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...emailForm.register('email')}
              error={!!emailForm.formState.errors.email}
            />
            {emailForm.formState.errors.email && (
              <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                {...emailForm.register('password')}
                error={!!emailForm.formState.errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {emailForm.formState.errors.password && (
              <p className="text-sm text-destructive">{emailForm.formState.errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" loading={isLoading}>
            Sign in
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      )}

      {loginMethod === 'phone' && (
        <form onSubmit={phoneForm.handleSubmit(handleOTPRequest)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91XXXXXXXXXX"
              autoComplete="tel"
              {...phoneForm.register('phone')}
              error={!!phoneForm.formState.errors.phone}
            />
            {phoneForm.formState.errors.phone && (
              <p className="text-sm text-destructive">{phoneForm.formState.errors.phone.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter your registered phone number with country code
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={isLoading}>
            Send OTP
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            New to Regional Delivery?
          </span>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          Create a business account
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Admin or Logistics staff? Use your email and password to sign in.
      </p>
    </div>
  )
}