"use client"

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { IconLoader2, IconFlask, IconStar, IconMapPin, IconExternalLink, IconArrowLeft, IconBookmark, IconMessage, IconMessagePlus } from "@tabler/icons-react"
import { apiClient } from "@/lib/api-client"
import ReactMarkdown from 'react-markdown'
import type { ClinicalTrial, ClinicalTrialDetails, TranscriptRecommendations } from "@/types"
import { TrialChatPanel } from '@/components/trial-chat-panel'
import { Separator } from "@/components/ui/separator"
import { useSidebar } from '@/components/ui/sidebar'

function unescapeText(text: string): string {
  if (!text) return text;
  return text
    .replace(/\\>/g, '>')
    .replace(/\\</g, '<')
    .replace(/\\&/g, '&')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');
}

function TrialDetailsPanel({ trial, onBack, getStatusBadge, onOpenChat }: { trial: ClinicalTrial | null, onBack: () => void, getStatusBadge: (status: string) => ReactNode, onOpenChat: () => void }) {
  const [trialDetails, setTrialDetails] = useState<ClinicalTrialDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  // Remove chatDrawerOpen and Drawer
  const [showFullSummary, setShowFullSummary] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showAllLocations, setShowAllLocations] = useState(false)

  useEffect(() => {
    if (trial) {
      setDetailsLoading(true)
      setTrialDetails(null)
      apiClient.getClinicalTrial(trial.id)
        .then(details => setTrialDetails(details.trial))
        .finally(() => setDetailsLoading(false))
    } else {
      setTrialDetails(null)
    }
  }, [trial])

  if (!trial) {
    return <div className="flex items-center justify-center h-full text-gray-400"><span>Select a trial to view details</span></div>
  }
  if (detailsLoading || !trialDetails) {
    return <div className="flex items-center justify-center h-full text-gray-400"><IconLoader2 className="h-6 w-6 animate-spin" /><span className="ml-2">Loading details...</span></div>
  }
  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-6 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0"
          >
            <IconArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900">{trialDetails.brief_title}</h3>
            <p className="text-sm text-gray-600">NCT ID: {trialDetails.external_id}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto flex items-center gap-2"
            onClick={onOpenChat}
          >
            <IconMessage className="h-4 w-4" />
            Chat with AI Bot
          </Button>
        </div>

        {/* Trial Overview Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-6">
            <h4 className="font-semibold text-base text-gray-900 mb-4">Trial Overview</h4>
            
            <div className="space-y-6">
              {/* Official Title */}
              {trialDetails.official_title && trialDetails.official_title !== trialDetails.brief_title && (
                <div>
                  <h5 className="font-medium text-sm text-gray-700 mb-1">Official Title</h5>
                  <p className="text-sm text-gray-900">{trialDetails.official_title}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Status</h5>
                    {getStatusBadge(trialDetails.status)}
                  </div>
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Sponsor</h5>
                    <p className="text-sm text-gray-900">{trialDetails.sponsor_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Study Type</h5>
                    <p className="text-sm text-gray-900">{trialDetails.study_type || 'Not specified'}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Primary Purpose</h5>
                    <p className="text-sm text-gray-900">{trialDetails.primary_purpose || 'Not specified'}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Sex</h5>
                    <p className="text-sm text-gray-900">{trialDetails.sex || 'Not specified'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Phases</h5>
                    <p className="text-sm text-gray-900">{Array.isArray(trialDetails.phases) && trialDetails.phases.length > 0 ? trialDetails.phases.join(', ') : 'Not specified'}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Enrollment</h5>
                    <p className="text-sm text-gray-900">{trialDetails.enrollment_count || 'Not specified'}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Age Range</h5>
                    <p className="text-sm text-gray-900">
                      {trialDetails.minimum_age && trialDetails.maximum_age 
                        ? `${trialDetails.minimum_age} - ${trialDetails.maximum_age}`
                        : 'Not specified'
                      }
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Healthy Volunteers</h5>
                    <p className="text-sm text-gray-900">{trialDetails.healthy_volunteers ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Study Timeline */}
        {(trialDetails.start_date || trialDetails.completion_date || trialDetails.primary_completion_date) && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <h4 className="font-semibold text-base text-gray-900 mb-3">Study Timeline</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trialDetails.start_date && (
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Start Date</h5>
                    <p className="text-sm text-gray-900">{new Date(trialDetails.start_date).toLocaleDateString()}</p>
                  </div>
                )}
                {trialDetails.primary_completion_date && (
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Primary Completion</h5>
                    <p className="text-sm text-gray-900">{new Date(trialDetails.primary_completion_date).toLocaleDateString()}</p>
                  </div>
                )}
                {trialDetails.completion_date && (
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-1">Study Completion</h5>
                    <p className="text-sm text-gray-900">{new Date(trialDetails.completion_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Conditions */}
        {trialDetails.conditions && trialDetails.conditions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <h4 className="font-semibold text-base text-gray-900 mb-3">Conditions</h4>
              <div className="flex flex-wrap gap-2">
                {trialDetails.conditions.map((condition, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Brief Summary */}
        {trialDetails.brief_summary && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <h4 className="font-semibold text-base text-gray-900 mb-3">Brief Summary</h4>
              <div className="prose prose-sm max-w-none text-sm text-gray-700">
                <ReactMarkdown
                  components={{
                    p: ({children}) => <p className="mb-3">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                    li: ({children}) => <li className="text-sm">{children}</li>,
                  }}
                >
                  {showFullSummary 
                    ? unescapeText(trialDetails.brief_summary)
                    : unescapeText(trialDetails.brief_summary.length > 600 
                        ? trialDetails.brief_summary.substring(0, 600) + '...'
                        : trialDetails.brief_summary
                      )
                  }
                </ReactMarkdown>
                {trialDetails.brief_summary.length > 600 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullSummary(!showFullSummary)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
                  >
                    {showFullSummary ? 'Show Less' : 'Show More'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Description */}
        {trialDetails.detailed_description && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <h4 className="font-semibold text-base text-gray-900 mb-3">Detailed Description</h4>
              <div className="prose prose-sm max-w-none text-sm text-gray-700">
                <ReactMarkdown
                  components={{
                    p: ({children}) => <p className="mb-3">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                    li: ({children}) => <li className="text-sm">{children}</li>,
                  }}
                >
                  {showFullDescription 
                    ? unescapeText(trialDetails.detailed_description)
                    : unescapeText(trialDetails.detailed_description.length > 800 
                        ? trialDetails.detailed_description.substring(0, 800) + '...'
                        : trialDetails.detailed_description
                      )
                  }
                </ReactMarkdown>
                {trialDetails.detailed_description.length > 800 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
                  >
                    {showFullDescription ? 'Show Less' : 'Show More'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Eligibility Criteria */}
        {trialDetails.eligibility_criteria && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <h4 className="font-semibold text-base text-gray-900 mb-3">Eligibility Criteria</h4>
              <div className="prose prose-sm max-w-none text-sm text-gray-700">
                <ReactMarkdown
                  components={{
                    p: ({children}) => <p className="mb-3">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                    li: ({children}) => <li className="text-sm">{children}</li>,
                  }}
                >
                  {unescapeText(trialDetails.eligibility_criteria)}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Interventions */}
        {trialDetails.interventions && trialDetails.interventions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <h4 className="font-semibold text-base text-gray-900 mb-3">Interventions</h4>
              <div className="space-y-3">
                {trialDetails.interventions.map((intervention, index) => (
                  <div key={index} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                    <div className="font-medium text-sm text-gray-900">{intervention.name}</div>
                    <div className="text-xs text-gray-600 mt-1">Type: {intervention.type}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Primary Outcomes */}
        {trialDetails.primary_outcomes && trialDetails.primary_outcomes.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <h4 className="font-semibold text-base text-gray-900 mb-3">Primary Outcomes</h4>
              <div className="space-y-3">
                {trialDetails.primary_outcomes.map((outcome, index) => (
                  <div key={index} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                    {outcome.measure && (
                      <div className="font-medium text-sm text-gray-900 mb-1">Measure: {outcome.measure}</div>
                    )}
                    {outcome.description && (
                      <div className="text-sm text-gray-700 mb-1">{outcome.description}</div>
                    )}
                    <div className="flex gap-4 text-xs text-gray-600">
                      {outcome.time_frame && (
                        <span>Time Frame: {outcome.time_frame}</span>
                      )}
                      {outcome.outcome_type && (
                        <span>Type: {outcome.outcome_type}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Secondary Outcomes */}
        {trialDetails.secondary_outcomes && trialDetails.secondary_outcomes.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <h4 className="font-semibold text-base text-gray-900 mb-3">Secondary Outcomes</h4>
              <div className="space-y-3">
                {trialDetails.secondary_outcomes.map((outcome, index) => (
                  <div key={index} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                    {outcome.measure && (
                      <div className="font-medium text-sm text-gray-900 mb-1">Measure: {outcome.measure}</div>
                    )}
                    {outcome.description && (
                      <div className="text-sm text-gray-700 mb-1">{outcome.description}</div>
                    )}
                    <div className="flex gap-4 text-xs text-gray-600">
                      {outcome.time_frame && (
                        <span>Time Frame: {outcome.time_frame}</span>
                      )}
                      {outcome.outcome_type && (
                        <span>Type: {outcome.outcome_type}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Central Contacts */}
        {trialDetails.central_contacts && trialDetails.central_contacts.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <h4 className="font-semibold text-base text-gray-900 mb-3">Contact Information</h4>
              <div className="space-y-3">
                {trialDetails.central_contacts.map((contact, index) => (
                  <div key={index} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                    <div className="font-medium text-sm text-gray-900">{contact.name}</div>
                    {contact.email && (
                      <div className="text-xs text-gray-600 mt-1">Email: {contact.email}</div>
                    )}
                    {contact.phone && (
                      <div className="text-xs text-gray-600">Phone: {contact.phone}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trial Information */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-6">
            <h4 className="font-semibold text-base text-gray-900 mb-3">Trial Information</h4>
            
            {/* Study Locations */}
            {trialDetails.locations && trialDetails.locations.length > 0 && (
              <div className="mb-6">
                <h5 className="font-medium text-sm text-gray-700 mb-2">Study Locations</h5>
                <div className="space-y-2">
                  {trialDetails.locations.map((location, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <IconMapPin className="h-4 w-4 text-gray-500" />
                      <span>{location}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Study Officials */}
            {trialDetails.overall_officials && trialDetails.overall_officials.length > 0 && (
              <div className="mb-6">
                <h5 className="font-medium text-sm text-gray-700 mb-2">Study Officials</h5>
                <div className="space-y-2">
                  {trialDetails.overall_officials.map((official, index) => (
                    <div key={index} className="p-3 border border-gray-100 rounded-lg bg-gray-50">
                      <div className="font-medium text-sm text-gray-900">{official.name}</div>
                      {official.email && (
                        <div className="text-xs text-gray-600 mt-1">Email: {official.email}</div>
                      )}
                      {official.phone && (
                        <div className="text-xs text-gray-600">Phone: {official.phone}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-sm text-gray-700 mb-1">Source Registry</h5>
                <p className="text-sm text-gray-900">{trialDetails.source_registry || 'Not specified'}</p>
              </div>
              <div>
                <h5 className="font-medium text-sm text-gray-700 mb-1">Registry Version</h5>
                <p className="text-sm text-gray-900">{trialDetails.registry_version || 'Not specified'}</p>
              </div>
              {trialDetails.last_updated && (
                <div className="md:col-span-2">
                  <h5 className="font-medium text-sm text-gray-700 mb-1">Last Updated</h5>
                  <p className="text-sm text-gray-900">{new Date(trialDetails.last_updated).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Drawer */}
        {/* Remove Drawer from here */}
      </div>
    </div>
  )
}

export default function AppointmentRecommendedTrialsPage() {
  const router = useRouter()
  const params = useParams() as { patientId: string; appointmentid: string }
  const { patientId, appointmentid } = params

  const [recommendations, setRecommendations] = useState<TranscriptRecommendations | null>(null)
  const [eligibleTrials, setEligibleTrials] = useState<ClinicalTrial[]>([])
  const [uncertainTrials, setUncertainTrials] = useState<ClinicalTrial[]>([])
  const [selectedTrial, setSelectedTrial] = useState<ClinicalTrial | null>(null)
  const [loading, setLoading] = useState(false)
  const [appointmentData, setAppointmentData] = useState<any>(null)
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set())
  const [savedTrials, setSavedTrials] = useState<Set<string>>(new Set())
  const [savingTrial, setSavingTrial] = useState<string | null>(null)
  const [recommendedTrials, setRecommendedTrials] = useState<Set<string>>(new Set())
  const [chatPanelOpen, setChatPanelOpen] = useState(false)
  const { setOpen, isMobile } = useSidebar();

  // Collapse sidebar when chat opens, expand when closes (desktop only)
  useEffect(() => {
    if (!isMobile) {
      if (chatPanelOpen) {
        setOpen(false)
      } else {
        setOpen(true)
      }
    }
  }, [chatPanelOpen, isMobile, setOpen])

  // Fetch all data on mount/appointment change
  useEffect(() => {
    if (appointmentid) {
      fetchAll()
    }
  }, [appointmentid])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch appointment data first to get the date
      const appointment = await apiClient.getAppointmentById(appointmentid)
      setAppointmentData(appointment)
      
      const recs = await apiClient.getTranscriptRecommendations(appointmentid)
      setRecommendations(recs)
      if (recs?.eligible_trials?.length) {
        const eligible = await apiClient.getClinicalTrialsByIds(recs.eligible_trials)
        setEligibleTrials(eligible)
      } else {
        setEligibleTrials([])
      }
      if (recs?.uncertain_trials?.length) {
        const uncertain = await apiClient.getClinicalTrialsByIds(recs.uncertain_trials)
        setUncertainTrials(uncertain)
      } else {
        setUncertainTrials([])
      }
      // Patient name for header
      const patientInfo = await apiClient.getPatientNameByTranscript(appointmentid)
      // Saved trials
      if (patientInfo?.patientId) {
        const savedTrialIds = await apiClient.getSavedTrials(patientInfo.patientId)
        setSavedTrials(new Set(savedTrialIds))
        const recommendedTrialIds = await apiClient.getRecommendedTrials(patientInfo.patientId)
        setRecommendedTrials(recommendedTrialIds)
      }
    } finally {
      setLoading(false)
    }
  }, [appointmentid])

  // Only fetch details when a trial is selected
  const handleSelectTrial = async (trial: ClinicalTrial) => {
    setSelectedTrial(trial)
  }

  // Save/unsave trial
  const handleSaveTrial = async (trialId: string) => {
    setSavingTrial(trialId)
    try {
      if (savedTrials.has(trialId)) {
        await apiClient.removeSavedTrial(patientId, trialId)
        setSavedTrials(prev => {
          const newSet = new Set(prev)
          newSet.delete(trialId)
          return newSet
        })
      } else {
        await apiClient.saveTrial(patientId, trialId)
        setSavedTrials(prev => new Set([...prev, trialId]))
      }
    } finally {
      setSavingTrial(null)
    }
  }

  // Format appointment date
  const formatAppointmentDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown Date'
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // UI helpers
  // List card
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECRUITING':
        return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Recruiting</Badge>
      case 'COMPLETED':
        return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Completed</Badge>
      case 'SUSPENDED':
        return <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Suspended</Badge>
      case 'TERMINATED':
        return <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">Terminated</Badge>
      default:
        return <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">{status}</Badge>
    }
  }

  // Summary grid
  const totalTrials = eligibleTrials.length + uncertainTrials.length

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Master list */}
      <div className="w-full md:w-1/3 border-r bg-white overflow-y-auto p-6 pl-0">
        {/* <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 pl-2 mb-6 border border-blue-100 shadow-sm"> */}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Recommended Trials</h2>
              {appointmentData && (
                <p className="text-sm text-gray-600 font-medium">
                  from your appointment on {formatAppointmentDate(appointmentData.created_at)}
                </p>
              )}
            </div>
          </div>
        {/* </div> */}
        <Separator className="my-4" />
        {loading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : totalTrials === 0 ? (
          <div className="text-center py-8">
            <IconFlask className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Clinical Trial Recommendations</h3>
            <p className="text-gray-600">
              No clinical trials have been recommended for this appointment yet. 
              Recommendations are generated automatically when transcripts are processed.
            </p>
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={[]} className="w-full">
            <AccordionItem value="eligible">
              <AccordionTrigger className="text-base font-semibold text-green-600">Eligible Trials ({eligibleTrials.length})</AccordionTrigger>
              <AccordionContent className="space-y-4 px-2 pt-2">
                {eligibleTrials.length === 0 ? (
                  <div className="text-gray-500 text-sm p-4">No eligible trials found.</div>
                ) : (
                  eligibleTrials.map((trial, idx) => {
                    const isRecommended = recommendedTrials.has(trial.id)
                    const isSaved = savedTrials.has(trial.id)
                    const displaySummary = trial.brief_summary
                      ? trial.brief_summary.length > 150
                        ? trial.brief_summary.substring(0, 150) + '...'
                        : trial.brief_summary
                      : ''
                    return (
                      <div
                        key={trial.id}
                        className={`relative border rounded-lg p-3 w-full space-y-3 cursor-pointer hover:shadow-md transition ${selectedTrial?.id === trial.id ? 'ring-2 ring-blue-400' : ''}`}
                        onClick={() => handleSelectTrial(trial)}
                      >
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
                            <span className="text-sm font-medium">#{idx + 1}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {getStatusBadge(trial.status || 'RECRUITING')}
                          {trial.locations && trial.locations.length > 0 && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <IconMapPin className="h-3 w-3" />
                              <span>{trial.locations[0]}</span>
                              {trial.locations.length > 1 && (
                                <span className="text-gray-500">+{trial.locations.length - 1} more</span>
                              )}
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
                          <div className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                            {displaySummary}
                          </div>
                        )}
                        <div className="flex items-center justify-end pt-0 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-6 text-xs ${isSaved ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
                            onClick={e => { e.stopPropagation(); handleSaveTrial(trial.id); }}
                            disabled={savingTrial === trial.id}
                          >
                            {savingTrial === trial.id ? (
                              <IconLoader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <IconBookmark className={`mr-1 h-3 w-3 ${isSaved ? 'fill-current' : ''}`} />
                            )}
                            {isSaved ? 'Saved' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="uncertain">
              <AccordionTrigger className="text-base font-semibold text-yellow-600">Uncertain Trials ({uncertainTrials.length})</AccordionTrigger>
              <AccordionContent className="space-y-4 px-2 pt-2">
                {uncertainTrials.length === 0 ? (
                  <div className="text-gray-500 text-sm p-4">No uncertain trials found.</div>
                ) : (
                  uncertainTrials.map((trial, idx) => {
                    const isRecommended = recommendedTrials.has(trial.id)
                    const isSaved = savedTrials.has(trial.id)
                    const displaySummary = trial.brief_summary
                      ? trial.brief_summary.length > 150
                        ? trial.brief_summary.substring(0, 150) + '...'
                        : trial.brief_summary
                      : ''
                    return (
                      <div
                        key={trial.id}
                        className={`relative border rounded-lg p-3 w-full space-y-3 cursor-pointer hover:shadow-md transition ${selectedTrial?.id === trial.id ? 'ring-2 ring-blue-400' : ''}`}
                        onClick={() => handleSelectTrial(trial)}
                      >
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
                            <span className="text-sm font-medium">#{idx + eligibleTrials.length + 1}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {getStatusBadge(trial.status || 'RECRUITING')}
                          {trial.locations && trial.locations.length > 0 && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <IconMapPin className="h-3 w-3" />
                              <span>{trial.locations[0]}</span>
                              {trial.locations.length > 1 && (
                                <span className="text-gray-500">+{trial.locations.length - 1} more</span>
                              )}
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
                          <div className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                            {displaySummary}
                          </div>
                        )}
                        <div className="flex items-center justify-end pt-0 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-6 text-xs ${isSaved ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
                            onClick={e => { e.stopPropagation(); handleSaveTrial(trial.id); }}
                            disabled={savingTrial === trial.id}
                          >
                            {savingTrial === trial.id ? (
                              <IconLoader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <IconBookmark className={`mr-1 h-3 w-3 ${isSaved ? 'fill-current' : ''}`} />
                            )}
                            {isSaved ? 'Saved' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
      {/* Detail panel */}
      <div className={`bg-gray-50 overflow-hidden relative transition-all duration-300 ${chatPanelOpen ? 'flex-1 max-w-2xl' : 'flex-1'}`}>
        <TrialDetailsPanel 
          trial={selectedTrial} 
          onBack={() => setSelectedTrial(null)} 
          getStatusBadge={getStatusBadge} 
          onOpenChat={() => setChatPanelOpen(true)}
        />
      </div>
      {/* Chat panel (only when open) */}
      <TrialChatPanel 
        open={chatPanelOpen} 
        onClose={() => setChatPanelOpen(false)} 
        patientId={patientId} 
        trial={selectedTrial} 
      />
    </div>
  )
} 