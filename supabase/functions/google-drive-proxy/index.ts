// Supabase Edge Function to proxy Google Drive audio streaming
// This allows iOS Safari to stream from Google Drive without CORS/auth issues

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const fileId = url.searchParams.get('fileId')
    const accessToken = url.searchParams.get('accessToken')

    if (!fileId || !accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing fileId or accessToken' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build Google Drive API URL
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`

    // Prepare headers for Google Drive request
    const driveHeaders: HeadersInit = {
      'Authorization': `Bearer ${accessToken}`,
    }

    // Forward Range header if present (critical for iOS Safari seeking)
    const rangeHeader = req.headers.get('Range')
    if (rangeHeader) {
      driveHeaders['Range'] = rangeHeader
      console.log('Proxying range request:', rangeHeader)
    }

    // Fetch from Google Drive
    const driveResponse = await fetch(driveUrl, {
      headers: driveHeaders,
    })

    if (!driveResponse.ok) {
      console.error('Google Drive error:', driveResponse.status, driveResponse.statusText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch from Google Drive',
          status: driveResponse.status,
          statusText: driveResponse.statusText 
        }),
        { 
          status: driveResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build response headers
    const responseHeaders = new Headers(corsHeaders)
    
    // Copy important headers from Google Drive response
    const headersToForward = [
      'Content-Type',
      'Content-Length',
      'Content-Range',
      'Accept-Ranges',
      'Cache-Control',
      'ETag',
    ]

    headersToForward.forEach(header => {
      const value = driveResponse.headers.get(header)
      if (value) {
        responseHeaders.set(header, value)
      }
    })

    // If no Accept-Ranges header, add it (iOS Safari needs this for seeking)
    if (!responseHeaders.has('Accept-Ranges')) {
      responseHeaders.set('Accept-Ranges', 'bytes')
    }

    console.log('Proxying Google Drive file:', fileId, 
                rangeHeader ? `(${rangeHeader})` : '(full file)')

    // Stream the response body
    return new Response(driveResponse.body, {
      status: driveResponse.status,
      headers: responseHeaders,
    })

  } catch (error) {
    console.error('Error in proxy function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
