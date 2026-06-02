export const resolveResumeUrl = (resumeUrl) => {
  if (!resumeUrl) return '#'
  if (resumeUrl.startsWith('http')) return resumeUrl

  const normalizedPath = resumeUrl.startsWith('/') ? resumeUrl : `/${resumeUrl}`
  const envApiUrl = import.meta.env.VITE_API_URL || ''
  const baseUrl = envApiUrl.replace(/\/api\/?$/, '')

  if (baseUrl) {
    return `${baseUrl}${normalizedPath}`
  }

  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}${normalizedPath}`
  }

  return normalizedPath
}

export const downloadResumeFile = async (resumeUrl, fallbackFilename = 'resume.pdf') => {
  const url = resolveResumeUrl(resumeUrl)
  const filename = resumeUrl?.split('/')?.pop() || fallbackFilename

  const response = await fetch(url, { mode: 'cors' })
  if (!response.ok) {
    throw new Error(`Failed to download resume: ${response.statusText}`)
  }

  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = downloadUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(downloadUrl)
}
