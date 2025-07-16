'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { ProtectedRoute } from '@/components/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import type { Patient } from '@/types'

export default function Home() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getPatients()
      setPatients(data)
      if (data.length > 0) {
        setSelectedPatient(data[0].id)
      }
    } catch (err) {
      console.error('Error fetching patients:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleAdminPortal = () => {
    router.push('/admin')
  }

  const handlePatientPortal = () => {
    if (selectedPatient) {
      router.push(`/patient/${selectedPatient}/appointments`)
    } else {
      router.push('/patient')
    }
  }

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatient(patientId)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when clicking on the select dropdown
    if ((e.target as HTMLElement).closest('[data-radix-select-trigger]')) {
      e.stopPropagation()
      return
    }
    handlePatientPortal()
  }

  const formatName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`.trim()
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

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleCardClick}>
              <CardHeader>
                <CardTitle className="text-2xl">Patient Portal</CardTitle>
                <CardDescription>
                  Pretend to be a patient. View appointments and clinical trial recommendations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Select Patient to Proxy as:</label>
                  <Select value={selectedPatient} onValueChange={handlePatientSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder={loading ? "Loading patients..." : "Select a patient"} />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {formatName(patient.first_name, patient.last_name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled={!selectedPatient || loading}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePatientPortal()
                  }}
                >
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
