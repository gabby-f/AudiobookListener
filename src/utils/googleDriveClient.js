// Google Drive OAuth and API client
import { gapi } from 'gapi-script';

// These will be set from environment variables
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '1097872181876-gn1ikcrkrnvtmnjor8l30v2q1kbbeo6g.apps.googleusercontent.com';
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || '';

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

// Authorization scopes required by the API
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;

/**
 * Initialize the Google API client
 */
export async function initGoogleDrive() {
  return new Promise((resolve, reject) => {
    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        console.log('Google Drive API initialized');
        resolve();
      } catch (error) {
        console.error('Error initializing Google Drive API:', error);
        reject(error);
      }
    });
  });
}

/**
 * Initialize Google Identity Services (for OAuth)
 */
export function initGoogleAuth(callback) {
  if (!window.google) {
    console.error('Google Identity Services not loaded');
    return;
  }

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.error) {
        console.error('Auth error:', response);
        callback(null, response.error);
      } else {
        console.log('Auth successful');
        gisInited = true;
        callback(response.access_token);
      }
    },
  });
}

/**
 * Sign in to Google Drive
 */
export function signInToGoogleDrive() {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Auth not initialized. Call initGoogleAuth first.'));
      return;
    }

    // Check if user already has valid token
    if (gapi.client.getToken()) {
      resolve(gapi.client.getToken().access_token);
      return;
    }

    // Request new token
    tokenClient.callback = (response) => {
      if (response.error) {
        reject(response);
      } else {
        resolve(response.access_token);
      }
    };

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

/**
 * Sign out from Google Drive
 */
export function signOutFromGoogleDrive() {
  const token = gapi.client.getToken();
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken(null);
  }
}

/**
 * Check if user is signed in
 */
export function isSignedIn() {
  const token = gapi.client.getToken();
  return token !== null;
}

/**
 * List audio files from Google Drive
 * @param {number} maxResults - Maximum number of files to return (default: 100)
 */
export async function listAudioFiles(maxResults = 100) {
  try {
    const response = await gapi.client.drive.files.list({
      pageSize: maxResults,
      fields: 'files(id, name, mimeType, size, modifiedTime, iconLink, thumbnailLink)',
      q: "mimeType contains 'audio/' or name contains '.m4b' or name contains '.m4a' or name contains '.mp3'",
      orderBy: 'modifiedTime desc',
    });

    return response.result.files || [];
  } catch (error) {
    console.error('Error listing Drive files:', error);
    throw error;
  }
}

/**
 * Get a streaming URL for a Google Drive file
 * Returns a URL with access token that the service worker will intercept
 * and convert to use Authorization headers for iOS Safari compatibility
 * @param {string} fileId - The ID of the file
 * @returns {Promise<string>} - Streaming URL for the audio file
 */
export async function getStreamingUrl(fileId) {
  const token = gapi.client.getToken();
  if (!token) {
    throw new Error('Not signed in to Google Drive');
  }
  
  console.log('Creating streaming URL for Google Drive file...');
  
  // Return URL with access_token - service worker will intercept and add Authorization header
  // This allows iOS Safari to stream with range requests
  const streamingUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${token.access_token}`;
  
  console.log('✓ Streaming URL created');
  return streamingUrl;
}

/**
 * Download a file from Google Drive
 * @param {string} fileId - The ID of the file to download
 * @returns {Promise<Blob>} - The file as a Blob
 */
export async function downloadDriveFile(fileId) {
  try {
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });

    // The response is the file content
    // We need to convert it to a Blob
    const blob = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${gapi.client.getToken().access_token}`,
        },
      }
    ).then((r) => r.blob());

    return blob;
  } catch (error) {
    console.error('Error downloading Drive file:', error);
    throw error;
  }
}

/**
 * Get file metadata from Google Drive
 * @param {string} fileId - The ID of the file
 */
export async function getFileMetadata(fileId) {
  try {
    const response = await gapi.client.drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, modifiedTime, description',
    });

    return response.result;
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw error;
  }
}

/**
 * Check if Google Drive API is ready
 */
export function isGoogleDriveReady() {
  return gapiInited && gisInited;
}
