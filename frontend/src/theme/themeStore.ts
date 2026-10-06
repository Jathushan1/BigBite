/**
 * Live theme editing for the Theme Studio.
 *
 * The defaults live in src/styles/theme.css. This store only keeps *overrides*:
 * values set inline on <html>, which beat the stylesheet. Brand/feedback colours apply
 * to both modes; surface colours are remembered separately for light and dark.
 */
export type ThemeMode = 'light' | 'dark'

export interface ThemeVar {
  key: string
  label: string
  group: 'Brand' | 'Feedback' | 'Surfaces' | 'Order status'
  /** shared = same in light and dark; mode = remembered per mode */
  scope: 'shared' | 'mode'
}

export const THEME_VARS: ThemeVar[] = [
  { key: '--primary', label: 'Primary', group: 'Brand', scope: 'shared' },
  { key: '--accent', label: 'Accent', group: 'Brand', scope: 'shared' },
  { key: '--primary-foreground', label: 'Text on primary', group: 'Brand', scope: 'shared' },
  { key: '--success', label: 'Success', group: 'Feedback', scope: 'shared' },
  { key: '--warning', label: 'Warning', group: 'Feedback', scope: 'shared' },
  { key: '--info', label: 'Info', group: 'Feedback', scope: 'shared' },
  { key: '--destructive', label: 'Danger', group: 'Feedback', scope: 'shared' },
  { key: '--background', label: 'Page', group: 'Surfaces', scope: 'mode' },
  { key: '--card', label: 'Card', group: 'Surfaces', scope: 'mode' },
  { key: '--foreground', label: 'Text', group: 'Surfaces', scope: 'mode' },
  { key: '--muted-foreground', label: 'Muted text', group: 'Surfaces', scope: 'mode' },
  { key: '--secondary', label: 'Subtle fill', group: 'Surfaces', scope: 'mode' },
  { key: '--status-placed', label: 'Placed', group: 'Order status', scope: 'shared' },
  { key: '--status-confirmed', label: 'Confirmed', group: 'Order status', scope: 'shared' },
  { key: '--status-preparing', label: 'Preparing', group: 'Order status', scope: 'shared' },
  { key: '--status-ready', label: 'Ready', group: 'Order status', scope: 'shared' },
  { key: '--status-out-for-delivery', label: 'On the way', group: 'Order status', scope: 'shared' },
  { key: '--status-completed', label: 'Completed', group: 'Order status', scope: 'shared' },
  { key: '--status-refund-pending', label: 'Refund pending', group: 'Order status', scope: 'shared' },
]

export const FONTS: { label: string; value: string }[] = [
  { label: 'Inter', value: "'Inter', system-ui, sans-serif" },
  { label: 'Poppins', value: "'Poppins', system-ui, sans-serif" },
  { label: 'Nunito', value: "'Nunito', system-ui, sans-serif" },
  { label: 'Space Grotesk', value: "'Space Grotesk', system-ui, sans-serif" },
  { label: 'System', value: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
]

export interface ThemePreset {
  name: string
  swatch: [string, string]
  shared: Record<string, string>
  mode?: ThemeMode
}

export const PRESETS: ThemePreset[] = [
  { name: 'BigBite Red', swatch: ['#E4002B', '#FF2B4F'], shared: {} },
  { name: 'Ocean', swatch: ['#0284C7', '#6366F1'], shared: { '--primary': '#0284C7', '--accent': '#6366F1' } },
  { name: 'Forest', swatch: ['#15803D', '#65A30D'], shared: { '--primary': '#15803D', '--accent': '#65A30D' } },
  { name: 'Sunset', swatch: ['#EA580C', '#DB2777'], shared: { '--primary': '#EA580C', '--accent': '#DB2777' } },
  { name: 'Royal', swatch: ['#7C3AED', '#C026D3'], shared: { '--primary': '#7C3AED', '--accent': '#C026D3' } },
  { name: 'Midnight', swatch: ['#8B5CF6', '#22D3EE'], shared: { '--primary': '#8B5CF6', '--accent': '#22D3EE' }, mode: 'dark' },
]

export interface ThemeState {
  mode: ThemeMode
  shared: Record<string, string>
  light: Record<string, string>
  dark: Record<string, string>
  radius: number | null
  font: string | null
}

const STORAGE_KEY = 'bigbite.theme.v1'
const listeners = new Set<(state: ThemeState) => void>()

function initialMode(): ThemeMode {
  try {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    // storage unavailable
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function load(): ThemeState {
  const base: ThemeState = { mode: initialMode(), shared: {}, light: {}, dark: {}, radius: null, font: null }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...base, ...JSON.parse(raw), mode: base.mode }
  } catch {
    // corrupt or unavailable storage: fall back to defaults
  }
  return base
}

let state: ThemeState = load()

function persist() {
  try {
    localStorage.setItem('theme', state.mode)
    const { mode: _mode, ...rest } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  } catch {
    // ignore
  }
}

const MANAGED_KEYS = [...THEME_VARS.map((v) => v.key), '--radius', '--app-font', '--app-font-display']

export function applyTheme(next: ThemeState = state) {
  const root = document.documentElement
  root.classList.toggle('dark', next.mode === 'dark')
  MANAGED_KEYS.forEach((key) => root.style.removeProperty(key))
  const values = { ...next.shared, ...(next.mode === 'dark' ? next.dark : next.light) }
  Object.entries(values).forEach(([key, value]) => root.style.setProperty(key, value))
  if (next.radius !== null) root.style.setProperty('--radius', `${next.radius}rem`)
  if (next.font) {
    root.style.setProperty('--app-font', next.font)
    root.style.setProperty('--app-font-display', next.font)
  }
}

function update(next: ThemeState) {
  state = next
  applyTheme(state)
  persist()
  listeners.forEach((listener) => listener(state))
}

export const themeStore = {
  get: () => state,
  subscribe(listener: (s: ThemeState) => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  setMode(mode: ThemeMode) {
    update({ ...state, mode })
  },
  toggleMode() {
    update({ ...state, mode: state.mode === 'dark' ? 'light' : 'dark' })
  },
  setVar(key: string, value: string) {
    const def = THEME_VARS.find((v) => v.key === key)
    if (def?.scope === 'mode') {
      update({ ...state, [state.mode]: { ...state[state.mode], [key]: value } })
    } else {
      update({ ...state, shared: { ...state.shared, [key]: value } })
    }
  },
  setRadius(radius: number) {
    update({ ...state, radius })
  },
  setFont(font: string) {
    update({ ...state, font })
  },
  applyPreset(preset: ThemePreset) {
    update({ ...state, shared: { ...preset.shared }, mode: preset.mode ?? state.mode })
  },
  reset() {
    update({ mode: state.mode, shared: {}, light: {}, dark: {}, radius: null, font: null })
  },
  /** CSS that reproduces the current customisation, ready to paste into styles/theme.css. */
  exportCss(): string {
    const lines = (entries: Record<string, string>) =>
      Object.entries(entries).map(([k, v]) => `  ${k}: ${v};`).join('\n')
    const rootExtras: Record<string, string> = { ...state.shared, ...state.light }
    if (state.radius !== null) rootExtras['--radius'] = `${state.radius}rem`
    if (state.font) rootExtras['--app-font'] = state.font
    let css = `:root {\n${lines(rootExtras) || '  /* no changes */'}\n}\n`
    if (Object.keys(state.dark).length) css += `\n.dark {\n${lines(state.dark)}\n}\n`
    return css
  },
}

/** Resolve any CSS colour (var, rgba, color-mix…) to #rrggbb for <input type="color">. */
export function readColorAsHex(key: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(key).trim()
  const probe = document.createElement('span')
  probe.style.color = raw || '#000000'
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const rgb = getComputedStyle(probe).color
  probe.remove()
  const match = rgb.match(/[\d.]+/g)
  if (!match || match.length < 3) return '#000000'
  return '#' + match.slice(0, 3).map((n) => Math.round(Number(n)).toString(16).padStart(2, '0')).join('')
}
