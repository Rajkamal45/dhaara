'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { verifyOTPAndLogin, requestLoginOTP } from '@/lib/actions/auth'
import { cn } from '@/lib/utils/cn'

function OTPVerificationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const phone = searchParams.get('phone') || ''
  const type = searchParams.get('type') || 'login'
  const redirectTo = searchParams.get('redirectTo') || '/'
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [canResend, setCanResend] = useState(false)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Handle input change
  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when complete
    if (value && index === 5) {
      const completeOtp = [...newOtp.slice(0, 5), value.slice(-1)].join('')
      if (completeOtp.length === 6) {
        handleVerify(completeOtp)
      }
    }
  }

  // Handle key down
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      handleVerify(pastedData)
    }
  }

  // Verify OTP
  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('')
    if (code.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter all 6 digits',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    const formData = new FormData()
    formData.append('phone', phone)
    formData.append('otp', code)

    const result = await verifyOTPAndLogin(formData)

    setIsLoading(false)

    if (!result.success) {
      toast({
        title: 'Verification failed',
        description: result.error,
        variant: 'destructive',
      })
      // Clear OTP on error
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      return
    }

    toast({
      title: 'Welcome!',
      description: 'You have successfully logged in.',
      variant: 'success',
    })

    // Redirect based on role
    const { role, kycStatus } = result.data!
    if (role === 'admin') {
      router.push('/admin/dashboard')
    } else if (role === 'logistics') {
      router.push('/logistics/dashboard')
    } else if (kycStatus === 'approved') {
      router.push(redirectTo)
    } else {
      router.push('/kyc')
    }
    router.refresh()
  }

  // Resend OTP
  const handleResend = async () => {
    setIsResending(true)

    const formData = new FormData()
    formData.append('phone', phone)

    const result = await requestLoginOTP(formData)

    setIsResending(false)

    if (!result.success) {
      toast({
        title: 'Failed to resend OTP',
        description: result.error,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'OTP Sent',
      description: 'A new OTP has been sent to your phone.',
      variant: 'success',
    })

    // Reset countdown
    setCountdown(30)
    setCanResend(false)
    setOtp(['', '', '', '', '', ''])
    inputRefs.current[0]?.focus()
  }

  // Mask phone number for display
  const maskedPhone = phone ? phone.replace(/(\+91)(\d{2})(\d{4})(\d{4})/, '$1 $2**** $4') : ''

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>

      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Verify OTP</h1>
        <p className="text-muted-foreground">
          We&apos;ve sent a 6-digit code to{' '}
          <span className="font-medium text-foreground">{maskedPhone}</span>
        </p>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center gap-3">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {inputRefs.current[index] = el}}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            className={cn(
              'w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 transition-all',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              digit ? 'border-primary bg-primary/5' : 'border-input bg-background'
            )}
          />
        ))}
      </div>

      {/* Verify button */}
      <Button
        onClick={() => handleVerify()}
        className="w-full"
        size="lg"
        loading={isLoading}
        disabled={otp.some((d) => !d)}
      >
        Verify & Login
      </Button>

      {/* Resend OTP */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Didn&apos;t receive the code?
        </p>
        {canResend ? (
          <Button
            variant="link"
            onClick={handleResend}
            disabled={isResending}
            className="text-primary"
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend OTP
              </>
            )}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Resend in <span className="font-medium text-foreground">{countdown}s</span>
          </p>
        )}
      </div>

      {/* Help text */}
      <p className="text-center text-xs text-muted-foreground">
        If you&apos;re having trouble receiving the OTP, please check your phone&apos;s SMS inbox
        or try again after some time.
      </p>
    </div>
  )
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Verify OTP</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <OTPVerificationContent />
    </Suspense>
  )
}
