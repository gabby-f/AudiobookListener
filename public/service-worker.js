// Service Worker to handle Google Drive authentication for audio streaming
// This allows iOS Safari to stream from Google Drive by adding auth headers

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only intercept Google Drive API requests
  if (url.hostname === 'www.googleapis.com' && url.pathname.includes('/drive/v3/files/')) {
    event.respondWith(handleGoogleDriveRequest(event.request, url));
  }
});

async function handleGoogleDriveRequest(request, url) {
  try {
    // Extract access token from URL
    const accessToken = url.searchParams.get('access_token');
    
    if (!accessToken) {
      // No token, just pass through
      return fetch(request);
    }
    
    // Remove access_token from URL (causes CORS issues on iOS)
    url.searchParams.delete('access_token');
    const cleanUrl = url.toString();
    
    // Create new request with Authorization header instead
    const newRequest = new Request(cleanUrl, {
      method: request.method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Range': request.headers.get('Range') || 'bytes=0-',
      },
      mode: 'cors',
      credentials: 'omit',
    });
    
    const response = await fetch(newRequest);
    
    // Clone response and add CORS headers
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Range, Authorization');
    newHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    console.error('Service Worker fetch error:', error);
    return fetch(request);
  }
}
