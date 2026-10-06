import { useEffect, useState } from 'react'
import { subscribeColorMode } from '@/theme/colorMode'

/** Resolved CSS variable values (for chart libraries that need real colours); refreshed on light/dark switch. */
export function useThemeColors<K extends string>(names: readonly K[]): Record<K, string> {
  const read = () => {
    const style = getComputedStyle(document.documentElement)
    return Object.fromEntries(names.map((n) => [n, style.getPropertyValue(`--${n}`).trim()])) as Record<K, string>
  }
  const [colors, setColors] = useState(read)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => subscribeColorMode(() => setColors(read())), [])
  return colors
}
