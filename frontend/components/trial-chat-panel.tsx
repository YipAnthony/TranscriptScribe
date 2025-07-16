import React from "react"
import { Button } from "@/components/ui/button"
import { IconX } from "@tabler/icons-react"
import type { ClinicalTrial } from "@/types"

interface TrialChatPanelProps {
  open: boolean
  onClose: () => void
  patientId: string
  trial: ClinicalTrial | null
}

export const TrialChatPanel: React.FC<TrialChatPanelProps> = ({ open, onClose, patientId, trial }) => {
  if (!open) return null
  return (
    <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h4 className="font-semibold text-lg">Chat with AI Bot</h4>
          {trial && <div className="text-xs text-gray-500">Trial: {trial.brief_title}</div>}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <IconX className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Chat UI goes here */}
        <div className="text-gray-400 text-center mt-8">Chat UI coming soon...</div>
      </div>
    </div>
  )
} 