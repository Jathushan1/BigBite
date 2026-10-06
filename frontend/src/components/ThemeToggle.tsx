import { useSyncExternalStore } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getColorMode, subscribeColorMode, toggleColorMode } from '@/theme/colorMode'

export function ThemeToggle({ className }: { className?: string }) {
  const isDark = useSyncExternalStore(subscribeColorMode, () => getColorMode() === 'dark')

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleColorMode}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label="Toggle theme"
      className={className}
    >
      {isDark ? <Sun className="h-5 w-5 text-muted-foreground" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
    </Button>
  )
}
