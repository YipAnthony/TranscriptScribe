"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { IconArrowLeft, IconCalendar, IconUser, IconFlask, IconLoader2 } from "@tabler/icons-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import Link from "next/link"

interface Appointment {
  id: string
  patient_id: string
  patient_name: string
  recorded_at: string | null
  status: string
  created_at: string
  updated_at: string
  clinical_trials_count?: number
  conditions?: string[]
}

export default function AdminAppointmentPage() {
  const router = useRouter()
  const params = useParams() as { appointmentId: string }
  const { appointmentId } = params

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetails()
    }
  }, [appointmentId])

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAppointmentById(appointmentId)
      setAppointment(data)
    } catch (err) {
      console.error('Error fetching appointment details:', err)
      toast.error('Failed to load appointment details')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      PROCESSING: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      COMPLETED: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      FAILED: { color: 'bg-red-100 text-red-800', label: 'Failed' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return <Badge className={config.color}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <IconLoader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading appointment details...</span>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500">Appointment not found</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()} 
          className="h-10 w-10 p-0 rounded-full hover:bg-white/80 transition-colors"
        >
          <IconArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Appointment Details</h1>
          <p className="text-sm text-gray-600">
            {appointment.patient_name && `for ${appointment.patient_name}`}
            {appointment.recorded_at && ` • ${formatDate(appointment.recorded_at)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(appointment.status)}
          <Link href={`/admin/appointments/${appointmentId}/trials`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <IconFlask className="mr-2 h-4 w-4" />
              View Recommended Trials
            </Button>
          </Link>
        </div>
      </div>

      <Separator />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient</CardTitle>
            <IconUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointment.patient_name}</div>
            <p className="text-xs text-muted-foreground">
              Patient ID: {appointment.patient_id}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointment Date</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDate(appointment.recorded_at)}
            </div>
            <p className="text-xs text-muted-foreground">
              Recorded appointment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clinical Trials</CardTitle>
            <IconFlask className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointment.clinical_trials_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              Recommended trials
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getStatusBadge(appointment.status)}
            </div>
            <p className="text-xs text-muted-foreground">
              Processing status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conditions */}
      {appointment.conditions && appointment.conditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Medical Conditions</CardTitle>
            <CardDescription>
              Conditions identified from the appointment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {appointment.conditions.map((condition, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {condition}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Created</h4>
              <p className="text-sm text-gray-900">{formatDate(appointment.created_at)}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Last Updated</h4>
              <p className="text-sm text-gray-900">{formatDate(appointment.updated_at)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href={`/admin/appointments/${appointmentId}/trials`} className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <IconFlask className="mr-2 h-4 w-4" />
                View Recommended Trials
              </Button>
            </Link>
            <Button variant="outline" className="w-full">
              <IconUser className="mr-2 h-4 w-4" />
              View Patient Details
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 