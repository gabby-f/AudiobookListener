/**
 * M4B Chapter Extractor - Extracts chapter information from M4B files
 * Similar to how VLC media player reads chapter data from MP4/M4B files
 * 
 * MP4/M4B Atom structure: [size: 4 bytes big-endian][name: 4 bytes ASCII][data: size-8 bytes]
 */

export async function extractM4BChapters(file) {
    try {
        const buffer = await file.arrayBuffer();
        const view = new DataView(buffer);
        
        console.log('Starting M4B chapter extraction, file size:', buffer.byteLength);
        
        // Find the moov atom which contains all metadata
        const moov = findMoovAtom(view);
        if (!moov) {
            console.log('No moov atom found in file');
            return [];
        }
        
        console.log('Found moov atom at offset:', moov.offset, 'size:', moov.size);
        
        // Method 1: Look for udta (user data) -> chpl (chapter list) - HIGHEST PRIORITY
        const udta = findAtomInParent(view, 'udta', moov.offset, moov.size);
        if (udta) {
            console.log('Found udta atom at offset:', udta.offset);
            
            // Look directly for chpl in udta (not in meta)
            const chpl = findAtomInParent(view, 'chpl', udta.offset, udta.size);
            if (chpl) {
                console.log('Found chpl atom in udta at offset:', chpl.offset, 'size:', chpl.size);
                const chapters = parseChplAtom(view, chpl.offset + 8, chpl.size - 8);
                if (chapters.length > 0) {
                    console.log('Successfully extracted', chapters.length, 'chapters from chpl');
                    return chapters;
                }
            } else {
                console.log('No chpl atom found in udta');
            }
        }
        
        // Method 2: Look for chapter track (text track referenced as chapters) - FALLBACK ONLY
        const chapters = parseChapterTrack(view, moov.offset, moov.size);
        if (chapters.length > 0) {
            console.log('Successfully extracted', chapters.length, 'chapters from chapter track');
            return chapters;
        }
        
        console.log('No chapters found in file');
        return [];
        
    } catch (error) {
        console.error('Error extracting M4B chapters:', error);
        return [];
    }
}

/**
 * Extract metadata (title, artist, album, cover art) from M4B file
 * Reads directly from MP4 atoms like VLC does
 */
export async function extractM4BMetadata(file) {
    try {
        const buffer = await file.arrayBuffer();
        const view = new DataView(buffer);
        
        console.log('Starting M4B metadata extraction');
        
        const metadata = {
            title: null,
            artist: null,
            album: null,
            albumArtist: null,
            cover: null,
            duration: 0
        };
        
        // Find the moov atom
        const moov = findMoovAtom(view);
        if (!moov) {
            console.log('No moov atom found');
            return metadata;
        }
        
        // Get duration from mvhd (movie header)
        const mvhd = findAtomInParent(view, 'mvhd', moov.offset, moov.size);
        if (mvhd) {
            const version = view.getUint8(mvhd.offset + 8);
            let duration, timescale;
            
            if (version === 1) {
                // 64-bit version: skip size(4) + name(4) + version(1) + flags(3) + creation(8) + modification(8) = 28
                timescale = view.getUint32(mvhd.offset + 28, false);
                const durationHigh = view.getUint32(mvhd.offset + 32, false);
                const durationLow = view.getUint32(mvhd.offset + 36, false);
                duration = (durationHigh * 0x100000000 + durationLow) / timescale;
            } else {
                // 32-bit version: skip size(4) + name(4) + version(1) + flags(3) + creation(4) + modification(4) = 20
                timescale = view.getUint32(mvhd.offset + 20, false);
                duration = view.getUint32(mvhd.offset + 24, false) / timescale;
            }
            
            metadata.duration = duration;
            console.log('Duration:', duration, 'seconds', '(', Math.floor(duration / 3600), 'hours', Math.floor((duration % 3600) / 60), 'minutes )');
        }
        
        // Look for metadata in udta -> meta -> ilst
        const udta = findAtomInParent(view, 'udta', moov.offset, moov.size);
        if (udta) {
            console.log('Found udta at offset:', udta.offset, 'size:', udta.size);
            const meta = findAtomInParent(view, 'meta', udta.offset, udta.size);
            if (meta) {
                console.log('Found meta at offset:', meta.offset, 'size:', meta.size);
                // meta atom has version/flags (4 bytes) after size+name, skip them
                const ilst = findAtomInParent(view, 'ilst', meta.offset + 4, meta.size - 4);
                if (ilst) {
                    console.log('Found ilst (item list) at offset:', ilst.offset, 'size:', ilst.size);
                    
                    // Parse all metadata items
                    const items = parseIlstAtom(view, ilst.offset, ilst.size);
                    
                    // Extract specific metadata fields
                    metadata.title = items['©nam'] || items['title'] || null;
                    metadata.artist = items['©ART'] || items['artist'] || null;
                    metadata.album = items['©alb'] || items['album'] || null;
                    metadata.albumArtist = items['aART'] || null;
                    metadata.cover = items['covr'] || null;
                    
                    console.log('Extracted metadata:', {
                        title: metadata.title,
                        artist: metadata.artist,
                        album: metadata.album,
                        hasCover: !!metadata.cover
                    });
                } else {
                    console.log('No ilst atom found in meta');
                }
            } else {
                console.log('No meta atom found in udta');
            }
        } else {
            console.log('No udta atom found in moov');
        }
        
        return metadata;
        
    } catch (error) {
        console.error('Error extracting M4B metadata:', error);
        return {
            title: null,
            artist: null,
            album: null,
            albumArtist: null,
            cover: null,
            duration: 0
        };
    }
}

/**
 * Parse ilst (item list) atom to extract all metadata tags
 */
function parseIlstAtom(view, ilstOffset, ilstSize) {
    const metadata = {};
    let offset = ilstOffset + 8; // Skip ilst size and name
    const endOffset = ilstOffset + ilstSize;
    
    console.log('Parsing ilst from offset:', offset, 'to:', endOffset);
    
    try {
        while (offset < endOffset - 8) {
            if (offset + 8 > view.byteLength) break;
            
            const itemSize = view.getUint32(offset, false);
            const itemName = readAtomName(view, offset + 4);
            
            console.log(`Found item: ${itemName}, size: ${itemSize}`);
            
            if (itemSize < 8 || itemSize > ilstSize || itemSize > (endOffset - offset)) {
                console.log('Invalid item size, skipping');
                offset += 8;
                continue;
            }
            
            // Look for data atom inside this item
            const dataAtom = findAtomInParent(view, 'data', offset, itemSize);
            if (dataAtom) {
                const value = parseDataAtom(view, dataAtom.offset, dataAtom.size, itemName);
                if (value !== null) {
                    metadata[itemName] = value;
                    console.log(`Found metadata: ${itemName} =`, 
                        typeof value === 'string' ? value.substring(0, 50) : 'binary data');
                }
            }
            
            offset += itemSize;
        }
    } catch (error) {
        console.error('Error parsing ilst atom:', error);
    }
    
    return metadata;
}

/**
 * Parse data atom and extract the actual value
 */
function parseDataAtom(view, dataOffset, dataSize, itemName) {
    try {
        if (dataSize < 16) {
            console.log(`Data atom for ${itemName} too small:`, dataSize);
            return null;
        }
        
        // data atom structure: size(4) + 'data'(4) + type(4) + locale(4) + value
        const dataType = view.getUint32(dataOffset + 8, false);
        const valueOffset = dataOffset + 16;
        const valueSize = dataSize - 16;
        
        console.log(`Parsing ${itemName}: type=${dataType}, valueSize=${valueSize}`);
        
        // Type 1 = UTF-8 text
        if (dataType === 1) {
            const bytes = new Uint8Array(view.buffer, view.byteOffset + valueOffset, valueSize);
            return new TextDecoder('utf-8').decode(bytes).trim();
        }
        
        // Type 13 = JPEG image
        // Type 14 = PNG image
        if (dataType === 13 || dataType === 14) {
            if (itemName === 'covr') {
                const imageBytes = new Uint8Array(view.buffer, view.byteOffset + valueOffset, valueSize);
                const mimeType = dataType === 13 ? 'image/jpeg' : 'image/png';
                const blob = new Blob([imageBytes], { type: mimeType });
                return URL.createObjectURL(blob);
            }
        }
        
        // Type 21 = signed integer
        if (dataType === 21) {
            if (valueSize === 1) return view.getInt8(valueOffset);
            if (valueSize === 2) return view.getInt16(valueOffset, false);
            if (valueSize === 4) return view.getInt32(valueOffset, false);
        }
        
        // Type 0 = binary data (also used for integers sometimes)
        if (dataType === 0) {
            if (valueSize === 1) return view.getUint8(valueOffset);
            if (valueSize === 2) return view.getUint16(valueOffset, false);
            if (valueSize === 4) return view.getUint32(valueOffset, false);
        }
        
        return null;
        
    } catch (error) {
        console.error('Error parsing data atom:', error);
        return null;
    }
}

// Specialized function to find moov atom by scanning top-level atoms
function findMoovAtom(view) {
    let offset = 0;
    const fileSize = view.byteLength;
    
    console.log('Scanning file for moov atom...');
    
    // Scan through top-level atoms
    while (offset < fileSize - 8) {
        if (offset + 8 > fileSize) break;
        
        const size = view.getUint32(offset, false); // Big-endian
        const name = readAtomName(view, offset + 4);
        
        console.log(`Found atom: ${name} at offset ${offset}, size: ${size}`);
        
        if (name === 'moov') {
            console.log('Found moov atom!');
            return { offset, size };
        }
        
        // Handle size edge cases
        if (size === 0) {
            // Size 0 means atom extends to EOF
            console.log('Atom extends to EOF, stopping scan');
            break;
        }
        
        if (size === 1) {
            // Extended 64-bit size
            if (offset + 16 > fileSize) break;
            const extSize = Number(view.getBigUint64(offset + 8, false));
            console.log('Extended size:', extSize);
            offset += extSize;
        } else if (size < 8) {
            // Invalid size, skip 1 byte and continue
            offset += 1;
        } else {
            // Normal size
            offset += size;
        }
        
        // Safety: don't infinite loop
        if (size < 1 && size !== 0) {
            offset += 8;
        }
    }
    
    console.log('Finished scanning file, no moov found');
    return null;
}

// Find an atom starting from the beginning of the file
function findAtom(view, atomName, startOffset = 0) {
    let offset = startOffset;
    // For large files, search first 10MB and last 10MB (moov is often at end in M4B files)
    const searchSize = 10000000; // 10MB
    const fileSize = view.byteLength;
    
    // Search from start
    const startSearchEnd = Math.min(fileSize, startOffset + searchSize);
    while (offset < startSearchEnd - 8) {
        const size = view.getUint32(offset, false); // Big-endian
        const name = readAtomName(view, offset + 4);
        
        if (name === atomName) {
            console.log(`Found ${atomName} at offset ${offset} (from start)`);
            return { offset, size };
        }
        
        // Skip to next atom
        if (size === 0) break; // Size 0 means atom extends to EOF
        if (size === 1) {
            // Extended size in next 8 bytes
            const extSize = view.getBigUint64(offset + 8, false);
            offset += Number(extSize);
        } else if (size < 8) {
            // Invalid size
            offset += 1;
        } else {
            offset += size;
        }
    }
    
    // If not found in first part, search last 10MB of file (common for M4B)
    if (atomName === 'moov' && fileSize > searchSize * 2) {
        console.log('Searching end of file for moov atom...');
        offset = Math.max(startOffset, fileSize - searchSize);
        while (offset < fileSize - 8) {
            const size = view.getUint32(offset, false);
            const name = readAtomName(view, offset + 4);
            
            if (name === atomName) {
                console.log(`Found ${atomName} at offset ${offset} (from end)`);
                return { offset, size };
            }
            
            if (size === 0 || size === 1 || size < 8) {
                offset += 1;
            } else {
                offset += size;
            }
        }
    }
    
    return null;
}

// Find an atom within a parent atom's boundaries
function findAtomInParent(view, atomName, parentOffset, parentSize) {
    let offset = parentOffset + 8; // Skip parent's size and name
    const endOffset = parentOffset + parentSize;
    
    while (offset < endOffset - 8 && offset < view.byteLength) {
        if (offset + 8 > view.byteLength) break;
        
        const size = view.getUint32(offset, false);
        const name = readAtomName(view, offset + 4);
        
        if (name === atomName) {
            return { offset, size };
        }
        
        // Skip to next atom
        if (size === 0) break; // Size 0 means extends to end
        if (size === 1) {
            // Extended size (rarely used in nested atoms)
            if (offset + 16 <= view.byteLength) {
                const extSize = Number(view.getBigUint64(offset + 8, false));
                offset += extSize;
            } else {
                break;
            }
        } else if (size < 8) {
            // Invalid size, try to skip
            offset += 1;
        } else {
            offset += size;
        }
        
        // Safety check to prevent infinite loops
        if (offset >= endOffset || offset <= parentOffset + 8) break;
    }
    
    return null;
}

// Read 4-byte atom name as ASCII string
function readAtomName(view, offset) {
    if (offset + 4 > view.byteLength) return '';
    let name = '';
    for (let i = 0; i < 4; i++) {
        name += String.fromCharCode(view.getUint8(offset + i));
    }
    return name;
}

// Parse the chpl (chapter list) atom
function parseChplAtom(view, dataOffset, dataSize) {
    try {
        // chpl data structure:
        // version (1 byte) + flags (3 bytes) + reserved (4 bytes) + entry count (4 bytes)
        if (dataSize < 12) {
            console.log('chpl atom too small:', dataSize);
            return [];
        }
        
        const version = view.getUint8(dataOffset);
        const entryCount = view.getUint32(dataOffset + 8, false); // Big-endian
        
        console.log('chpl version:', version, 'entry count:', entryCount);
        
        if (entryCount === 0 || entryCount > 1000) {
            console.log('Invalid chapter count:', entryCount);
            return [];
        }
        
        const chapters = [];
        let currentOffset = dataOffset + 12;
        const endOffset = dataOffset + dataSize;
        
        for (let i = 0; i < entryCount && currentOffset < endOffset - 5; i++) {
            // Each entry: timestamp (8 bytes, 100-nanosecond units) + title length (1 byte) + title
            if (currentOffset + 9 > endOffset) break;
            
            // Read timestamp as 64-bit big-endian integer (in 100-nanosecond units)
            const timestampHigh = view.getUint32(currentOffset, false);
            const timestampLow = view.getUint32(currentOffset + 4, false);
            const timestamp = (timestampHigh * 0x100000000 + timestampLow) / 10000000; // Convert to seconds
            
            const titleLength = view.getUint8(currentOffset + 8);
            currentOffset += 9;
            
            if (currentOffset + titleLength > endOffset) break;
            
            let title = '';
            if (titleLength > 0) {
                const titleBytes = new Uint8Array(view.buffer, view.byteOffset + currentOffset, titleLength);
                title = new TextDecoder('utf-8').decode(titleBytes);
            }
            
            currentOffset += titleLength;
            
            chapters.push({
                title: title.trim() || `Chapter ${i + 1}`,
                startTime: timestamp,
                duration: null
            });
        }
        
        // Calculate durations
        for (let i = 0; i < chapters.length - 1; i++) {
            chapters[i].duration = chapters[i + 1].startTime - chapters[i].startTime;
        }
        
        console.log('Parsed chapters:', chapters);
        return chapters;
        
    } catch (error) {
        console.error('Error parsing chpl atom:', error);
        return [];
    }
}

// Parse chapter track (text track with chapter markers)
function parseChapterTrack(view, moovOffset, moovSize) {
    try {
        let offset = moovOffset + 8; // Skip moov size and name
        const endOffset = moovOffset + moovSize;
        let iterations = 0;
        const maxIterations = 10; // Safety limit: max 10 tracks
        
        // Find all trak atoms in moov sequentially
        while (offset < endOffset - 8 && iterations < maxIterations) {
            iterations++;
            
            if (offset + 8 > view.byteLength) break;
            
            const trakSize = view.getUint32(offset, false);
            const trakName = readAtomName(view, offset + 4);
            
            if (trakName !== 'trak') {
                // Skip to next atom
                if (trakSize < 8) {
                    offset += 1;
                } else {
                    offset += trakSize;
                }
                continue;
            }
            
            console.log('Checking trak at offset:', offset, 'size:', trakSize);
            const trak = { offset, size: trakSize };
            
            // Look for text track with chapter references
            const mdia = findAtomInParent(view, 'mdia', trak.offset, trak.size);
            if (mdia) {
                const minf = findAtomInParent(view, 'minf', mdia.offset, mdia.size);
                if (minf) {
                    const stbl = findAtomInParent(view, 'stbl', minf.offset, minf.size);
                    if (stbl) {
                        const chapters = parseTextSamples(view, stbl.offset, stbl.size, mdia.offset, mdia.size);
                        if (chapters.length > 0) return chapters;
                    }
                }
            }
            
            offset = trak.offset + trak.size;
        }
    } catch (error) {
        console.error('Error parsing chapter track:', error);
    }
    return [];
}

// Parse text samples from stbl (sample table) atom
function parseTextSamples(view, stblOffset, stblSize, mdiaOffset, mdiaSize) {
    try {
        // Get time scale from mdhd (media header)
        const mdhd = findAtomInParent(view, 'mdhd', mdiaOffset, mdiaSize);
        let timeScale = 1000; // Default
        
        if (mdhd) {
            const version = view.getUint8(mdhd.offset + 8);
            const timeScaleOffset = version === 1 ? 20 : 12;
            timeScale = view.getUint32(mdhd.offset + 8 + timeScaleOffset, false);
            console.log('Time scale:', timeScale);
        }
        
        // Get sample times from stts (time-to-sample)
        const stts = findAtomInParent(view, 'stts', stblOffset, stblSize);
        if (!stts) return [];
        
        const entryCount = view.getUint32(stts.offset + 12, false);
        console.log('stts entry count:', entryCount);
        
        const sampleTimes = [];
        let currentTime = 0;
        let dataOffset = stts.offset + 16;
        
        for (let i = 0; i < entryCount && dataOffset + 8 <= stts.offset + stts.size; i++) {
            const sampleCount = view.getUint32(dataOffset, false);
            const sampleDelta = view.getUint32(dataOffset + 4, false);
            
            for (let j = 0; j < sampleCount; j++) {
                sampleTimes.push(currentTime / timeScale);
                currentTime += sampleDelta;
            }
            
            dataOffset += 8;
        }
        
        // Get sample descriptions from stsd
        const stsd = findAtomInParent(view, 'stsd', stblOffset, stblSize);
        if (!stsd) return [];
        
        // Check if this is a text track
        const handlerType = readAtomName(view, stsd.offset + 20);
        console.log('Handler type:', handlerType);
        
        // Only process if this is actually a text track (tx3g, text), not audio (mp4a)
        if (handlerType !== 'tx3g' && handlerType !== 'text') {
            console.log('Not a text track, skipping');
            return [];
        }
        
        // Get sample sizes from stsz
        const stsz = findAtomInParent(view, 'stsz', stblOffset, stblSize);
        if (!stsz) return [];
        
        const sampleCount = view.getUint32(stsz.offset + 16, false);
        console.log('Sample count:', sampleCount);
        
        // Get chunk offsets from stco
        const stco = findAtomInParent(view, 'stco', stblOffset, stblSize);
        if (!stco) return [];
        
        const chunkCount = view.getUint32(stco.offset + 12, false);
        const chunkOffsets = [];
        let chunkOffset = stco.offset + 16;
        for (let i = 0; i < chunkCount && chunkOffset + 4 <= stco.offset + stco.size; i++) {
            chunkOffsets.push(view.getUint32(chunkOffset, false));
            chunkOffset += 4;
        }
        
        // Get sample to chunk mapping from stsc
        const stsc = findAtomInParent(view, 'stsc', stblOffset, stblSize);
        const sampleToChunk = [];
        if (stsc) {
            const entryCount = view.getUint32(stsc.offset + 12, false);
            let dataOffset = stsc.offset + 16;
            for (let i = 0; i < entryCount && dataOffset + 12 <= stsc.offset + stsc.size; i++) {
                const firstChunk = view.getUint32(dataOffset, false);
                const samplesPerChunk = view.getUint32(dataOffset + 4, false);
                sampleToChunk.push({ firstChunk, samplesPerChunk });
                dataOffset += 12;
            }
        }
        
        // Get text sample data - extract actual text from mdat
        const chapters = [];
        let sampleOffset = 0;
        
        for (let i = 0; i < Math.min(sampleTimes.length, 100); i++) {
            let chapterTitle = `Chapter ${i + 1}`;
            
            // Try to read text sample from mdat
            try {
                // Determine which chunk this sample belongs to
                let chunkIndex = 0;
                let samplesInChunk = 1;
                
                if (sampleToChunk.length > 0) {
                    // Find which chunk this sample is in
                    let totalSamples = 0;
                    for (let j = 0; j < sampleToChunk.length; j++) {
                        const entry = sampleToChunk[j];
                        const nextFirstChunk = j + 1 < sampleToChunk.length ? sampleToChunk[j + 1].firstChunk : chunkCount + 1;
                        const chunksInRange = nextFirstChunk - entry.firstChunk;
                        const samplesInRange = chunksInRange * entry.samplesPerChunk;
                        
                        if (i < totalSamples + samplesInRange) {
                            chunkIndex = entry.firstChunk - 1 + Math.floor((i - totalSamples) / entry.samplesPerChunk);
                            samplesInChunk = entry.samplesPerChunk;
                            break;
                        }
                        totalSamples += samplesInRange;
                    }
                }
                
                if (chunkIndex < chunkOffsets.length) {
                    const mdatOffset = chunkOffsets[chunkIndex];
                    
                    // Read text sample: 2 bytes for text length + text data
                    if (mdatOffset + 2 < view.byteLength) {
                        const textLength = view.getUint16(mdatOffset, false);
                        if (textLength > 0 && textLength < 500 && mdatOffset + 2 + textLength < view.byteLength) {
                            const textBytes = new Uint8Array(view.buffer, view.byteOffset + mdatOffset + 2, textLength);
                            chapterTitle = new TextDecoder('utf-8').decode(textBytes).trim();
                            if (!chapterTitle) chapterTitle = `Chapter ${i + 1}`;
                        }
                    }
                }
            } catch (e) {
                console.log('Could not read text sample at index', i);
            }
            
            chapters.push({
                title: chapterTitle,
                startTime: sampleTimes[i],
                duration: i < sampleTimes.length - 1 ? sampleTimes[i + 1] - sampleTimes[i] : null
            });
        }
        
        return chapters;
        
    } catch (error) {
        console.error('Error parsing text samples:', error);
        return [];
    }
}

export function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
