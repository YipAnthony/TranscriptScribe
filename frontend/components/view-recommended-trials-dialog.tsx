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
import { Textarea } from "@/components/ui/textarea"
import { IconLoader2, IconFlask, IconStar, IconMapPin, IconCalendar, IconExternalLink, IconUser, IconArrowLeft, IconBookmark, IconMessagePlus } from "@tabler/icons-react"
import { createClient } from "@/lib/supabase/client"
import { apiClient } from "@/lib/api-client"
import ReactMarkdown from 'react-markdown'
import type { ClinicalTrial, ClinicalTrialDetails, TranscriptRecommendations } from "@/types"

interface ViewRecommendedTrialsDialogProps {
    appointmentId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
    patientId?: string
    isPatientView?: boolean
}

function unescapeText(text: string): string {
  if (!text) return text;
  
  // Unescape common LaTeX/HTML entities
  return text
    .replace(/\\>/g, '>')  // Unescape greater than
    .replace(/\\</g, '<')  // Unescape less than
    .replace(/\\&/g, '&')  // Unescape ampersand
    .replace(/\\"/g, '"')  // Unescape quotes
    .replace(/\\'/g, "'")  // Unescape single quotes
    .replace(/\\\\/g, '\\'); // Unescape backslashes
}

export function ViewRecommendedTrialsDialog({ 
  appointmentId, 
  open, 
  onOpenChange,
  patientId,
  isPatientView = false
}: ViewRecommendedTrialsDialogProps) {
  const [recommendations, setRecommendations] = useState<TranscriptRecommendations | null>(null)
  const [eligibleTrials, setEligibleTrials] = useState<ClinicalTrial[]>([])
  const [uncertainTrials, setUncertainTrials] = useState<ClinicalTrial[]>([])
  const [loading, setLoading] = useState(false)
  const [patientName, setPatientName] = useState<string>("")
  const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set())
  const [savedTrials, setSavedTrials] = useState<Set<string>>(new Set())
  const [savingTrial, setSavingTrial] = useState<string | null>(null)
  const [recommendedTrials, setRecommendedTrials] = useState<Set<string>>(new Set())
  const [resolvedPatientId, setResolvedPatientId] = useState<string | undefined>(patientId)
  
  // New state for trial details view
  const [selectedTrialDetails, setSelectedTrialDetails] = useState<ClinicalTrialDetails | null>(null)
  const [loadingTrialDetails, setLoadingTrialDetails] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'suggest'>('list')
  const [showAllLocations, setShowAllLocations] = useState(false)
  const [showFullSummary, setShowFullSummary] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [preservedAccordionValue, setPreservedAccordionValue] = useState<string>('')
  const [scrollPosition, setScrollPosition] = useState(0)
  const [suggestingTrial, setSuggestingTrial] = useState<string | null>(null)
  const [selectedTrialForSuggestion, setSelectedTrialForSuggestion] = useState<ClinicalTrial | null>(null)
  const [suggestionNotes, setSuggestionNotes] = useState("")
  
  const supabase = createClient()

  useEffect(() => {
    if (open && appointmentId) {
      fetchRecommendations()
      if (isPatientView && resolvedPatientId) {
        fetchSavedTrials()
      }
      if (resolvedPatientId) {
        fetchRecommendedTrials()
      }
      // Reset preserved state when opening fresh
      if (viewMode === 'list') {
        setPreservedAccordionValue('')
        setScrollPosition(0)
      }
    }
  }, [open, appointmentId, isPatientView, resolvedPatientId])

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

      // Fetch patient name and ID
      const { data: transcriptData, error: transcriptError } = await supabase
        .from('transcripts')
        .select(`
          patient_id,
          patients:patient_id(first_name, last_name)
        `)
        .eq('id', appointmentId)
        .single()

      if (!transcriptError && transcriptData) {
        // Set patient ID if not already provided
        if (!patientId && transcriptData.patient_id) {
          setResolvedPatientId(transcriptData.patient_id)
        }
        
        // Set patient name
        if (transcriptData.patients && Array.isArray(transcriptData.patients) && transcriptData.patients.length > 0) {
          const patient = transcriptData.patients[0] as { first_name: string; last_name: string }
          if (patient.first_name && patient.last_name) {
            setPatientName(`${patient.first_name} ${patient.last_name}`)
          }
        }
      }

    } catch (err) {
      console.error('Error fetching recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedTrials = async () => {
    if (!resolvedPatientId) return

    try {
      const { data, error } = await supabase
        .from('patient_saved_trials')
        .select('clinical_trial_id')
        .eq('patient_id', resolvedPatientId)

      if (error) {
        console.error('Error fetching saved trials:', error)
      } else {
        const savedTrialIds = new Set(data?.map(item => item.clinical_trial_id) || [])
        setSavedTrials(savedTrialIds)
      }
    } catch (err) {
      console.error('Error fetching saved trials:', err)
    }
  }

  const fetchRecommendedTrials = async () => {
    if (!resolvedPatientId) return

    try {
      const { data, error } = await supabase
        .from('provider_recommended_trials')
        .select('clinical_trial_id')
        .eq('patient_id', resolvedPatientId)
        .in('status', ['pending', 'accepted'])

      if (error) {
        console.error('Error fetching recommended trials:', error)
      } else {
        const recommendedTrialIds = new Set(data?.map(item => item.clinical_trial_id) || [])
        setRecommendedTrials(recommendedTrialIds)
      }
    } catch (err) {
      console.error('Error fetching recommended trials:', err)
    }
  }

  const handleSaveTrial = async (trialId: string) => {
    if (!resolvedPatientId) return

    console.log('handleSaveTrial called with trialId:', trialId, 'type:', typeof trialId)
    setSavingTrial(trialId)
    try {
      if (savedTrials.has(trialId)) {
        // Remove from saved trials
        const { error } = await supabase
          .from('patient_saved_trials')
          .delete()
          .eq('patient_id', resolvedPatientId)
          .eq('clinical_trial_id', trialId)

        if (error) {
          console.error('Error removing saved trial:', error)
        } else {
          setSavedTrials(prev => {
            const newSet = new Set(prev)
            newSet.delete(trialId)
            return newSet
          })
        }
      } else {
        // Add to saved trials
        const { error } = await supabase
          .from('patient_saved_trials')
          .insert({
            patient_id: resolvedPatientId,
            clinical_trial_id: trialId,
            created_at: new Date().toISOString()
          })

        if (error) {
          console.error('Error saving trial:', error)
        } else {
          setSavedTrials(prev => new Set([...prev, trialId]))
        }
      }
    } catch (err) {
      console.error('Error toggling saved trial:', err)
    } finally {
      setSavingTrial(null)
    }
  }

  const fetchTrialDetails = async (trialId: string) => {
    try {
      // Add trial ID to loading set
      setLoadingTrialDetails(prev => new Set(prev).add(trialId))
      
      // Capture current accordion state and scroll position
      const accordionElement = document.querySelector('[data-radix-accordion-item]')
      if (accordionElement) {
        const activeItem = accordionElement.querySelector('[data-state="open"]')
        if (activeItem) {
          const value = activeItem.getAttribute('data-value')
          if (value) setPreservedAccordionValue(value)
        }
      }
      
      // Capture scroll position
      const dialogContent = document.querySelector('[role="dialog"]')
      if (dialogContent) {
        setScrollPosition(dialogContent.scrollTop)
      }
      
      const response = await apiClient.getClinicalTrial(trialId)
      
      if (response.error) {
        console.error('Error fetching trial details:', response.error)
        return
      }
      
      if (response.data?.trial) {
        setSelectedTrialDetails(response.data.trial)
        setViewMode('details')
        setShowAllLocations(false)
        setShowFullSummary(false)
        setShowFullDescription(false)
        
        // Scroll details view to top after a brief delay to ensure DOM is ready
        setTimeout(() => {
          const dialogContent = document.querySelector('[role="dialog"]')
          if (dialogContent) {
            dialogContent.scrollTop = 0
          }
        }, 100)
      }
    } catch (err) {
      console.error('Error fetching trial details:', err)
    } finally {
      // Remove trial ID from loading set
      setLoadingTrialDetails(prev => {
        const newSet = new Set(prev)
        newSet.delete(trialId)
        return newSet
      })
    }
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedTrialDetails(null)
    setShowAllLocations(false)
    
    // Restore scroll position and accordion state after a brief delay to ensure DOM is ready
    setTimeout(() => {
      const dialogContent = document.querySelector('[role="dialog"]')
      if (dialogContent && scrollPosition > 0) {
        dialogContent.scrollTop = scrollPosition
      }
    }, 100)
  }

  const handleSuggestTrial = async (trial: ClinicalTrial) => {
    if (!resolvedPatientId) {
      alert('Patient ID is required to suggest a trial')
      return
    }

    setSuggestingTrial(trial.id)
    try {
      const { error } = await supabase
        .from('provider_recommended_trials')
        .insert({
          patient_id: resolvedPatientId,
          clinical_trial_id: trial.id,
          notes: `Recommended from appointment ${appointmentId} - ${trial.brief_title}`
        })

      if (error) {
        console.error('Error suggesting trial:', error)
        alert('Failed to suggest trial. Please try again.')
      } else {
        // Refresh recommended trials list
        await fetchRecommendedTrials()
        alert('Trial suggested successfully!')
      }
    } catch (err) {
      console.error('Error suggesting trial:', err)
      alert('Failed to suggest trial. Please try again.')
    } finally {
      setSuggestingTrial(null)
    }
  }

  const openSuggestTrialView = (trial: ClinicalTrial) => {
    setSelectedTrialForSuggestion(trial)
    setSuggestionNotes("")
    setViewMode('suggest')
  }

  const handleBackToDetails = () => {
    setViewMode('details')
    setSelectedTrialForSuggestion(null)
    setSuggestionNotes("")
  }

  const handleSuggestTrialSubmit = async () => {
    if (!resolvedPatientId || !selectedTrialForSuggestion) {
      alert('Patient ID and trial are required to suggest a trial')
      return
    }

    setSuggestingTrial(selectedTrialForSuggestion.id)
    try {
      // First, we need to get the actual clinical_trial_id from our database
      // since we're using external_id as the ID in the suggest view
      let clinicalTrialId = selectedTrialForSuggestion.id
      
      // If we're using external_id as the ID, we need to find the actual database ID
      if (selectedTrialForSuggestion.id === selectedTrialForSuggestion.external_id) {
        const trial = [...eligibleTrials, ...uncertainTrials].find(t => t.external_id === selectedTrialForSuggestion.external_id)
        if (trial) {
          clinicalTrialId = trial.id
        } else {
          // If we can't find the trial in our local arrays, we need to fetch it from the database
          const { data: trialData, error: trialError } = await supabase
            .from('clinical_trials')
            .select('id')
            .eq('external_id', selectedTrialForSuggestion.external_id)
            .single()
          
          if (trialError || !trialData) {
            console.error('Error finding clinical trial:', trialError)
            alert('Failed to find clinical trial. Please try again.')
            return
          }
          clinicalTrialId = trialData.id
        }
      }

      const { error } = await supabase
        .from('provider_recommended_trials')
        .insert({
          patient_id: resolvedPatientId,
          clinical_trial_id: clinicalTrialId,
          notes: suggestionNotes.trim() || null
        })

      if (error) {
        console.error('Error suggesting trial:', error)
        alert('Failed to suggest trial. Please try again.')
      } else {
        // Refresh recommended trials list
        await fetchRecommendedTrials()
        // Reset form and go back to details
        setSuggestionNotes("")
        setSelectedTrialForSuggestion(null)
        setViewMode('details')
        alert('Trial suggested successfully!')
      }
    } catch (err) {
      console.error('Error suggesting trial:', err)
      alert('Failed to suggest trial. Please try again.')
    } finally {
      setSuggestingTrial(null)
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
    const isSaved = savedTrials.has(trial.id)
    const isRecommended = recommendedTrials.has(trial.id)
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
        
        <div className="flex items-center justify-end pt-2 gap-2">
          {isRecommended && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              <IconStar className="h-3 w-3 mr-1" />
              Already Recommended to Patient
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-6 text-xs"
            onClick={() => fetchTrialDetails(trial.external_id)}
            disabled={loadingTrialDetails.has(trial.external_id)}
          >
            {loadingTrialDetails.has(trial.external_id) ? (
              <IconLoader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <IconExternalLink className="mr-1 h-3 w-3" />
            )}
            View Details
          </Button>
          
            {isPatientView && (
              <Button
                variant="outline"
                size="sm"
                className={`h-6 text-xs ${isSaved ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
                onClick={() => {
                  console.log('Save button clicked for trial:', trial)
                  handleSaveTrial(trial.id)
                }}
                disabled={savingTrial === trial.id}
              >
                {savingTrial === trial.id ? (
                  <IconLoader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <IconBookmark className={`mr-1 h-3 w-3 ${isSaved ? 'fill-current' : ''}`} />
                )}
                {isSaved ? 'Saved' : 'Save'}
              </Button>
            )}
            
            {/* Suggest Trial button - only show in admin view */}
            {!isPatientView && patientId && (
              <Button
                variant="outline"
                size="sm"
                className={`h-6 text-xs ${isRecommended ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
                onClick={() => openSuggestTrialView(trial)}
                disabled={suggestingTrial === trial.id || isRecommended}
              >
                {suggestingTrial === trial.id ? (
                  <IconLoader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <IconMessagePlus className="mr-1 h-3 w-3" />
                )}
                {isRecommended ? 'Already Recommended to Patient' : 'Suggest Trial'}
              </Button>
            )}
        </div>
      </div>
    )
  }

  const renderTrialDetails = () => {
    if (!selectedTrialDetails) return null
    
    console.log('Rendering trial details - isPatientView:', isPatientView, 'patientId:', patientId, 'selectedTrialDetails:', selectedTrialDetails)

    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="h-8 w-8 p-0"
          >
            <IconArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="font-semibold text-lg">{selectedTrialDetails.brief_title}</h3>
            <p className="text-sm text-gray-600">NCT ID: {selectedTrialDetails.external_id}</p>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Status</h4>
            {getStatusBadge(selectedTrialDetails.status)}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Sponsor</h4>
            <p className="text-sm">{selectedTrialDetails.sponsor_name || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Study Type</h4>
            <p className="text-sm">{selectedTrialDetails.study_type || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Phases</h4>
            <p className="text-sm">{selectedTrialDetails.phases.length > 0 ? selectedTrialDetails.phases.join(', ') : 'Not specified'}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Enrollment</h4>
            <p className="text-sm">{selectedTrialDetails.enrollment_count || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Age Range</h4>
            <p className="text-sm">
              {selectedTrialDetails.minimum_age && selectedTrialDetails.maximum_age 
                ? `${selectedTrialDetails.minimum_age} - ${selectedTrialDetails.maximum_age}`
                : 'Not specified'
              }
            </p>
          </div>
        </div>

        {/* Conditions */}
        {selectedTrialDetails.conditions && selectedTrialDetails.conditions.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Conditions</h4>
            <div className="flex flex-wrap gap-2">
              {selectedTrialDetails.conditions.map((condition, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {condition}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Brief Summary */}
        {selectedTrialDetails.brief_summary && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Brief Summary</h4>
            <div className="prose prose-sm max-w-none text-sm text-gray-600">
              <ReactMarkdown
                components={{
                  p: ({children}) => <p className="mb-2">{children}</p>,
                  ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  li: ({children}) => <li className="text-sm">{children}</li>,
                }}
              >
                {showFullSummary 
                  ? unescapeText(selectedTrialDetails.brief_summary)
                  : unescapeText(selectedTrialDetails.brief_summary.length > 600 
                      ? selectedTrialDetails.brief_summary.substring(0, 600) + '...'
                      : selectedTrialDetails.brief_summary
                    )
                }
              </ReactMarkdown>
              {selectedTrialDetails.brief_summary.length > 600 && (
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
        )}

        {/* Detailed Description */}
        {selectedTrialDetails.detailed_description && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Detailed Description</h4>
            <div className="prose prose-sm max-w-none text-sm text-gray-600">
              <ReactMarkdown
                components={{
                  p: ({children}) => <p className="mb-2">{children}</p>,
                  ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  li: ({children}) => <li className="text-sm">{children}</li>,
                }}
              >
                {showFullDescription 
                  ? unescapeText(selectedTrialDetails.detailed_description)
                  : unescapeText(selectedTrialDetails.detailed_description.length > 800 
                      ? selectedTrialDetails.detailed_description.substring(0, 800) + '...'
                      : selectedTrialDetails.detailed_description
                    )
                }
              </ReactMarkdown>
              {selectedTrialDetails.detailed_description.length > 800 && (
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
        )}

        {/* Eligibility Criteria */}
        {selectedTrialDetails.eligibility_criteria && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Eligibility Criteria</h4>
            <div className="prose prose-sm max-w-none text-sm text-gray-600">
              <ReactMarkdown
                components={{
                  p: ({children}) => <p className="mb-2">{children}</p>,
                  ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  li: ({children}) => <li className="text-sm">{children}</li>,
                }}
              >
                {unescapeText(selectedTrialDetails.eligibility_criteria)}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Interventions */}
        {selectedTrialDetails.interventions && selectedTrialDetails.interventions.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Interventions</h4>
            <div className="space-y-2">
              {selectedTrialDetails.interventions.map((intervention, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="font-medium text-sm">{intervention.name}</div>
                  <div className="text-xs text-gray-600">Type: {intervention.type}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outcomes */}
        {(selectedTrialDetails.primary_outcomes.length > 0 || selectedTrialDetails.secondary_outcomes.length > 0) && (
          <Accordion type="single" collapsible className="w-full">
            {selectedTrialDetails.primary_outcomes.length > 0 && (
              <AccordionItem value="primary-outcomes">
                <AccordionTrigger className="font-semibold text-sm">
                  Primary Outcomes ({selectedTrialDetails.primary_outcomes.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {selectedTrialDetails.primary_outcomes.map((outcome, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="font-medium text-sm">{outcome.measure}</div>
                        <div className="text-xs text-gray-600 mt-1">{outcome.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Time Frame: {outcome.time_frame} | Type: {outcome.outcome_type}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {selectedTrialDetails.secondary_outcomes.length > 0 && (
              <AccordionItem value="secondary-outcomes">
                <AccordionTrigger className="font-semibold text-sm">
                  Secondary Outcomes ({selectedTrialDetails.secondary_outcomes.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {selectedTrialDetails.secondary_outcomes.map((outcome, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="font-medium text-sm">{outcome.measure}</div>
                        <div className="text-xs text-gray-600 mt-1">{outcome.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Time Frame: {outcome.time_frame} | Type: {outcome.outcome_type}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}

        {/* Locations */}
        {selectedTrialDetails.locations && selectedTrialDetails.locations.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">
              Locations ({selectedTrialDetails.locations.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(showAllLocations 
                ? selectedTrialDetails.locations 
                : selectedTrialDetails.locations.slice(0, 6)
              ).map((location, index) => (
                <div key={index} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-md">
                  <IconMapPin className="h-3 w-3 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              ))}
            </div>
            {selectedTrialDetails.locations.length > 6 && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllLocations(!showAllLocations)}
                  className="text-xs"
                >
                  {showAllLocations ? 'Show Less' : `Show ${selectedTrialDetails.locations.length - 6} More Locations`}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Contacts */}
        {(selectedTrialDetails.central_contacts.length > 0 || selectedTrialDetails.overall_officials.length > 0) && (
          <Accordion type="single" collapsible className="w-full">
            {selectedTrialDetails.central_contacts.length > 0 && (
              <AccordionItem value="central-contacts">
                <AccordionTrigger className="font-semibold text-sm">
                  Central Contacts ({selectedTrialDetails.central_contacts.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {selectedTrialDetails.central_contacts.map((contact, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="font-medium text-sm">{contact.name}</div>
                        {contact.email && <div className="text-xs text-gray-600">Email: {contact.email}</div>}
                        {contact.phone && <div className="text-xs text-gray-600">Phone: {contact.phone}</div>}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
            
            {selectedTrialDetails.overall_officials.length > 0 && (
              <AccordionItem value="overall-officials">
                <AccordionTrigger className="font-semibold text-sm">
                  Overall Officials ({selectedTrialDetails.overall_officials.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {selectedTrialDetails.overall_officials.map((contact, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="font-medium text-sm">{contact.name}</div>
                        {contact.email && <div className="text-xs text-gray-600">Email: {contact.email}</div>}
                        {contact.phone && <div className="text-xs text-gray-600">Phone: {contact.phone}</div>}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Start Date</h4>
            <p className="text-sm">{formatDate(selectedTrialDetails.start_date || null)}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Completion Date</h4>
            <p className="text-sm">{formatDate(selectedTrialDetails.completion_date || null)}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Primary Completion</h4>
            <p className="text-sm">{formatDate(selectedTrialDetails.primary_completion_date || null)}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Last Updated</h4>
            <p className="text-sm">{formatDate(selectedTrialDetails.last_updated || null)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleBackToList}
          >
            Back to List
          </Button>
          
                    {/* Recommend Trial button - only show in admin view */}
          {(() => {
            console.log('Button condition check - isPatientView:', isPatientView, 'resolvedPatientId:', resolvedPatientId, 'condition result:', !isPatientView && resolvedPatientId)
            return !isPatientView && resolvedPatientId
          })() && (() => {
            const trial = [...eligibleTrials, ...uncertainTrials].find(t => t.external_id === selectedTrialDetails.external_id)
            const isRecommended = trial ? recommendedTrials.has(trial.id) : false
            const isSuggesting = suggestingTrial === selectedTrialDetails.external_id
            
            return (
              <Button
                onClick={() => {
                  // Create a trial object from the details for the suggest view
                  const trialForSuggestion: ClinicalTrial = {
                    id: selectedTrialDetails.external_id, // Use external_id as the ID for API calls
                    external_id: selectedTrialDetails.external_id,
                    brief_title: selectedTrialDetails.brief_title,
                    status: selectedTrialDetails.status,
                    conditions: selectedTrialDetails.conditions,
                    brief_summary: selectedTrialDetails.brief_summary || '',
                    locations: selectedTrialDetails.locations,
                    created_at: selectedTrialDetails.last_updated || new Date().toISOString()
                  }
                  openSuggestTrialView(trialForSuggestion)
                }}
                disabled={isSuggesting || isRecommended}
                className={isRecommended ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : ''}
              >
                {isSuggesting ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Suggesting...
                  </>
                ) : (
                  <>
                    <IconMessagePlus className="mr-2 h-4 w-4" />
                    {isRecommended ? 'Already Recommended to Patient' : 'Recommend Trial'}
                  </>
                )}
              </Button>
            )
          })()}
          
          {/* Save Trial button - only show in patient view */}
          {isPatientView && resolvedPatientId && (() => {
            const trial = [...eligibleTrials, ...uncertainTrials].find(t => t.external_id === selectedTrialDetails.external_id)
            const isSaved = trial ? savedTrials.has(trial.id) : false
            const isSaving = savingTrial === trial?.id
            
            return (
              <Button
                variant="outline"
                onClick={() => {
                  if (trial) {
                    handleSaveTrial(trial.id)
                  }
                }}
                disabled={isSaving}
                className={isSaved ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' : ''}
              >
                {isSaving ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <IconBookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                    {isSaved ? 'Saved' : 'Save'}
                  </>
                )}
              </Button>
            )
          })()}
        </div>
      </div>
    )
  }

  const renderSuggestTrialView = () => {
    if (!selectedTrialForSuggestion) return null

    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToDetails}
            className="h-8 w-8 p-0"
          >
            <IconArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="font-semibold text-lg">Suggest Trial to {patientName}</h3>
            <p className="text-sm text-gray-600">NCT ID: {selectedTrialForSuggestion.external_id}</p>
          </div>
        </div>

        {/* Trial Preview */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-semibold text-sm mb-3">Clinical Trial Preview</h4>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h5 className="font-medium text-sm">{selectedTrialForSuggestion.brief_title}</h5>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                  <IconFlask className="h-3 w-3" />
                  <span>NCT ID: {selectedTrialForSuggestion.external_id}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedTrialForSuggestion.status || 'RECRUITING')}
              </div>
            </div>
            
            {selectedTrialForSuggestion.conditions && selectedTrialForSuggestion.conditions.length > 0 && (
              <div className="text-xs">
                <span className="font-medium text-gray-700">Conditions: </span>
                <span className="text-gray-600">{selectedTrialForSuggestion.conditions.slice(0, 3).join(', ')}</span>
                {selectedTrialForSuggestion.conditions.length > 3 && <span className="text-gray-500"> +{selectedTrialForSuggestion.conditions.length - 3} more</span>}
              </div>
            )}
            
            {selectedTrialForSuggestion.brief_summary && (
              <div className="text-xs text-gray-600">
                {selectedTrialForSuggestion.brief_summary.length > 150 
                  ? selectedTrialForSuggestion.brief_summary.substring(0, 150) + '...'
                  : selectedTrialForSuggestion.brief_summary
                }
              </div>
            )}
            
            {selectedTrialForSuggestion.locations && selectedTrialForSuggestion.locations.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <IconMapPin className="h-3 w-3" />
                <span>{selectedTrialForSuggestion.locations[0]}</span>
                {selectedTrialForSuggestion.locations.length > 1 && (
                  <span className="text-gray-500"> +{selectedTrialForSuggestion.locations.length - 1} more</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Comment to Patient (Optional)
          </label>
          <Textarea
            placeholder="Explain why this trial might be suitable for the patient..."
            value={suggestionNotes}
            onChange={(e) => setSuggestionNotes(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            This note will be visible to the patient when they view their recommended trials.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleBackToDetails}
            disabled={suggestingTrial === selectedTrialForSuggestion.id}
          >
            Back to Details
          </Button>
          <Button 
            onClick={handleSuggestTrialSubmit}
            disabled={suggestingTrial === selectedTrialForSuggestion.id}
          >
            {suggestingTrial === selectedTrialForSuggestion.id ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Suggesting...
              </>
            ) : (
              <>
                <IconMessagePlus className="mr-2 h-4 w-4" />
                Recommend Trial
              </>
            )}
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

  // Show trial details view if a trial is selected
  if (viewMode === 'details' && selectedTrialDetails) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconFlask className="h-5 w-5" />
              Clinical Trial Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about the selected clinical trial.
            </DialogDescription>
          </DialogHeader>
          {renderTrialDetails()}
        </DialogContent>
      </Dialog>
    )
  }

  // Show suggest trial view if in suggest mode
  if (viewMode === 'suggest' && selectedTrialForSuggestion) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconFlask className="h-5 w-5" />
              Suggest Clinical Trial
            </DialogTitle>
            <DialogDescription>
              Recommend this clinical trial to the patient.
            </DialogDescription>
          </DialogHeader>
          {renderSuggestTrialView()}
        </DialogContent>
      </Dialog>
    )
  }

  // Show list view
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
            <Accordion 
              type="single" 
              collapsible 
              className="w-full"
              value={preservedAccordionValue}
              onValueChange={setPreservedAccordionValue}
            >
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