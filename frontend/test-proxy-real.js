// Test with real CTG API parameters
const testProxyReal = async () => {
  try {
    console.log('Testing proxy with real CTG API parameters')
    
    // These are the parameters your backend would actually send
    const params = new URLSearchParams({
      'fields': 'NCTId,BriefTitle,OfficialTitle,OverallStatus,Condition,LeadSponsorName,Phase,MinimumAge,MaximumAge,Location,BriefSummary,Intervention,EnrollmentCount,StartDate,DetailedDescription,StudyType,CompletionDate,PrimaryCompletionDate,EligibilityCriteria,Sex,HealthyVolunteers,CentralContact,OverallOfficial,LastUpdatePostDate'
    })
    
    const url = `http://localhost:3000/api/proxy/clinical-trials?${params.toString()}`
    console.log('Request URL:', url)
    
    const response = await fetch(url)
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const text = await response.text()
    console.log('Response text (first 500 chars):', text.substring(0, 500))
    
    if (response.ok) {
      try {
        const data = JSON.parse(text)
        console.log('✅ Proxy test successful!')
        console.log('Response data keys:', Object.keys(data))
        if (data.studies) {
          console.log('Number of studies:', data.studies.length)
        }
      } catch (e) {
        console.error('❌ Response is not valid JSON:', e.message)
      }
    } else {
      console.error('❌ Proxy test failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('❌ Proxy test error:', error.message)
  }
}

testProxyReal() 