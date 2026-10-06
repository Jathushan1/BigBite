import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MessageSquareWarning, Send, Star } from 'lucide-react'
import { fileComplaint, getFeedback, submitReview } from '@/api/orderApi'
import { useAsync } from '@/hooks/useAsync'
import { Button } from '@/components/ui/button'
import { Alert, Field, Select, Textarea } from '@/components/forms'
import { StatusBadge } from '@/components/StatusBadge'
import { toast } from '@/components/ui/sonner'
import { errorMessage } from '@/lib/http'
import { humanize, timeAgo } from '@/lib/format'
import { COMPLAINT_CATEGORIES } from '@/types/order'
import { RatingStars } from './RatingStars'

/** Review and complaint panel shown once an order has been handed over. */
export function OrderFeedback({ orderId, status }: { orderId: number; status: string }) {
  const { data: feedback, reload } = useAsync(() => getFeedback(orderId), [orderId, status])
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [complaintOpen, setComplaintOpen] = useState(false)
  const [category, setCategory] = useState('FOOD_QUALITY')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!feedback || (!feedback.review && !feedback.canReview && !feedback.canComplain && feedback.complaints.length === 0)) return null

  const sendReview = async () => {
    setBusy(true)
    setError('')
    try {
      await submitReview(orderId, rating, comment.trim() || undefined)
      toast.success('Thanks for the review!')
      reload()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const sendComplaint = async () => {
    setBusy(true)
    setError('')
    try {
      await fileComplaint(orderId, category, description.trim())
      toast.success('Complaint sent to the branch')
      setDescription('')
      setComplaintOpen(false)
      reload()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
      <h2 className="flex items-center gap-2 text-lg font-black"><Star className="h-5 w-5 text-warning" /> Your feedback</h2>
      {error && <Alert>{error}</Alert>}

      {feedback.review ? (
        <div className="rounded-2xl bg-secondary/60 p-4 space-y-2">
          <RatingStars value={feedback.review.rating} size="sm" />
          {feedback.review.comment && <p className="text-sm">“{feedback.review.comment}”</p>}
          <p className="text-xs text-muted-foreground">Reviewed {timeAgo(feedback.review.createdAt)}</p>
        </div>
      ) : feedback.canReview ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">How was your order?</p>
          <RatingStars value={rating} onChange={setRating} />
          <AnimatePresence>
            {rating > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 overflow-hidden">
                <Textarea rows={3} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tell us what you loved (optional)" />
                <Button onClick={sendReview} loading={busy}><Send className="h-4 w-4" /> Post review</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : null}

      {feedback.complaints.length > 0 && (
        <div className="space-y-2">
          {feedback.complaints.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">{humanize(c.category)}</span>
                <StatusBadge status={c.status === 'OPEN' ? 'PENDING' : c.status} />
              </div>
              <p className="mt-1 text-muted-foreground">{c.description}</p>
            </div>
          ))}
        </div>
      )}

      {feedback.canComplain && (
        complaintOpen ? (
          <div className="space-y-3 rounded-2xl border border-dashed border-border p-4">
            <Field label="What went wrong?">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {COMPLAINT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="Details" hint="At least 10 characters">
              <Textarea rows={3} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setComplaintOpen(false)}>Cancel</Button>
              <Button variant="destructive" loading={busy} disabled={description.trim().length < 10} onClick={sendComplaint}>Send complaint</Button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setComplaintOpen(true)}
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-destructive cursor-pointer">
            <MessageSquareWarning className="h-4 w-4" /> Report a problem with this order
          </button>
        )
      )}
    </section>
  )
}
