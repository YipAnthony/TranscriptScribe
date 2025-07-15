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
  const [generatedConversation, setGeneratedConversation] = useState("")
  const [activeTab, setActiveTab] = useState("manual")

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
      // This would call your backend API to generate conversation
      // For now, we'll create a mock conversation
      const patient = patients.find(p => p.id === selectedPatient)
      const mockConversation = `Dr. Smith: Good morning, ${patient?.first_name}. How are you feeling today?

${patient?.first_name}: I've been experiencing some chest pain and shortness of breath.

Dr. Smith: I see. When did these symptoms start?

${patient?.first_name}: About three days ago. It gets worse when I walk up stairs.

Dr. Smith: Have you noticed any other symptoms like fatigue or swelling in your legs?

${patient?.first_name}: Yes, I've been more tired than usual, and my ankles are a bit swollen.

Dr. Smith: Thank you for sharing that. Let me examine you and then we'll discuss some tests we might need to run.`

      setGeneratedConversation(mockConversation)
    } catch (err) {
      console.error('Error generating conversation:', err)
    } finally {
      setGeneratingConversation(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedPatient) {
      alert('Please select a patient')
      return
    }

    // Use the conversation from the active tab
    const conversationToUse = activeTab === 'manual' ? conversationText : generatedConversation
    
    if (!conversationToUse.trim()) {
      alert('Please provide conversation text')
      return
    }

    try {
      setCreatingAppointment(true)

      // Step 1: Call the backend API to process the transcript (appointment)
      const transcriptResponse = await apiClient.processTranscript({
        patient_id: selectedPatient,
        raw_transcript: conversationToUse,
        recorded_at: appointmentDate || undefined
      })

      if (transcriptResponse.error) {
        throw new Error(transcriptResponse.error)
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
      
      // Reset form
      setSelectedPatient("")
      setAppointmentDate(() => {
        const now = new Date()
        return now.toISOString().slice(0, 16)
      })
      setConversationText("")
      setGeneratedConversation("")
      setActiveTab("manual")
    } catch (err) {
      console.error('Error creating appointment:', err)
      alert(`Failed to create appointment: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="generated">Generated</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="space-y-2">
                <Textarea
                  placeholder="Paste or type the patient-provider conversation here..."
                  value={conversationText}
                  onChange={(e) => setConversationText(e.target.value)}
                  rows={12}
                  className="min-h-[300px] max-h-[400px] overflow-y-auto"
                />
              </TabsContent>
              
              <TabsContent value="generated" className="space-y-2">
                {generatedConversation ? (
                  <Textarea
                    value={generatedConversation}
                    onChange={(e) => setGeneratedConversation(e.target.value)}
                    rows={12}
                    className="min-h-[300px] max-h-[400px] overflow-y-auto"
                    placeholder="Generated conversation will appear here..."
                  />
                ) : (
                  <div className="flex items-center justify-center h-[300px] border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <p className="text-gray-600">No conversation generated yet</p>
                      <p className="text-sm text-gray-500">Click "Generate Conversation" to create one</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={creatingAppointment || generatingConversation || !selectedPatient || (!conversationText.trim() && !generatedConversation.trim())}>
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