// IndexedDB file store with library support
export function openDB(dbName = 'audiobook-store') {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, 2);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      // files store: keyed by fileId, contains {blob, metadata}
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
      // library store: keyed by fileId, contains {fileId, title, artist, cover, duration, addedDate, lastPlayed, playbackPosition}
      if (!db.objectStoreNames.contains('library')) {
        db.createObjectStore('library');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Save file blob with auto-generated ID
export async function saveFile(fileBlob, metadata = {}) {
  const fileId = Date.now().toString();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['files', 'library'], 'readwrite');
    
    // Save file blob
    const filesStore = tx.objectStore('files');
    filesStore.put(fileBlob, fileId);
    
    // Save library entry with metadata
    const libraryStore = tx.objectStore('library');
    const libraryEntry = {
      fileId,
      title: metadata.title || 'Unknown Title',
      artist: metadata.artist || 'Unknown Artist',
      cover: metadata.cover || null,
      duration: metadata.duration || 0,
      chapters: metadata.chapters || [],
      addedDate: new Date().toISOString(),
      lastPlayed: null,
      playbackPosition: 0,
    };
    libraryStore.put(libraryEntry, fileId);
    
    tx.oncomplete = () => resolve(fileId);
    tx.onerror = () => reject(tx.error);
  });
}

// Get file blob by ID
export async function getFile(fileId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const store = tx.objectStore('files');
    const req = store.get(fileId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// Get library entry by ID
export async function getLibraryEntry(fileId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('library', 'readonly');
    const store = tx.objectStore('library');
    const req = store.get(fileId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// Get all library entries (the file library)
export async function getLibrary() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('library', 'readonly');
    const store = tx.objectStore('library');
    const req = store.getAll();
    req.onsuccess = () => {
      const entries = req.result;
      // Sort by lastPlayed (most recent first), then by addedDate
      entries.sort((a, b) => {
        if (a.lastPlayed && b.lastPlayed) {
          return new Date(b.lastPlayed) - new Date(a.lastPlayed);
        }
        if (a.lastPlayed) return -1;
        if (b.lastPlayed) return 1;
        return new Date(b.addedDate) - new Date(a.addedDate);
      });
      resolve(entries);
    };
    req.onerror = () => reject(req.error);
  });
}

// Update library entry (e.g., playback position, lastPlayed)
export async function updateLibraryEntry(fileId, updates) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('library', 'readwrite');
    const store = tx.objectStore('library');
    
    const getReq = store.get(fileId);
    getReq.onsuccess = () => {
      const entry = getReq.result;
      if (entry) {
        const updated = { ...entry, ...updates, lastPlayed: new Date().toISOString() };
        const putReq = store.put(updated, fileId);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error);
      } else {
        reject(new Error('Library entry not found'));
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

// Delete file and library entry
export async function deleteFile(fileId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['files', 'library'], 'readwrite');
    
    tx.objectStore('files').delete(fileId);
    tx.objectStore('library').delete(fileId);
    
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
