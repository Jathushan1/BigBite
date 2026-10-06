import { useEffect, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown, Copy, Moon, Palette, RotateCcw, Sun, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/sonner'
import { FONTS, PRESETS, THEME_VARS, readColorAsHex, themeStore, type ThemeVar } from '@/theme/themeStore'

const ENABLED = import.meta.env.VITE_THEME_STUDIO !== 'false'

function useTheme() {
  return useSyncExternalStore(themeStore.subscribe, themeStore.get)
}

function ColorRow({ variable, version }: { variable: ThemeVar; version: number }) {
  const [hex, setHex] = useState('#000000')
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const value = readColorAsHex(variable.key)
    setHex(value)
    setDraft(value)
  }, [variable.key, version])

  const commit = (value: string) => {
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      setHex(value)
      themeStore.setVar(variable.key, value)
    }
  }

  return (
    <label className="flex items-center gap-3 py-1.5">
      <span className="relative h-8 w-8 shrink-0 rounded-lg border border-border overflow-hidden shadow-xs">
        <span className="absolute inset-0" style={{ background: hex }} />
        <input
          type="color"
          value={hex}
          onChange={(e) => {
            setDraft(e.target.value)
            commit(e.target.value)
          }}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label={variable.label}
        />
      </span>
      <span className="flex-1 text-sm text-foreground">{variable.label}</span>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => e.key === 'Enter' && commit(draft)}
        className="w-24 rounded-lg border border-input bg-background px-2 py-1 font-mono text-xs uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        spellCheck={false}
      />
    </label>
  )
}

/**
 * Floating live theme editor. Every change writes a CSS variable on <html>, so the
 * whole app re-colours instantly; choices are remembered in this browser only.
 */
export function ThemeStudio() {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const [openGroup, setOpenGroup] = useState<string>('Brand')

  // Re-read colours after anything that changes computed values (mode switch, preset, reset).
  useEffect(() => {
    const id = requestAnimationFrame(() => setVersion((v) => v + 1))
    return () => cancelAnimationFrame(id)
  }, [theme.mode, theme.shared, theme.light, theme.dark])

  if (!ENABLED) return null

  const groups = ['Brand', 'Feedback', 'Surfaces', 'Order status'] as const
  const radius = theme.radius ?? 0.75
  const activePreset = PRESETS.find(
    (p) => JSON.stringify(p.shared) === JSON.stringify(theme.shared)
  )?.name

  const copyCss = async () => {
    try {
      await navigator.clipboard.writeText(themeStore.exportCss())
      toast.success('Theme CSS copied', { description: 'Paste it into src/styles/theme.css to make it permanent.' })
    } catch {
      toast.error('Clipboard is not available here')
    }
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.08, rotate: -8 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-5 left-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-brand-gradient text-primary-foreground shadow-lg glow-primary cursor-pointer"
        aria-label="Open Theme Studio"
        title="Theme Studio"
      >
        <Palette className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-label="Theme Studio"
              initial={{ x: -380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -380, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed left-0 top-0 z-50 flex h-full w-[min(360px,100vw)] flex-col border-r border-border bg-popover text-popover-foreground shadow-2xl"
            >
              <header className="flex items-center gap-3 border-b border-border px-5 py-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-primary-foreground">
                  <Palette className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <h2 className="text-base font-bold leading-tight">Theme Studio</h2>
                  <p className="text-xs text-muted-foreground">Changes apply live to every page</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                  aria-label="Close Theme Studio"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                <section>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Presets</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => themeStore.applyPreset(preset)}
                        className={cn(
                          'group flex flex-col items-center gap-1.5 rounded-xl border p-2 text-[11px] font-semibold transition-all cursor-pointer hover:-translate-y-0.5',
                          activePreset === preset.name ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                        )}
                      >
                        <span
                          className="relative h-8 w-full rounded-lg"
                          style={{ background: `linear-gradient(135deg, ${preset.swatch[0]}, ${preset.swatch[1]})` }}
                        >
                          {activePreset === preset.name && (
                            <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                          )}
                        </span>
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <p className="text-sm font-semibold">Appearance</p>
                    <p className="text-xs text-muted-foreground">Surface colours are kept per mode</p>
                  </div>
                  <div className="flex rounded-lg bg-secondary p-1">
                    {(['light', 'dark'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => themeStore.setMode(mode)}
                        className={cn(
                          'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold capitalize cursor-pointer transition-colors',
                          theme.mode === mode ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
                        )}
                      >
                        {mode === 'light' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                        {mode}
                      </button>
                    ))}
                  </div>
                </section>

                {groups.map((group) => (
                  <section key={group} className="rounded-xl border border-border">
                    <button
                      type="button"
                      onClick={() => setOpenGroup(openGroup === group ? '' : group)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-semibold cursor-pointer"
                    >
                      {group}
                      <ChevronDown className={cn('h-4 w-4 transition-transform', openGroup === group && 'rotate-180')} />
                    </button>
                    <AnimatePresence initial={false}>
                      {openGroup === group && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border px-3 py-1.5">
                            {THEME_VARS.filter((v) => v.group === group).map((variable) => (
                              <ColorRow key={variable.key} variable={variable} version={version} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                ))}

                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Corner radius</h3>
                    <span className="font-mono text-xs text-muted-foreground">{radius.toFixed(2)}rem</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1.5}
                    step={0.05}
                    value={radius}
                    onChange={(e) => themeStore.setRadius(Number(e.target.value))}
                    className="w-full accent-[var(--primary)]"
                    aria-label="Corner radius"
                  />
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Font</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {FONTS.map((font) => (
                      <button
                        key={font.label}
                        type="button"
                        onClick={() => themeStore.setFont(font.value)}
                        style={{ fontFamily: font.value }}
                        className={cn(
                          'rounded-xl border px-3 py-2 text-sm cursor-pointer transition-colors',
                          theme.font === font.value ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40'
                        )}
                      >
                        {font.label}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <footer className="grid grid-cols-2 gap-2 border-t border-border px-5 py-4">
                <button
                  type="button"
                  onClick={() => themeStore.reset()}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold hover:bg-secondary cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" /> Reset
                </button>
                <button
                  type="button"
                  onClick={copyCss}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover cursor-pointer"
                >
                  <Copy className="h-4 w-4" /> Copy CSS
                </button>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
