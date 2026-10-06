/** Light/dark mode: a `dark` class on <html>, remembered in localStorage. Colours live in styles/theme.css. */
export type ColorMode = 'light' | 'dark'

const root = () => document.documentElement

export function getColorMode(): ColorMode {
  return root().classList.contains('dark') ? 'dark' : 'light'
}

export function setColorMode(mode: ColorMode) {
  root().classList.toggle('dark', mode === 'dark')
  try {
    localStorage.setItem('theme', mode)
  } catch {
    // storage blocked: the mode still applies for this page
  }
}

export function toggleColorMode() {
  setColorMode(getColorMode() === 'dark' ? 'light' : 'dark')
}

/** Notifies when the mode changes (watches the class on <html>). */
export function subscribeColorMode(listener: () => void) {
  const observer = new MutationObserver(listener)
  observer.observe(root(), { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}
