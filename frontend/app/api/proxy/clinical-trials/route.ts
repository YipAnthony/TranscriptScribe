import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.toString()
    
    console.log('Proxy received query params:', query)
    
    // Construct the CTG API URL with proper parameters
    const ctgUrl = `https://clinicaltrials.gov/api/v2/studies?${query}`
    
    console.log('Making request to CTG API:', ctgUrl)
    
    // Set up headers that mimic a real browser
    const headers = {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7',
      'Cookie': 'pinger_sid=42b4720fb4c7ad63a77e4693713_7SID; _ga=GA1.1.1330412041.1752354695; QSI_SI_6FiwL1BocPEL19Y_intercept=true; _ga_CSLL4ZEK4L=GS2.1.s1752731050$o15$g1$t1752731363$j7$l0$h0; _ga_DP2X732JSX=GS2.1.s1752731050$o14$g1$t1752731644$j60$l0$h0; ncbi_pinger=N4IgDgTgpgbg+mAFgSwCYgFwgCwCYBG2A7LgAwBmhAxkQIaoBsAnAIxECsuRAzCw9tlLsmAZQCSAERABfIA=',
      'Priority': 'u=1, i',
      'Referer': 'https://clinicaltrials.gov/data-api/api',
      'Sec-Ch-Ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
    }

    // Make the request to CTG API
    const response = await fetch(ctgUrl, {
      method: 'GET',
      headers,
      cache: 'no-store' // Don't cache proxy responses
    })

    console.log('CTG API response status:', response.status)
    console.log('CTG API response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`CTG API error: ${response.status} ${response.statusText}`)
      console.error('Error response:', errorText)
      return NextResponse.json(
        { error: `CTG API error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('CTG API response data keys:', Object.keys(data))
    
    // Return the CTG API response
    return NextResponse.json(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Construct the CTG API URL
    const ctgUrl = 'https://clinicaltrials.gov/api/v2/studies'
    
    // Set up headers that mimic a real browser
    const headers = {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7',
      'Cookie': 'pinger_sid=42b4720fb4c7ad63a77e4693713_7SID; _ga=GA1.1.1330412041.1752354695; QSI_SI_6FiwL1BocPEL19Y_intercept=true; _ga_CSLL4ZEK4L=GS2.1.s1752731050$o15$g1$t1752731363$j7$l0$h0; _ga_DP2X732JSX=GS2.1.s1752731050$o14$g1$t1752731644$j60$l0$h0; ncbi_pinger=N4IgDgTgpgbg+mAFgSwCYgFwgCwCYBG2A7LgAwBmhAxkQIaoBsAnAIxECsuRAzCw9tlLsmAZQCSAERABfIA=',
      'Priority': 'u=1, i',
      'Referer': 'https://clinicaltrials.gov/data-api/api',
      'Sec-Ch-Ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      'Content-Type': 'application/json'
    }

    // Make the request to CTG API
    const response = await fetch(ctgUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store'
    })

    if (!response.ok) {
      console.error(`CTG API error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `CTG API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Return the CTG API response
    return NextResponse.json(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 