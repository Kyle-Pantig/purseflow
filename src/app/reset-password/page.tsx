'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

function ResetPasswordContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const type = searchParams.get('type')

    if (!accessToken || type !== 'recovery') {
      setIsValidToken(false)
      setCheckingToken(false)
      return
    }

    // For password reset, we'll assume the token is valid if we have the required params
    // The actual validation will happen when the user tries to update their password
    setIsValidToken(true)
    setCheckingToken(false)
  }, [searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)

    try {
      // Get the access token from URL parameters
      const accessToken = searchParams.get('access_token')
      
      if (!accessToken) {
        setError('Invalid reset link')
        return
      }

      // For password reset, we need to verify the OTP first
      // The access_token in password reset links is actually a recovery token
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: accessToken,
        type: 'recovery'
      })

      if (error) {
        console.error('OTP verification error:', error)
        setError('Invalid or expired reset link')
        return
      }

      // Now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        // Show success state
        setSuccess(true)
        
        // Sign out the user after password update
        await supabase.auth.signOut()
        
        // Use a small delay and window.location to ensure clean redirect
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-svh w-full p-6 md:p-10 relative">
        {/* Branding positioned in top left on desktop, centered on mobile */}
        <div className="flex justify-center md:justify-start mb-8">
          <div className="flex items-center gap-4">
            <img 
              src="/branding-icon.png" 
              alt="PurseFlow" 
              width={48} 
              height={48}
              className="h-12 w-12 dark:invert"
            />
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-foreground">PurseFlow</h1>
              <p className="text-sm text-muted-foreground">Expense Tracker & Budget App</p>
            </div>
          </div>
        </div>
        
        {/* Form centered both horizontally and vertically */}
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="w-full max-w-sm">
            <Card className="bg-transparent border-0 shadow-none">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold">Password Updated!</CardTitle>
                <CardDescription>
                  Your password has been successfully updated. Redirecting to login...
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (checkingToken) {
    return (
      <div className="min-h-svh w-full p-6 md:p-10 relative">
        {/* Branding positioned in top left on desktop, centered on mobile */}
        <div className="flex justify-center md:justify-start mb-8">
          <div className="flex items-center gap-4">
            <img 
              src="/branding-icon.png" 
              alt="PurseFlow" 
              width={48} 
              height={48}
              className="h-12 w-12 dark:invert"
            />
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-foreground">PurseFlow</h1>
              <p className="text-sm text-muted-foreground">Expense Tracker & Budget App</p>
            </div>
          </div>
        </div>
        
        {/* Loading centered both horizontally and vertically */}
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="w-full max-w-sm text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-svh w-full p-6 md:p-10 relative">
        {/* Branding positioned in top left on desktop, centered on mobile */}
        <div className="flex justify-center md:justify-start mb-8">
          <div className="flex items-center gap-4">
            <img 
              src="/branding-icon.png" 
              alt="PurseFlow" 
              width={48} 
              height={48}
              className="h-12 w-12 dark:invert"
            />
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-foreground">PurseFlow</h1>
              <p className="text-sm text-muted-foreground">Expense Tracker & Budget App</p>
            </div>
          </div>
        </div>
        
        {/* Form centered both horizontally and vertically */}
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="w-full max-w-sm">
            <Card className="bg-transparent border-0 shadow-none">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                  <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold">Invalid Reset Link</CardTitle>
                <CardDescription>
                  This password reset link is invalid or has expired
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button
                    onClick={() => router.push('/forgot-password')}
                    className="w-full"
                  >
                    Request New Reset Link
                  </Button>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh w-full p-6 md:p-10 relative">
      {/* Branding positioned in top left on desktop, centered on mobile */}
      <div className="flex justify-center md:justify-start mb-8">
        <div className="flex items-center gap-4">
          <img 
            src="/branding-icon.png" 
            alt="PurseFlow" 
            width={48} 
            height={48}
            className="h-12 w-12 dark:invert"
          />
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-foreground">PurseFlow</h1>
            <p className="text-sm text-muted-foreground">Expense Tracker & Budget App</p>
          </div>
        </div>
      </div>
      
      {/* Form centered both horizontally and vertically */}
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-sm">
          <Card className="bg-transparent border-0 shadow-none">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pr-10"
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                Remember your password?{' '}
                <Link
                  href="/login"
                  className="text-primary hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-svh w-full p-6 md:p-10 relative">
        {/* Branding positioned in top left on desktop, centered on mobile */}
        <div className="flex justify-center md:justify-start mb-8">
          <div className="flex items-center gap-4">
            <img 
              src="/branding-icon.png" 
              alt="PurseFlow" 
              width={48} 
              height={48}
              className="h-12 w-12 dark:invert"
            />
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-foreground">PurseFlow</h1>
              <p className="text-sm text-muted-foreground">Expense Tracker & Budget App</p>
            </div>
          </div>
        </div>
        
        {/* Loading centered both horizontally and vertically */}
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="w-full max-w-sm text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
