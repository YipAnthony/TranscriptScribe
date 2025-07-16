"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconPlus, IconLoader2 } from "@tabler/icons-react"
import { apiClient } from "@/lib/api-client"
import type { Patient } from "@/types"
import { toast } from "sonner"

interface AddAppointmentDialogProps {
  onAppointmentAdded: () => void
}

export function AddAppointmentDialog({ onAppointmentAdded }: AddAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [generatingConversation, setGeneratingConversation] = useState(false)
  const [creatingAppointment, setCreatingAppointment] = useState(false)
  const [patientsLoading, setPatientsLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState("")
  const [appointmentDate, setAppointmentDate] = useState(() => {
    const now = new Date()
    return now.toISOString().slice(0, 16)
  })
  const [conversationText, setConversationText] = useState("")

  useEffect(() => {
    if (open) {
      fetchPatients()
    }
  }, [open])

  const fetchPatients = async () => {
    try {
      setPatientsLoading(true)
      const data = await apiClient.getPatientsForSelect()
      setPatients(data)
    } catch (err) {
      console.error('Error fetching patients:', err)
    } finally {
      setPatientsLoading(false)
    }
  }

  const generateConversation = async () => {
    if (!selectedPatient) return

    try {
      setGeneratingConversation(true)
      // Call backend API to generate conversation
      const generated = await apiClient.generateFakeTranscript(selectedPatient)
      setConversationText(generated)
    } catch (err) {
      console.error('Error generating conversation:', err)
      toast.error('Failed to generate conversation. Please try again.')
    } finally {
      setGeneratingConversation(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient')
      return
    }

    if (!conversationText.trim()) {
      toast.error('Please provide conversation text')
      return
    }

    try {
      setCreatingAppointment(true)

      // Step 1: Call the backend API to process the transcript (appointment)
      const transcriptResponse = await apiClient.processTranscript({
        patient_id: selectedPatient,
        raw_transcript: conversationText,
        recorded_at: appointmentDate || undefined
      })

      if (transcriptResponse.error) {
        toast.error("Issue creating appointment: " + transcriptResponse.error)
        return
      }

      // Step 2: Get the transcript ID from the response and create clinical trial recommendations
      const transcriptId = transcriptResponse.data?.transcript_id
      if (transcriptId) {
        try {
          const recommendationsResponse = await apiClient.createClinicalTrialRecommendations({
            patient_id: selectedPatient,
            transcript_id: transcriptId
          })

          if (recommendationsResponse.error) {
            console.warn('Failed to create clinical trial recommendations:', recommendationsResponse.error)
            // Don't throw here - the transcript was created successfully
          }
        } catch (recommendationsErr) {
          console.warn('Error creating clinical trial recommendations:', recommendationsErr)
          // Don't throw here - the transcript was created successfully
        }
      }

      setOpen(false)
      onAppointmentAdded()
      toast.success('Appointment created successfully!')
      
      // Reset form
      setSelectedPatient("")
      setAppointmentDate(() => {
        const now = new Date()
        return now.toISOString().slice(0, 16)
      })
      setConversationText("")
      setGeneratingConversation(false)
      setCreatingAppointment(false)
    } catch (err) {
      console.error('Error creating appointment:', err)
      toast.error(`Failed to create appointment: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setCreatingAppointment(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="mr-2 h-4 w-4" />
          Create Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Appointment</DialogTitle>
          <DialogDescription>
            Create a new appointment by selecting a patient and providing a patient-provider conversation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Patient *</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patientsLoading ? (
                    <SelectItem value="loading" disabled>
                      <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading patients...
                    </SelectItem>
                  ) : (
                    patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Appointment Date (Optional)</Label>
              <Input
                id="date"
                type="datetime-local"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Conversation *</Label>
              <Button 
                onClick={generateConversation} 
                disabled={!selectedPatient || generatingConversation || creatingAppointment}
                variant="outline"
                size="sm"
              >
                {generatingConversation ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Conversation'
                )}
              </Button>
            </div>
            <Textarea
              placeholder="Paste or type the patient-provider conversation here..."
              value={conversationText}
              onChange={(e) => setConversationText(e.target.value)}
              rows={12}
              className="min-h-[300px] max-h-[400px] overflow-y-auto"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={creatingAppointment || generatingConversation || !selectedPatient || !conversationText.trim()}>
            {creatingAppointment ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Appointment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 