import { useState } from 'react'
import { rides } from '../mockData'

interface Props {
  rideId: string
  onBack: () => void
  onSubmit: () => void
}

const tags = ['Punctual', 'Clean Car', 'Safe Driver', 'Friendly', 'Good Music', 'Comfortable', 'Fast Route', 'Luggage Space']

export default function RateReviewScreen({ rideId, onBack, onSubmit }: Props) {
  const ride = rides.find((r) => r.id === rideId) || rides[0]
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!']

  const handleSubmit = () => {
    if (rating === 0) return
    setSubmitted(true)
    setTimeout(onSubmit, 1600)
  }

  if (submitted) {
    return (
      <div className="absolute inset-0 bg-white flex flex-col items-center justify-center px-8 text-center">
        <div className="text-7xl mb-5">🎉</div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Thank you!
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
          Your review helps the community choose great drivers. {ride.driver.name} will appreciate it!
        </p>
        <div className="mt-6 flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <svg key={s} width="28" height="28" viewBox="0 0 12 12" fill={s <= rating ? '#F59E0B' : '#E2E8F0'}>
              <path d="M6 1L7.5 4.5H11L8.5 7L9.5 10.5L6 8.5L2.5 10.5L3.5 7L1 4.5H4.5L6 1Z" />
            </svg>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-sr-bg flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4" style={{ paddingTop: 56, paddingBottom: 14 }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="text-lg font-extrabold text-slate-900 flex-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Rate Your Ride</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-6 pb-4 space-y-5">
        {/* Driver card */}
        <div className="bg-white rounded-3xl p-5 flex flex-col items-center text-center" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <img src={ride.driver.avatar} alt={ride.driver.name} className="w-20 h-20 rounded-3xl object-cover mb-3 border-2 border-slate-100" />
          <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{ride.driver.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
            {ride.from} → {ride.to} · {ride.date}
          </p>

          {/* Star picker */}
          <div className="flex gap-2 mt-5">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(s)}
                className="transition-transform active:scale-90"
                style={{ transform: (hovered || rating) >= s ? 'scale(1.15)' : 'scale(1)' }}
              >
                <svg width="36" height="36" viewBox="0 0 12 12" fill={(hovered || rating) >= s ? '#F59E0B' : '#E2E8F0'}>
                  <path d="M6 1L7.5 4.5H11L8.5 7L9.5 10.5L6 8.5L2.5 10.5L3.5 7L1 4.5H4.5L6 1Z" />
                </svg>
              </button>
            ))}
          </div>
          {(hovered || rating) > 0 && (
            <p className="text-sm font-bold mt-2" style={{ color: '#F59E0B', fontFamily: "'Outfit', sans-serif" }}>
              {ratingLabels[hovered || rating]}
            </p>
          )}
        </div>

        {/* Quick tags */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1" style={{ fontFamily: "'Inter', sans-serif" }}>
            What stood out? (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className="text-xs font-semibold px-3 py-2 rounded-xl border transition-all"
                style={{
                  background: selectedTags.includes(t) ? '#EFF6FF' : 'white',
                  borderColor: selectedTags.includes(t) ? '#2563EB' : '#E2E8F0',
                  color: selectedTags.includes(t) ? '#2563EB' : '#475569',
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {selectedTags.includes(t) ? '✓ ' : ''}{t}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1" style={{ fontFamily: "'Inter', sans-serif" }}>
            Write a review (optional)
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with the community..."
            rows={3}
            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-sr-blue resize-none"
            style={{ fontFamily: "'Inter', sans-serif", boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="px-4 pb-6 pt-3 bg-white border-t border-slate-100">
        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          className="w-full py-4 rounded-2xl font-bold text-base transition-all"
          style={{
            background: rating > 0 ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' : '#E2E8F0',
            color: rating > 0 ? 'white' : '#94A3B8',
            fontFamily: "'Outfit', sans-serif",
            boxShadow: rating > 0 ? '0 6px 20px rgba(37,99,235,0.35)' : 'none',
          }}
        >
          {rating === 0 ? 'Tap stars to rate' : 'Submit Review'}
        </button>
      </div>
    </div>
  )
}
