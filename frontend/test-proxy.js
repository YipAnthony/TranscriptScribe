// Test script to verify the CTG API proxy works
// Run this after starting your Next.js development server

const testProxy = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/proxy/clinical-trials?format=json&pageSize=1&fields=NCTId')
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Proxy test successful!')
      console.log('Response:', data)
    } else {
      console.error('❌ Proxy test failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('❌ Proxy test error:', error)
  }
}

// Run the test
testProxy() 