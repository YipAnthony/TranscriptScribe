'use client'

import { useAuth } from '@/lib/auth-context'
import { ProtectedRoute } from '@/components/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
  }

  const handleAdminPortal = () => {
    router.push('/admin')
  }

  const handlePatientPortal = () => {
    router.push('/patient')
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to TranscriptScribe
            </h1>
            <p className="text-xl text-gray-600">
              AI-powered transcript analysis and clinical trial matching
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleAdminPortal}>
              <CardHeader>
                <CardTitle className="text-2xl">Admin Portal</CardTitle>
                <CardDescription>
                  Pretend to be an admin. Manage patients, appointments, transcripts, and create trial recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="default">
                  Access Admin Portal
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handlePatientPortal}>
              <CardHeader>
                <CardTitle className="text-2xl">Patient Portal</CardTitle>
                <CardDescription>
                  Pretend to be a patient. View appointments and clinical trial recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Access Patient Portal
                </Button>
              </CardContent>
            </Card>
          </div>

          {user && (
            <Card className="mt-8 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>
                  You are logged in as {user.email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    User ID: {user.id}
                  </div>
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
