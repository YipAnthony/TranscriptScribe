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
import { IconLoader2, IconFlask, IconStar, IconMapPin, IconCalendar, IconExternalLink, IconUser } from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"

interface ClinicalTrial {
  id: string
  external_id: string
  brief_title: string
  status: string
  conditions: string[]
  brief_summary: string
  locations: string[]
  created_at: string
}

interface TranscriptRecommendations {
  id: string
  transcript_id: string
  eligible_trials: string[]
  uncertain_trials: string[]
  created_at: string
}

interface ViewRecommendedTrialsDialogProps {
  appointmentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewRecommendedTrialsDialog({ appointmentId, open, onOpenChange }: ViewRecommendedTrialsDialogProps) {
  const [recommendations, setRecommendations] = useState<TranscriptRecommendations | null>(null)
  const [eligibleTrials, setEligibleTrials] = useState<ClinicalTrial[]>([])
  const [uncertainTrials, setUncertainTrials] = useState<ClinicalTrial[]>([])
  const [loading, setLoading] = useState(false)
  const [patientName, setPatientName] = useState<string>("")
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    if (open && appointmentId) {
      fetchRecommendations()
    }
  }, [open, appointmentId])

  const fetchRecommendations = async () => {
    if (!appointmentId) return

    try {
      setLoading(true)
      
      // Fetch transcript recommendations
      const { data: recommendationsData, error: recommendationsError } = await supabase
        .from('transcript_recommendations')
        .select('*')
        .eq('transcript_id', appointmentId)
        .single()

      if (recommendationsError && recommendationsError.code !== 'PGRST116') {
        throw recommendationsError
      }

      if (recommendationsData) {
        setRecommendations(recommendationsData)
        
        // Fetch eligible trials
        if (recommendationsData.eligible_trials && recommendationsData.eligible_trials.length > 0) {
          const { data: eligibleData, error: eligibleError } = await supabase
            .from('clinical_trials')
            .select('*')
            .in('id', recommendationsData.eligible_trials)
          
          if (!eligibleError && eligibleData) {
            setEligibleTrials(eligibleData)
          }
        }
        
        // Fetch uncertain trials
        if (recommendationsData.uncertain_trials && recommendationsData.uncertain_trials.length > 0) {
          const { data: uncertainData, error: uncertainError } = await supabase
            .from('clinical_trials')
            .select('*')
            .in('id', recommendationsData.uncertain_trials)
          
          if (!uncertainError && uncertainData) {
            setUncertainTrials(uncertainData)
          }
        }
      }

      // Fetch patient name
      const { data: transcriptData, error: transcriptError } = await supabase
        .from('transcripts')
        .select(`
          patients:patient_id(first_name, last_name)
        `)
        .eq('id', appointmentId)
        .single()

      if (!transcriptError && transcriptData?.patients) {
        const patients = transcriptData.patients as { first_name: string; last_name: string }[]
        if (patients.length > 0) {
          const patient = patients[0]
          setPatientName(`${patient.first_name} ${patient.last_name}`)
        }
      }

    } catch (err) {
      console.error('Error fetching recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      RECRUITING: { color: 'bg-green-100 text-green-800', label: 'Recruiting' },
      ACTIVE_NOT_RECRUITING: { color: 'bg-yellow-100 text-yellow-800', label: 'Active' },
      COMPLETED: { color: 'bg-blue-100 text-blue-800', label: 'Completed' },
      TERMINATED: { color: 'bg-red-100 text-red-800', label: 'Terminated' },
      SUSPENDED: { color: 'bg-orange-100 text-orange-800', label: 'Suspended' },
      WITHDRAWN: { color: 'bg-gray-100 text-gray-800', label: 'Withdrawn' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800', label: status }
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const renderTrialCard = (trial: ClinicalTrial, index: number) => {
    const summaryLength = trial.brief_summary?.length || 0
    const shouldTruncate = summaryLength > 150
    const isExpanded = expandedSummaries.has(trial.id)
    const displaySummary = shouldTruncate && !isExpanded 
      ? trial.brief_summary?.substring(0, 150) + '...'
      : trial.brief_summary

    const toggleSummary = () => {
      const newExpanded = new Set(expandedSummaries)
      if (isExpanded) {
        newExpanded.delete(trial.id)
      } else {
        newExpanded.add(trial.id)
      }
      setExpandedSummaries(newExpanded)
    }

    return (
      <div key={trial.id} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{trial.brief_title}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
              <IconFlask className="h-3 w-3" />
              <span>NCT ID: {trial.external_id}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IconStar className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">#{index + 1}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          {getStatusBadge(trial.status)}
          {trial.locations && trial.locations.length > 0 && (
            <div className="flex items-center gap-1 text-gray-600">
              <IconMapPin className="h-3 w-3" />
              <span>{trial.locations[0]}</span>
              {trial.locations.length > 1 && <span>+{trial.locations.length - 1} more</span>}
            </div>
          )}
        </div>
        
        {trial.conditions && trial.conditions.length > 0 && (
          <div className="text-xs">
            <span className="font-medium text-gray-700">Conditions: </span>
            <span className="text-gray-600">{trial.conditions.slice(0, 3).join(', ')}</span>
            {trial.conditions.length > 3 && <span className="text-gray-500"> +{trial.conditions.length - 3} more</span>}
          </div>
        )}
        
        {trial.brief_summary && (
          <div className="text-xs text-gray-600 leading-relaxed">
            {displaySummary}
            {shouldTruncate && (
              <button
                onClick={toggleSummary}
                className="ml-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-end pt-2">
          <Button variant="outline" size="sm" className="h-6 text-xs">
            <IconExternalLink className="mr-1 h-3 w-3" />
            View Details
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconFlask className="h-5 w-5" />
              Clinical Trial Recommendations
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-32">
            <IconLoader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading clinical trial recommendations...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const totalTrials = eligibleTrials.length + uncertainTrials.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconFlask className="h-5 w-5" />
            Clinical Trial Recommendations
          </DialogTitle>
          <DialogDescription>
            {patientName && `Recommended clinical trials for ${patientName}'s appointment.`}
            {!patientName && 'Clinical trial recommendations for this appointment.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{eligibleTrials.length}</div>
              <div className="text-sm text-gray-600">Eligible Trials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{uncertainTrials.length}</div>
              <div className="text-sm text-gray-600">Uncertain Trials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalTrials}</div>
              <div className="text-sm text-gray-600">Total Trials</div>
            </div>
          </div>

          {totalTrials === 0 ? (
            <div className="text-center py-8">
              <IconFlask className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Clinical Trial Recommendations</h3>
              <p className="text-gray-600">
                No clinical trials have been recommended for this appointment yet. 
                Recommendations are generated automatically when transcripts are processed.
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {eligibleTrials.length > 0 && (
                <AccordionItem value="eligible" className="border-b last:border-b-0">
                  <AccordionTrigger className="font-semibold text-sm">
                    <div className="flex items-center gap-2">
                      <IconStar className="h-4 w-4 text-green-600" />
                      Eligible Trials ({eligibleTrials.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {eligibleTrials.map((trial, index) => renderTrialCard(trial, index))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {uncertainTrials.length > 0 && (
                <AccordionItem value="uncertain" className="border-b last:border-b-0">
                  <AccordionTrigger className="font-semibold text-sm">
                    <div className="flex items-center gap-2">
                      <IconCalendar className="h-4 w-4 text-yellow-600" />
                      Uncertain Trials ({uncertainTrials.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 mb-4">
                        These trials may be suitable but require additional review or clarification of eligibility criteria.
                      </p>
                      {uncertainTrials.map((trial, index) => renderTrialCard(trial, index))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 