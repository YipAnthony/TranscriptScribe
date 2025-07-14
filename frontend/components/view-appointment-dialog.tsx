"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { IconLoader2, IconFileText, IconUser, IconMapPin, IconPill, IconStethoscope, IconHeart, IconMicroscope, IconScan, IconHistory, IconActivity, IconChevronDown } from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"

interface Appointment {
  id: string
  patient_id: string
  patient_name: string
  recorded_at: string | null
  status: string
  created_at: string
  updated_at: string
  // Parsed transcript fields
  conditions?: string[]
  interventions?: string[]
  medications?: string[]
  procedures?: string[]
  positive_symptoms?: string[]
  negative_symptoms?: string[]
  positive_lab_results?: string[]
  negative_lab_results?: string[]
  positive_imaging_results?: string[]
  negative_imaging_results?: string[]
  past_diagnoses?: string[]
  past_surgeries?: string[]
  family_history?: string[]
  positive_lifestyle_factors?: string[]
  negative_lifestyle_factors?: string[]
  extraction_notes?: string[]
  // Location fields from transcript
  street?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  // Patient info
  patients?: {
    first_name: string
    last_name: string
  }
  // Demographics
  sex?: string
  age?: number
  // Metadata
  processing_metadata?: any
}

interface ViewAppointmentDialogProps {
  appointmentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewAppointmentDialog({ appointmentId, open, onOpenChange }: ViewAppointmentDialogProps) {
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (open && appointmentId) {
      fetchAppointmentDetails()
    }
  }, [open, appointmentId])

  const fetchAppointmentDetails = async () => {
    if (!appointmentId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('transcripts')
        .select(`
          *,
          patients:patient_id(
            first_name, 
            last_name
          )
        `)
        .eq('id', appointmentId)
        .single()

      if (error) throw error

      const transformedAppointment = {
        ...data,
        patient_name: data.patients 
          ? `${data.patients.first_name} ${data.patients.last_name}`
          : 'Unknown Patient'
      }

      setAppointment(transformedAppointment)
    } catch (err) {
      console.error('Error fetching appointment details:', err)
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

  const renderArrayField = (items: string[] | undefined, emptyMessage: string) => {
    if (!items || items.length === 0) {
      return <p className="text-gray-500 italic text-left">{emptyMessage}</p>
    }
    return (
      <ul className="space-y-1 text-left">
        {items.map((item, index) => (
          <li key={index} className="text-sm">• {item}</li>
        ))}
      </ul>
    )
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center h-32">
            <IconLoader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading appointment details...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!appointment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-600">Appointment not found</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconFileText className="h-5 w-5" />
            Transcript Details
          </DialogTitle>
          <DialogDescription>
            Detailed information from {appointment.patient_name}'s appointment transcript.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Patient</h3>
              <p className="text-sm">{appointment.patient_name}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Status</h3>
              {getStatusBadge(appointment.status)}
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Appointment Date</h3>
              <p className="text-sm">{formatDate(appointment.recorded_at)}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Created</h3>
              <p className="text-sm">{formatDate(appointment.created_at)}</p>
            </div>
          </div>

          {/* Demographics */}
          {(appointment.sex || appointment.age) && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <IconUser className="h-4 w-4" />
                Demographics
              </h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                {appointment.sex && (
                  <div>
                    <span className="text-sm font-medium">Sex:</span> {appointment.sex}
                  </div>
                )}
                {appointment.age && (
                  <div>
                    <span className="text-sm font-medium">Age:</span> {appointment.age}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          {(appointment.city || appointment.state || appointment.country) && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <IconMapPin className="h-4 w-4" />
                Location
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  {[appointment.street, appointment.city, appointment.state, appointment.zip_code, appointment.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Medical Information Accordions */}
          <Accordion type="single" collapsible className="w-full">
            {appointment.conditions && appointment.conditions.length > 0 && (
              <AccordionItem value="conditions" className="border-b last:border-b-0">
                <AccordionTrigger className="font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <IconStethoscope className="h-4 w-4" />
                    Conditions
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {renderArrayField(appointment.conditions, 'No conditions recorded')}
                </AccordionContent>
              </AccordionItem>
            )}
            
            {(appointment.positive_symptoms && appointment.positive_symptoms.length > 0) || 
             (appointment.negative_symptoms && appointment.negative_symptoms.length > 0) ? (
              <AccordionItem value="symptoms" className="border-b last:border-b-0">
                <AccordionTrigger className="font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <IconHeart className="h-4 w-4" />
                    Symptoms
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {appointment.positive_symptoms && appointment.positive_symptoms.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-green-700 mb-2">Positive Symptoms</h4>
                      {renderArrayField(appointment.positive_symptoms, 'No positive symptoms recorded')}
                    </div>
                  )}
                  {appointment.negative_symptoms && appointment.negative_symptoms.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-red-700 mb-2">Negative Symptoms</h4>
                      {renderArrayField(appointment.negative_symptoms, 'No negative symptoms recorded')}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ) : null}
            
            {(appointment.medications && appointment.medications.length > 0) || 
             (appointment.procedures && appointment.procedures.length > 0) ? (
              <AccordionItem value="treatments" className="border-b last:border-b-0">
                <AccordionTrigger className="font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <IconPill className="h-4 w-4" />
                    Treatments
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {appointment.medications && appointment.medications.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Medications</h4>
                      {renderArrayField(appointment.medications, 'No medications recorded')}
                    </div>
                  )}
                  {appointment.procedures && appointment.procedures.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Procedures</h4>
                      {renderArrayField(appointment.procedures, 'No procedures recorded')}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ) : null}
            
            {(appointment.positive_lab_results && appointment.positive_lab_results.length > 0) || 
             (appointment.negative_lab_results && appointment.negative_lab_results.length > 0) ||
             (appointment.positive_imaging_results && appointment.positive_imaging_results.length > 0) ||
             (appointment.negative_imaging_results && appointment.negative_imaging_results.length > 0) ? (
              <AccordionItem value="labs_imaging" className="border-b last:border-b-0">
                <AccordionTrigger className="font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <IconMicroscope className="h-4 w-4" />
                    Labs & Imaging
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {(appointment.positive_lab_results && appointment.positive_lab_results.length > 0) || 
                   (appointment.negative_lab_results && appointment.negative_lab_results.length > 0) ? (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Lab Results</h4>
                      <div className="space-y-2">
                        {appointment.positive_lab_results && appointment.positive_lab_results.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-green-700">Positive</h5>
                            {renderArrayField(appointment.positive_lab_results, 'No positive lab results')}
                          </div>
                        )}
                        {appointment.negative_lab_results && appointment.negative_lab_results.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-red-700">Negative</h5>
                            {renderArrayField(appointment.negative_lab_results, 'No negative lab results')}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                  {(appointment.positive_imaging_results && appointment.positive_imaging_results.length > 0) || 
                   (appointment.negative_imaging_results && appointment.negative_imaging_results.length > 0) ? (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Imaging Results</h4>
                      <div className="space-y-2">
                        {appointment.positive_imaging_results && appointment.positive_imaging_results.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-green-700">Positive</h5>
                            {renderArrayField(appointment.positive_imaging_results, 'No positive imaging results')}
                          </div>
                        )}
                        {appointment.negative_imaging_results && appointment.negative_imaging_results.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-red-700">Negative</h5>
                            {renderArrayField(appointment.negative_imaging_results, 'No negative imaging results')}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </AccordionContent>
              </AccordionItem>
            ) : null}
            
            {(appointment.past_diagnoses && appointment.past_diagnoses.length > 0) || 
             (appointment.past_surgeries && appointment.past_surgeries.length > 0) ? (
              <AccordionItem value="past_medical" className="border-b last:border-b-0">
                <AccordionTrigger className="font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <IconHistory className="h-4 w-4" />
                    Past Medical History
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {appointment.past_diagnoses && appointment.past_diagnoses.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Past Diagnoses</h4>
                      {renderArrayField(appointment.past_diagnoses, 'No past diagnoses recorded')}
                    </div>
                  )}
                  {appointment.past_surgeries && appointment.past_surgeries.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Past Surgeries</h4>
                      {renderArrayField(appointment.past_surgeries, 'No past surgeries recorded')}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ) : null}
            
            {appointment.family_history && appointment.family_history.length > 0 && (
              <AccordionItem value="family_history" className="border-b last:border-b-0">
                <AccordionTrigger className="font-semibold text-sm">
                  Family History
                </AccordionTrigger>
                <AccordionContent>
                  {renderArrayField(appointment.family_history, 'No family history recorded')}
                </AccordionContent>
              </AccordionItem>
            )}
            
            {(appointment.positive_lifestyle_factors && appointment.positive_lifestyle_factors.length > 0) || 
             (appointment.negative_lifestyle_factors && appointment.negative_lifestyle_factors.length > 0) ? (
              <AccordionItem value="social_history" className="border-b last:border-b-0">
                <AccordionTrigger className="font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <IconActivity className="h-4 w-4" />
                    Social History
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {appointment.positive_lifestyle_factors && appointment.positive_lifestyle_factors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-green-700 mb-2">Positive Lifestyle Factors</h4>
                      {renderArrayField(appointment.positive_lifestyle_factors, 'No positive lifestyle factors')}
                    </div>
                  )}
                  {appointment.negative_lifestyle_factors && appointment.negative_lifestyle_factors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-red-700 mb-2">Negative Lifestyle Factors</h4>
                      {renderArrayField(appointment.negative_lifestyle_factors, 'No negative lifestyle factors')}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ) : null}
          </Accordion>

          {/* Extraction Notes */}
          {appointment.extraction_notes && appointment.extraction_notes.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Extraction Notes</h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                {renderArrayField(appointment.extraction_notes, 'No extraction notes')}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 