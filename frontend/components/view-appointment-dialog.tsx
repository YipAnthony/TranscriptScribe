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
import { IconLoader2, IconFileText, IconUser, IconMapPin, IconPill, IconStethoscope, IconHeart, IconMicroscope, IconScan, IconHistory, IconActivity, IconChevronDown, IconCheck, IconX, IconInfoCircle, IconBrain, IconScissors } from "@tabler/icons-react"
import { apiClient } from '@/lib/api-client'

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

  useEffect(() => {
    if (open && appointmentId) {
      fetchAppointmentDetails()
    }
  }, [open, appointmentId])

  const fetchAppointmentDetails = async () => {
    if (!appointmentId) return
    try {
      setLoading(true)
      const data = await apiClient.getAppointmentById(appointmentId)
      setAppointment(data)
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

  // Enhanced rendering functions for better UI/UX
  const renderPillList = (items: string[] | undefined, emptyMessage: string, variant: 'default' | 'positive' | 'negative' | 'neutral' = 'default') => {
    if (!items || items.length === 0) {
      return (
        <div className="flex items-center gap-2 text-gray-500 italic">
          <IconInfoCircle className="h-4 w-4" />
          <span className="text-sm">{emptyMessage}</span>
        </div>
      )
    }

    const variantStyles = {
      default: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      positive: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      negative: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
      neutral: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
    }

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className={`${variantStyles[variant]} text-xs px-3 py-1 rounded-full`}
          >
            {item}
          </Badge>
        ))}
      </div>
    )
  }

  const renderSymptomSection = (positiveSymptoms: string[] | undefined, negativeSymptoms: string[] | undefined) => {
    const hasPositive = positiveSymptoms && positiveSymptoms.length > 0
    const hasNegative = negativeSymptoms && negativeSymptoms.length > 0

    if (!hasPositive && !hasNegative) {
      return (
        <div className="flex items-center gap-2 text-gray-500 italic">
          <IconInfoCircle className="h-4 w-4" />
          <span className="text-sm">No symptoms recorded</span>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {hasPositive && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <IconCheck className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-sm text-green-700">Positive Symptoms</h4>
            </div>
            {renderPillList(positiveSymptoms, '', 'positive')}
          </div>
        )}
        {hasNegative && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <IconX className="h-4 w-4 text-red-600" />
              <h4 className="font-medium text-sm text-red-700">Negative Symptoms</h4>
            </div>
            {renderPillList(negativeSymptoms, '', 'negative')}
          </div>
        )}
      </div>
    )
  }

  const renderLabImagingSection = (
    positiveLabs: string[] | undefined, 
    negativeLabs: string[] | undefined,
    positiveImaging: string[] | undefined,
    negativeImaging: string[] | undefined
  ) => {
    const hasLabs = (positiveLabs && positiveLabs.length > 0) || (negativeLabs && negativeLabs.length > 0)
    const hasImaging = (positiveImaging && positiveImaging.length > 0) || (negativeImaging && negativeImaging.length > 0)

    if (!hasLabs && !hasImaging) {
      return (
        <div className="flex items-center gap-2 text-gray-500 italic">
          <IconInfoCircle className="h-4 w-4" />
          <span className="text-sm">No lab or imaging results recorded</span>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {hasLabs && (
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <IconMicroscope className="h-4 w-4" />
              Lab Results
            </h4>
            <div className="space-y-3">
              {positiveLabs && positiveLabs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <IconCheck className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Positive</span>
                  </div>
                  {renderPillList(positiveLabs, '', 'positive')}
                </div>
              )}
              {negativeLabs && negativeLabs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <IconX className="h-3 w-3 text-red-600" />
                    <span className="text-xs font-medium text-red-700">Negative</span>
                  </div>
                  {renderPillList(negativeLabs, '', 'negative')}
                </div>
              )}
            </div>
          </div>
        )}
        
        {hasImaging && (
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <IconScan className="h-4 w-4" />
              Imaging Results
            </h4>
            <div className="space-y-3">
              {positiveImaging && positiveImaging.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <IconCheck className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Positive</span>
                  </div>
                  {renderPillList(positiveImaging, '', 'positive')}
                </div>
              )}
              {negativeImaging && negativeImaging.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <IconX className="h-3 w-3 text-red-600" />
                    <span className="text-xs font-medium text-red-700">Negative</span>
                  </div>
                  {renderPillList(negativeImaging, '', 'negative')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Legacy function for backward compatibility
  const renderArrayField = (items: string[] | undefined, emptyMessage: string) => {
    return renderPillList(items, emptyMessage, 'default')
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Appointment</DialogTitle>
          </DialogHeader>
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
          <DialogHeader>
            <DialogTitle>Appointment Not Found</DialogTitle>
          </DialogHeader>
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
                  {renderPillList(appointment.conditions, 'No conditions recorded', 'default')}
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
                <AccordionContent>
                  {renderSymptomSection(appointment.positive_symptoms, appointment.negative_symptoms)}
                </AccordionContent>
              </AccordionItem>
            ) : null}
            
            {(appointment.medications && appointment.medications.length > 0) || 
             (appointment.procedures && appointment.procedures.length > 0) ? (
              <AccordionItem value="treatments" className="border-b last:border-b-0">
                <AccordionTrigger className="font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <IconBrain className="h-4 w-4" />
                    Treatments
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {appointment.medications && appointment.medications.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <IconPill className="h-4 w-4" />
                        Medications
                      </h4>
                      {renderPillList(appointment.medications, 'No medications recorded', 'default')}
                    </div>
                  )}
                  {appointment.procedures && appointment.procedures.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <IconScan className="h-4 w-4" />
                        Procedures
                      </h4>
                      {renderPillList(appointment.procedures, 'No procedures recorded', 'neutral')}
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
                <AccordionContent>
                  {renderLabImagingSection(
                    appointment.positive_lab_results,
                    appointment.negative_lab_results,
                    appointment.positive_imaging_results,
                    appointment.negative_imaging_results
                  )}
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
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <IconBrain className="h-4 w-4" />
                        Past Diagnoses
                      </h4>
                      {renderPillList(appointment.past_diagnoses, 'No past diagnoses recorded', 'neutral')}
                    </div>
                  )}
                  {appointment.past_surgeries && appointment.past_surgeries.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <IconScissors className="h-4 w-4" />
                        Past Surgeries
                      </h4>
                      {renderPillList(appointment.past_surgeries, 'No past surgeries recorded', 'neutral')}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ) : null}
            
            {appointment.family_history && appointment.family_history.length > 0 && (
              <AccordionItem value="family_history" className="border-b last:border-b-0">
                <AccordionTrigger className="font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <IconUser className="h-4 w-4" />
                    Family History
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {renderPillList(appointment.family_history, 'No family history recorded', 'neutral')}
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
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <IconCheck className="h-4 w-4 text-green-600" />
                        Positive Lifestyle Factors
                      </h4>
                      {renderPillList(appointment.positive_lifestyle_factors, 'No positive lifestyle factors', 'positive')}
                    </div>
                  )}
                  {appointment.negative_lifestyle_factors && appointment.negative_lifestyle_factors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <IconX className="h-4 w-4 text-red-600" />
                        Negative Lifestyle Factors
                      </h4>
                      {renderPillList(appointment.negative_lifestyle_factors, 'No negative lifestyle factors', 'negative')}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ) : null}
          </Accordion>

          {/* Extraction Notes */}
          {appointment.extraction_notes && appointment.extraction_notes.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <IconInfoCircle className="h-4 w-4" />
                Extraction Notes
              </h3>
              <div className="p-4 bg-gray-50 rounded-lg">
                {renderPillList(appointment.extraction_notes, 'No extraction notes', 'neutral')}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 