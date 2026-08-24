// Converts common share links (Google Drive, YouTube) into embeddable
// iframe src URLs. Falls back to the original URL for anything else, or
// if parsing fails on a malformed value — a bad admin-entered URL
// should never crash the page; the iframe itself can show its own
// "can't load" state instead.
//
// Previously this logic was copy-pasted in Schedule.jsx (getPreviewUrl)
// and FilesPage.jsx (getPreviewUrl + getEmbedUrl) — now it lives here
// once. Behavior is unchanged.

function driveEmbedUrl(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  return match ? `https://drive.google.com/file/d/${match[1]}/preview` : null
}

// Drive link -> embeddable preview URL; anything else passes through
// unchanged. Used for PDFs and schedule images.
export function getDriveOrRawUrl(url) {
  if (!url) return ''
  try {
    if (url.includes('drive.google.com')) {
      return driveEmbedUrl(url) || url
    }
    return url
  } catch {
    return url
  }
}

// YouTube or Drive link -> embeddable video URL; anything else passes
// through unchanged. Used for lecture recordings.
export function getVideoEmbedUrl(url) {
  if (!url) return ''
  try {
    if (url.includes('youtube.com/watch')) {
      const id = new URL(url).searchParams.get('v')
      return `https://www.youtube.com/embed/${id}`
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1].split('?')[0]
      return `https://www.youtube.com/embed/${id}`
    }
    if (url.includes('drive.google.com')) {
      return driveEmbedUrl(url) || url
    }
    return url
  } catch {
    return url
  }
}
