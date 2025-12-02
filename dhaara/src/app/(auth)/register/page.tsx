'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  ArrowRight, 
  ArrowLeft, 
  Building2, 
  User, 
  MapPin, 
  Eye, 
  EyeOff,
  Check,
  Store,
  UtensilsCrossed,
  Warehouse
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth'
import { registerUser, getRegions } from '@/lib/actions/auth'
import { cn } from '@/lib/utils/cn'

type Step = 1 | 2 | 3

const steps = [
  { number: 1, title: 'Account', icon: User },
  { number: 2, title: 'Business', icon: Building2 },
  { number: 3, title: 'Address', icon: MapPin },
]

const businessTypes = [
  { value: 'retailer', label: 'Retailer', icon: Store, description: 'Retail shops and stores' },
  { value: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed, description: 'Restaurants and eateries' },
  { value: 'wholesaler', label: 'Wholesaler', icon: Warehouse, description: 'Wholesale distributors' },
]

interface Region {
  id: string
  name: string
  code: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [step, setStep] = useState<Step>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [regions, setRegions] = useState<Region[]>([])

  // Fetch regions on mount
  useEffect(() => {
    async function fetchRegions() {
      console.log('Fetching regions...')
      const data = await getRegions()
      console.log('Regions fetched:', data)
      setRegions(data)
    }
    fetchRegions()
  }, [])

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      fullName: '',
      businessName: '',
      businessType: undefined,
      gstin: '',
      regionId: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
    },
    mode: 'onChange',
  })

  // Fields for each step
  const stepFields: Record<Step, (keyof RegisterFormData)[]> = {
    1: ['fullName', 'email', 'phone', 'password', 'confirmPassword'],
    2: ['businessName', 'businessType', 'regionId'],
    3: ['addressLine1', 'city', 'state', 'postalCode'],
  }

  // Validate current step
  const validateStep = async (): Promise<boolean> => {
    const fields = stepFields[step]
    console.log('Validating step', step, 'fields:', fields)
    const result = await form.trigger(fields)
    console.log('Validation result:', result)
    if (!result) {
      console.log('Validation errors:', form.formState.errors)
    }
    return result
  }

  // Handle next step
  const handleNext = async () => {
    const isValid = await validateStep()
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, 3) as Step)
    }
  }

  // Handle previous step
  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1) as Step)
  }

  // Handle form submission
  const handleSubmit = async (data: RegisterFormData) => {
    console.log('=== handleSubmit called ===')
    console.log('Data received:', data)
    
    setIsLoading(true)
    
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString())
      }
    })
    
    console.log('Calling registerUser...')
    const result = await registerUser(formData)
    console.log('registerUser result:', result)
    
    setIsLoading(false)
    
    if (!result.success) {
      console.log('Registration failed:', result.error)
      toast({
        title: 'Registration failed',
        description: result.error,
        variant: 'destructive',
      })
      return
    }

    console.log('Registration successful!')
    toast({
      title: 'Account created!',
      description: result.data?.requiresEmailConfirmation
        ? 'Please check your email to verify your account.'
        : 'You can now complete your KYC verification.',
      variant: 'success',
    })

    router.push('/login?registered=true')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground">
          Register your business to start ordering
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center">
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                step === s.number
                  ? 'bg-primary text-primary-foreground'
                  : step > s.number
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {step > s.number ? (
                <Check className="h-4 w-4" />
              ) : (
                <s.icon className="h-4 w-4" />
              )}
              <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-8 h-0.5 mx-1',
                  step > s.number ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <form 
        onSubmit={form.handleSubmit(
          (data) => {
            console.log('Form valid, submitting:', data)
            handleSubmit(data)
          },
          (errors) => {
            console.log('Form validation errors:', errors)
            alert('Validation errors - check console (F12). Errors: ' + Object.keys(errors).join(', '))
          }
        )} 
        className="space-y-4"
      >
        {/* Step 1: Account Details */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                {...form.register('fullName')}
                error={!!form.formState.errors.fullName}
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...form.register('email')}
                error={!!form.formState.errors.email}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91XXXXXXXXXX"
                {...form.register('phone')}
                error={!!form.formState.errors.phone}
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...form.register('password')}
                  error={!!form.formState.errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...form.register('confirmPassword')}
                  error={!!form.formState.errors.confirmPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Business Details */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="Your Business Name"
                {...form.register('businessName')}
                error={!!form.formState.errors.businessName}
              />
              {form.formState.errors.businessName && (
                <p className="text-sm text-destructive">{form.formState.errors.businessName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Business Type</Label>
              <div className="grid grid-cols-1 gap-3">
                {businessTypes.map((type) => (
                  <label
                    key={type.value}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                      form.watch('businessType') === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <input
                      type="radio"
                      value={type.value}
                      {...form.register('businessType')}
                      className="sr-only"
                    />
                    <div className={cn(
                      'p-2 rounded-lg',
                      form.watch('businessType') === type.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}>
                      <type.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{type.label}</p>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    {form.watch('businessType') === type.value && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </label>
                ))}
              </div>
              {form.formState.errors.businessType && (
                <p className="text-sm text-destructive">{form.formState.errors.businessType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN (Optional)</Label>
              <Input
                id="gstin"
                placeholder="22AAAAA0000A1Z5"
                {...form.register('gstin')}
                error={!!form.formState.errors.gstin}
              />
              {form.formState.errors.gstin && (
                <p className="text-sm text-destructive">{form.formState.errors.gstin.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="regionId">Region</Label>
              <Select
                value={form.watch('regionId')}
                onValueChange={(value) => form.setValue('regionId', value, { shouldValidate: true })}
              >
                <SelectTrigger error={!!form.formState.errors.regionId}>
                  <SelectValue placeholder="Select your region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name} ({region.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.regionId && (
                <p className="text-sm text-destructive">{form.formState.errors.regionId.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Address Details */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                placeholder="Street address, building, floor"
                {...form.register('addressLine1')}
                error={!!form.formState.errors.addressLine1}
              />
              {form.formState.errors.addressLine1 && (
                <p className="text-sm text-destructive">{form.formState.errors.addressLine1.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
              <Input
                id="addressLine2"
                placeholder="Apartment, suite, unit"
                {...form.register('addressLine2')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  {...form.register('city')}
                  error={!!form.formState.errors.city}
                />
                {form.formState.errors.city && (
                  <p className="text-sm text-destructive">{form.formState.errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="State"
                  {...form.register('state')}
                  error={!!form.formState.errors.state}
                />
                {form.formState.errors.state && (
                  <p className="text-sm text-destructive">{form.formState.errors.state.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                placeholder="6-digit postal code"
                maxLength={6}
                {...form.register('postalCode')}
                error={!!form.formState.errors.postalCode}
              />
              {form.formState.errors.postalCode && (
                <p className="text-sm text-destructive">{form.formState.errors.postalCode.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          
          {step < 3 ? (
            <Button type="button" onClick={handleNext} className="flex-1">
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" className="flex-1" loading={isLoading}>
              Create Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Login link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}