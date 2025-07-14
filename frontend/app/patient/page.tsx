import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconUpload, IconFileText, IconChartBar } from "@tabler/icons-react"

export default function PatientPortal() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Patient Portal
          </h1>
          <p className="text-xl text-gray-600">
            Upload your transcripts and view analysis results
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Upload Transcript</CardTitle>
              <CardDescription>
                Upload your medical transcript for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <IconUpload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>View Analysis</CardTitle>
              <CardDescription>
                Review AI-generated insights and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <IconChartBar className="mr-2 h-4 w-4" />
                View Results
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clinical Trials</CardTitle>
              <CardDescription>
                Find matching clinical trials based on your analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <IconFileText className="mr-2 h-4 w-4" />
                Search Trials
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your recent transcript uploads and analysis results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <IconFileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
              <p className="text-gray-500">
                Upload your first transcript to get started with AI analysis.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 