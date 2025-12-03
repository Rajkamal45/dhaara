'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, Clock, XCircle, Building2, Phone, Mail, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function KYCStatusPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        
        // If approved, redirect to home
        if (profileData.kyc_status === 'approved') {
          router.push('/')
          return
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    )
  }

  // Pending Status
  if (profile?.kyc_status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          {/* Status Icon */}
          <div className="text-center mb-6">
            <div className="h-20 w-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-10 w-10 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Verification Pending</h1>
            <p className="text-gray-600 mt-2">
              Your account is being reviewed by our team
            </p>
          </div>

          {/* Timeline */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <p className="font-medium text-yellow-800">Under Review</p>
                <p className="text-sm text-yellow-700 mt-1">
                  This usually takes 24-48 hours. We'll notify you once verified.
                </p>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="border rounded-lg p-4 space-y-3 mb-6">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Submitted Details
            </h3>
            <div className="text-sm space-y-2 text-gray-600">
              <p><span className="font-medium">Name:</span> {profile.full_name}</p>
              <p><span className="font-medium">Business:</span> {profile.business_name || '-'}</p>
              <p><span className="font-medium">Type:</span> {profile.business_type || '-'}</p>
              <p><span className="font-medium">Phone:</span> {profile.phone || '-'}</p>
              {profile.kyc_submitted_at && (
                <p><span className="font-medium">Submitted:</span> {new Date(profile.kyc_submitted_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Contact Support */}
          <div className="text-center text-sm text-gray-500 mb-4">
            <p>Need help? Contact support</p>
            <p className="font-medium text-green-600">support@dhaara.com</p>
          </div>

          {/* Logout Button */}
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    )
  }

  // Rejected Status
  if (profile?.kyc_status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          {/* Status Icon */}
          <div className="text-center mb-6">
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Verification Rejected</h1>
            <p className="text-gray-600 mt-2">
              Your account verification was not approved
            </p>
          </div>

          {/* Rejection Reason */}
          {profile.kyc_rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="font-medium text-red-800 mb-1">Reason:</p>
              <p className="text-sm text-red-700">{profile.kyc_rejection_reason}</p>
            </div>
          )}

          {/* What to do */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="font-medium text-gray-800 mb-2">What can you do?</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Contact support for clarification</li>
              <li>• Register with correct details</li>
              <li>• Provide valid business documents</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center text-sm text-gray-500 mb-4">
            <p>Contact support for assistance</p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <a href="mailto:support@dhaara.com" className="flex items-center gap-1 text-green-600 hover:underline">
                <Mail className="h-4 w-4" />
                support@dhaara.com
              </a>
              <a href="tel:+919876543210" className="flex items-center gap-1 text-green-600 hover:underline">
                <Phone className="h-4 w-4" />
                +91 98765 43210
              </a>
            </div>
          </div>

          {/* Logout Button */}
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    )
  }

  // Not Submitted - This shouldn't happen if filled during registration
  // But just in case, redirect to contact support
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-10 w-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Required</h1>
        <p className="text-gray-600 mb-6">
          Your account needs verification. Please contact support.
        </p>
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}