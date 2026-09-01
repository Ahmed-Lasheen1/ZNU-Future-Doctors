import { useState } from 'react'

// True only the first time this key is checked in the current browser
// tab session (survives reloads, cleared when the tab closes) — false
// every time after that. Used to gate a one-time entrance animation so
// it doesn't replay every time the user navigates back to a page via
// client-side routing.
export function useOncePerSession(key) {
  const [isFirst] = useState(() => {
    try {
      if (sessionStorage.getItem(key)) return false
      sessionStorage.setItem(key, '1')
      return true
    } catch {
      return true
    }
  })
  return isFirst
}
