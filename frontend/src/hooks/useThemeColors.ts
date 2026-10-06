import { useEffect, useState } from 'react'
import { themeStore } from '@/theme/themeStore'

/** Resolved CSS variable values, refreshed whenever the Theme Studio or dark mode changes them. */
export function useThemeColors<K extends string>(names: readonly K[]): Record<K, string> {
  const read = () => {
    const style = getComputedStyle(document.documentElement)
    return Object.fromEntries(names.map((n) => [n, style.getPropertyValue(`--${n}`).trim()])) as Record<K, string>
  }
  const [colors, setColors] = useState(read)
  useEffect(() => themeStore.subscribe(() => requestAnimationFrame(() => setColors(read()))), [])
  return colors
}
