import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ExternalLink, Inbox, Mail, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import { Alert } from '@/components/forms'
import { clearOutboxApi, getOutboxApi, type OutboxMessage } from '@/services/api'
import { errorMessage } from '@/lib/http'
import { timeAgo } from '@/lib/format'

/** Demo mailbox backed by the backend's mock email sender (app.mail.mock=true). */
export function DevOutboxPage() {
  const [messages, setMessages] = useState<OutboxMessage[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setMessages(await getOutboxApi())
      setError('')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 4000)
    return () => clearInterval(id)
  }, [load])

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Inbox className="h-5 w-5" /></span>
          <div>
            <h1 className="text-2xl font-black">Demo mailbox</h1>
            <p className="text-sm text-muted-foreground">Emails the backend would have sent. Refreshes automatically.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</Button>
          <Button variant="outline" size="sm" onClick={async () => { await clearOutboxApi(); load() }}>
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>
      {error && <Alert>{error}</Alert>}
      {!loading && messages.length === 0 && !error && (
        <EmptyState icon={Mail} title="No emails yet" description="Use “Forgot password?” on the sign-in page and the email lands here."
          action={{ label: 'Forgot password', to: '/forgot-password' }} />
      )}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.article
              key={message.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-bold">{message.subject}</h2>
                <span className="text-xs text-muted-foreground">{timeAgo(message.sentAt)}</span>
              </div>
              <p className="text-xs text-muted-foreground">To: <span className="font-semibold text-foreground">{message.to}</span></p>
              <p className="whitespace-pre-line text-sm text-foreground/90">{message.body}</p>
              {message.actionUrl && (
                <Link to={new URL(message.actionUrl).pathname + new URL(message.actionUrl).search}>
                  <Button size="sm" variant="glow"><ExternalLink className="h-4 w-4" /> Open link</Button>
                </Link>
              )}
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
