import { useSyncExternalStore } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { themeStore } from '@/theme/themeStore'

export function ThemeToggle({ className }: { className?: string }) {
  const isDark = useSyncExternalStore(themeStore.subscribe, () => themeStore.get().mode === 'dark')

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => themeStore.toggleMode()}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label="Toggle theme"
      className={className}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-warning transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-5 w-5 text-muted-foreground transition-transform duration-200 hover:-rotate-12" />
      )}
    </Button>
  )
}
