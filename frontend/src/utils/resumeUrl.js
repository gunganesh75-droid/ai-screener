/**
 * Resolves a relative resume path like `/uploads/resume-xxx.pdf`
 * into a full URL using the backend origin (strips the /api segment).
 * If the URL is already absolute (starts with http), returns it unchanged.
 */
export const resolveResumeUrl = (resumeUrl) => {
  if (!resumeUrl) return '#'
  // Already a full URL — return as-is
  if (resumeUrl.startsWith('http')) return resumeUrl

  const normalizedPath = resumeUrl.startsWith('/') ? resumeUrl : `/${resumeUrl}`
  const envApiUrl = import.meta.env.VITE_API_URL || ''

  if (envApiUrl) {
    try {
      const apiUrl = new URL(envApiUrl)
      // Strip /api (or /api/) suffix — uploads are served at origin/uploads, NOT origin/api/uploads
      const origin = apiUrl.origin
      return `${origin}${normalizedPath}`
    } catch {
      // Fallback: strip /api suffix from raw string
      const origin = envApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '')
      return `${origin}${normalizedPath}`
    }
  }

  // No env var — use current browser origin
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}${normalizedPath}`
  }

  return normalizedPath
}

/**
 * Downloads a resume PDF file. Tries fetch() first for a clean named download,
 * then falls back to opening it in a new tab if CORS blocks the fetch.
 */
export const downloadResumeFile = async (resumeUrl, fallbackFilename = 'resume.pdf') => {
  const url = resolveResumeUrl(resumeUrl)
  const filename = resumeUrl?.split('/')?.pop() || fallbackFilename

  try {
    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = downloadUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.URL.revokeObjectURL(downloadUrl)
  } catch (err) {
    // CORS or network failure — open in new tab so browser handles the download
    console.warn('Fetch download failed, opening in new tab:', err.message)
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

