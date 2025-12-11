// Service Worker for Google Drive audio streaming on iOS Safari
// Intercepts requests to add Authorization headers for authenticated streaming

const CACHE_NAME = 'gdrive-auth-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Log all requests to Google Drive API for debugging
  if (url.hostname === 'www.googleapis.com') {
    console.log('[SW] Intercepting Google API request:', url.pathname);
  }
  
  // Only intercept Google Drive API media requests
  if (url.hostname === 'www.googleapis.com' && 
      url.pathname.includes('/drive/v3/files/') && 
      url.searchParams.get('alt') === 'media') {
    
    console.log('[SW] Handling Google Drive media request');
    event.respondWith(handleGoogleDriveRequest(event.request));
  }
});

async function handleGoogleDriveRequest(request) {
  try {
    const url = new URL(request.url);
    
    // Extract access token from query param
    const accessToken = url.searchParams.get('access_token');
    
    if (!accessToken) {
      console.warn('[SW] No access token found, passing through');
      return fetch(request);
    }
    
    // Remove access_token from URL (causes CORS issues)
    url.searchParams.delete('access_token');
    
    // Build headers for the new request
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${accessToken}`);
    
    // Copy Range header if present (critical for iOS streaming)
    const rangeHeader = request.headers.get('Range');
    if (rangeHeader) {
      headers.set('Range', rangeHeader);
      console.log('[SW] Range request:', rangeHeader);
    }
    
    // Create new request with Authorization header
    const newRequest = new Request(url.toString(), {
      method: request.method,
      headers: headers,
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
    });
    
    console.log('[SW] Fetching:', url.pathname, rangeHeader ? `(${rangeHeader})` : '');
    
    // Fetch with proper headers
    const response = await fetch(newRequest);
    
    if (!response.ok) {
      console.error('[SW] Fetch failed:', response.status, response.statusText);
      return response;
    }
    
    // Return response with proper CORS headers
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('[SW] Error handling request:', error);
    // Return error response instead of crashing
    return new Response('Service Worker Error', {
      status: 500,
      statusText: 'Service Worker Error'
    });
  }
}

// Handle messages from the page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
