'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Shield, Truck, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils/cn'
import Link from 'next/link'

const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+91[0-9]{10}$/, 'Enter valid phone (+91XXXXXXXXXX)'),
  role: z.enum(['admin', 'logistics']),
  adminRole: z.enum(['super_admin', 'regional_admin']).optional(),
  regionId: z.string().uuid('Please select a region'),
})

type CreateUserData = z.infer<typeof createUserSchema>

interface CreateUserFormProps {
  regions: { id: string; name: string; code: string }[]
  isSuper: boolean
  adminRegionId: string | null
}

export default function CreateUserForm({ regions, isSuper, adminRegionId }: CreateUserFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      phone: '',
      role: 'logistics',
      adminRole: 'regional_admin',
      regionId: adminRegionId || '',
    },
  })

  const selectedRole = form.watch('role')

  const handleSubmit = async (data: CreateUserData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user')
      }

      toast({
        title: 'User created!',
        description: `${data.role === 'admin' ? 'Admin' : 'Logistics partner'} account created successfully.`,
        variant: 'success',
      })

      router.push('/admin/users')
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 bg-card border rounded-xl p-6">
      {/* Back Link */}
      <Link 
        href="/admin/users" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Link>

      {/* Role Selection */}
      <div className="space-y-3">
        <Label>Account Type</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
              selectedRole === 'logistics'
                ? 'border-green-500 bg-green-50'
                : 'border-border hover:border-green-300'
            )}
          >
            <input
              type="radio"
              value="logistics"
              {...form.register('role')}
              className="sr-only"
            />
            <div className={cn(
              'p-2 rounded-lg',
              selectedRole === 'logistics'
                ? 'bg-green-500 text-white'
                : 'bg-muted'
            )}>
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Logistics Partner</p>
              <p className="text-sm text-muted-foreground">Delivery management</p>
            </div>
          </label>

          {isSuper && (
            <label
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                selectedRole === 'admin'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-border hover:border-purple-300'
              )}
            >
              <input
                type="radio"
                value="admin"
                {...form.register('role')}
                className="sr-only"
              />
              <div className={cn(
                'p-2 rounded-lg',
                selectedRole === 'admin'
                  ? 'bg-purple-500 text-white'
                  : 'bg-muted'
              )}>
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Admin</p>
                <p className="text-sm text-muted-foreground">Platform management</p>
              </div>
            </label>
          )}
        </div>
        {!isSuper && (
          <p className="text-xs text-muted-foreground">
            Only Super Admins can create admin accounts
          </p>
        )}
      </div>

      {/* Admin Role (if admin selected) */}
      {selectedRole === 'admin' && isSuper && (
        <div className="space-y-2">
          <Label htmlFor="adminRole">Admin Level</Label>
          <select
            id="adminRole"
            {...form.register('adminRole')}
            className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="regional_admin">Regional Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Super Admins have access to all regions. Regional Admins only see their assigned region.
          </p>
        </div>
      )}

      {/* Region */}
      <div className="space-y-2">
        <Label htmlFor="regionId">Region</Label>
        <select
          id="regionId"
          {...form.register('regionId')}
          disabled={!isSuper}
          className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-admin disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select region</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name} ({region.code})
            </option>
          ))}
        </select>
        {form.formState.errors.regionId && (
          <p className="text-sm text-destructive">{form.formState.errors.regionId.message}</p>
        )}
        {!isSuper && (
          <p className="text-xs text-muted-foreground">
            Users will be assigned to your region automatically
          </p>
        )}
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          placeholder="Enter full name"
          {...form.register('fullName')}
          error={!!form.formState.errors.fullName}
        />
        {form.formState.errors.fullName && (
          <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="user@example.com"
          {...form.register('email')}
          error={!!form.formState.errors.email}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
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

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimum 8 characters"
            {...form.register('password')}
            error={!!form.formState.errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-4 pt-4">
        <Link 
          href="/admin/users"
          className="flex-1 px-4 py-2 text-center border rounded-lg hover:bg-muted transition-colors"
        >
          Cancel
        </Link>
        <Button 
          type="submit" 
          className={cn(
            "flex-1",
            selectedRole === 'admin' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'
          )} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            `Create ${selectedRole === 'admin' ? 'Admin' : 'Logistics Partner'}`
          )}
        </Button>
      </div>
    </form>
  )
}