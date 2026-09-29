import { useState } from 'react'

interface Props {
  onBack: () => void
  onPublish: () => void
}

type Mode = 'passenger' | 'driver'

const PASSENGER_STEPS = ['Route', 'Schedule', 'Preferences', 'Note', 'Review']
const DRIVER_STEPS = ['Route', 'Stops', 'Schedule', 'Preferences', 'Vehicle', 'Review']

export default function PostRideScreen({ onBack, onPublish }: Props) {
  const [mode, setMode] = useState<Mode | null>(null)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    from: '',
    to: '',
    stops: [] as string[],
    date: '',
    time: '',
    price: '',
    vehicle: '',
    instantBook: true,
    womenOnly: false,
    petsOk: false,
    ac: true,
    luggage: false,
    silentRide: false,
    notes: '',
  })

  const update = (key: keyof typeof form, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }))

  const STEPS = mode === 'passenger' ? PASSENGER_STEPS : DRIVER_STEPS

  const canNext = () => {
    if (!mode) return false
    if (step === 0) return form.from.length > 0 && form.to.length > 0
    if (mode === 'passenger') {
      if (step === 1) return form.date.length > 0 && form.time.length > 0
    } else {
      if (step === 2) return form.date.length > 0 && form.time.length > 0
      if (step === 3) return Number(form.price) > 0
      if (step === 4) return form.vehicle.length > 0
    }
    return true
  }

  // Mode selection screen
  if (!mode) {
    return (
      <div className="absolute inset-0 bg-white flex flex-col">
        <div
          className="flex items-center gap-3 px-4 border-b border-slate-100"
          style={{ paddingTop: 56, paddingBottom: 14 }}
        >
          <button onClick={onBack} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 4L6 9L11 14" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>What would you like to do?</h2>
            <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>Tell us where you want to go, or share your route</p>
          </div>
        </div>

        <div className="flex-1 px-5 py-8 flex flex-col gap-5">
          <div className="bg-blue-50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-blue-100">
            <span className="text-xl">💡</span>
            <p className="text-sm text-blue-700" style={{ fontFamily: "'Inter', sans-serif" }}>
              Tell us where you want to go, or where you're going. We'll find the right match.
            </p>
          </div>

          {/* Passenger option */}
          <button
            onClick={() => { setMode('passenger'); setStep(0) }}
            className="flex items-start gap-4 p-5 rounded-3xl border-2 border-slate-200 text-left transition-all active:scale-98 hover:border-blue-300"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' }}
            >
              🧳
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-base mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Request a Ride</div>
              <p className="text-sm text-slate-500 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                Post where you want to go. Matching drivers on the same route will see your request and can confirm.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['Route', 'Schedule', 'Preferences', 'Post Request'].map((s) => (
                  <span key={s} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">{s}</span>
                ))}
              </div>
            </div>
          </button>

          {/* Driver option */}
          <button
            onClick={() => { setMode('driver'); setStep(0) }}
            className="flex items-start gap-4 p-5 rounded-3xl border-2 border-slate-200 text-left transition-all active:scale-98 hover:border-green-300"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' }}
            >
              🚗
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-base mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Offer a Ride</div>
              <p className="text-sm text-slate-500 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
                Post your route and schedule. Passengers traveling the same way can send you a match request.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['Route', 'Stops', 'Schedule', 'Vehicle', 'Publish'].map((s) => (
                  <span key={s} className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-semibold">{s}</span>
                ))}
              </div>
            </div>
          </button>
        </div>
      </div>
    )
  }

  const isDriver = mode === 'driver'

  return (
    <div className="absolute inset-0 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 border-b border-slate-100" style={{ paddingTop: 56, paddingBottom: 14 }}>
        <button
          onClick={step === 0 ? () => setMode(null) : () => setStep(step - 1)}
          className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {isDriver ? '🚗 Offer a Ride' : '🧳 Request a Ride'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </p>
        </div>
        <button onClick={() => setMode(null)} className="text-xs text-slate-400 font-medium px-2 py-1 rounded-lg bg-slate-50">
          Change
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${((step + 1) / STEPS.length) * 100}%`,
            background: isDriver ? '#059669' : '#2563EB',
          }}
        />
      </div>

      {/* Step pills */}
      <div className="flex items-center px-4 pt-4 pb-3 gap-1.5 overflow-x-auto hide-scrollbar">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => i < step && setStep(i)}
            className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full transition-all"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background: i === step ? (isDriver ? '#059669' : '#2563EB') : i < step ? '#D1FAE5' : '#F1F5F9',
              color: i === step ? 'white' : i < step ? '#059669' : '#94A3B8',
            }}
          >
            {i < step ? '✓' : `${i + 1}.`} {s}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-3">
        {step === 0 && <StepRoute form={form} update={update} isDriver={isDriver} />}
        {isDriver && step === 1 && <StepStops form={form} update={update} />}
        {(isDriver ? step === 2 : step === 1) && <StepSchedule form={form} update={update} isDriver={isDriver} />}
        {(isDriver ? step === 3 : step === 2) && <StepPreferences form={form} update={update} isDriver={isDriver} />}
        {isDriver && step === 4 && <StepVehicle form={form} update={update} />}
        {(isDriver ? step === 5 : step === 3) && step < STEPS.length - 1 && <StepNote form={form} update={update} />}
        {step === STEPS.length - 1 && <StepReview form={form} isDriver={isDriver} />}
      </div>

      {/* Next button */}
      <div className="px-5 pb-8 pt-3 border-t border-slate-100">
        <button
          onClick={() => {
            if (step < STEPS.length - 1) setStep(step + 1)
            else onPublish()
          }}
          disabled={!canNext()}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-base transition-all active:scale-95 disabled:opacity-40"
          style={{
            background: step === STEPS.length - 1
              ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              : isDriver
                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            fontFamily: "'Outfit', sans-serif",
            boxShadow: step === STEPS.length - 1 ? '0 6px 20px rgba(5,150,105,0.35)' : '0 6px 20px rgba(37,99,235,0.35)',
          }}
        >
          {step === STEPS.length - 1
            ? (isDriver ? '🚀 Publish Ride' : '📩 Post Ride Request')
            : 'Continue →'}
        </button>
      </div>
    </div>
  )
}

type FormState = {
  from: string; to: string; stops: string[]; date: string; time: string;
  price: string; vehicle: string; instantBook: boolean;
  womenOnly: boolean; petsOk: boolean; ac: boolean; luggage: boolean; silentRide: boolean; notes: string;
}
type UpdateFn = (key: keyof FormState, value: unknown) => void

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {children}
    </label>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-sr-blue focus:ring-2 focus:ring-sr-blue-soft transition-all"
      style={{ fontFamily: "'Inter', sans-serif" }}
    />
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between py-3 border-b border-slate-50 cursor-pointer">
      <span className="text-sm text-slate-700" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
        style={{ background: checked ? '#2563EB' : '#CBD5E1' }}
      >
        <div
          className="w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all"
          style={{ left: checked ? '1.375rem' : '0.125rem' }}
        />
      </button>
    </label>
  )
}

function StepRoute({ form, update, isDriver }: { form: FormState; update: UpdateFn; isDriver: boolean }) {
  const popularRoutes = isDriver
    ? [['Madhapur', 'Gachibowli'], ['Kondapur', 'HITEC City'], ['Secunderabad', 'Financial District']]
    : [['Gachibowli', 'Madhapur'], ['HITEC City', 'Kondapur'], ['Jubilee Hills', 'Ameerpet']]

  return (
    <div className="space-y-5">
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ background: isDriver ? '#ECFDF5' : '#EFF6FF', border: `1px solid ${isDriver ? '#A7F3D0' : '#BFDBFE'}` }}
      >
        <span className="text-2xl">{isDriver ? '🗺️' : '📍'}</span>
        <p className="text-sm font-medium" style={{ fontFamily: "'Inter', sans-serif", color: isDriver ? '#065F46' : '#1E40AF' }}>
          {isDriver
            ? 'Set your pickup and destination so passengers on the same route can find you.'
            : 'Tell us where you want to go and we will find matching drivers for you.'}
        </p>
      </div>

      <div>
        <FieldLabel>From (Pickup)</FieldLabel>
        <TextInput value={form.from} onChange={(v) => update('from', v)} placeholder="e.g. Madhapur, Hyderabad" />
      </div>

      <div className="flex justify-center">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">↕</div>
      </div>

      <div>
        <FieldLabel>To (Destination)</FieldLabel>
        <TextInput value={form.to} onChange={(v) => update('to', v)} placeholder="e.g. Gachibowli, Hyderabad" />
      </div>

      <div>
        <FieldLabel>Popular Routes</FieldLabel>
        <div className="space-y-2">
          {popularRoutes.map(([f, t]) => (
            <button
              key={f}
              onClick={() => { update('from', f); update('to', t) }}
              className="w-full flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-700 text-left hover:bg-slate-100 transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <span className="text-base">🕐</span>
              <span>{f} → {t}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepStops({ form, update }: { form: FormState; update: UpdateFn }) {
  const [stopInput, setStopInput] = useState('')
  return (
    <div className="space-y-5">
      <div className="bg-amber-50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-amber-100">
        <span className="text-2xl">📍</span>
        <p className="text-sm text-amber-700 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
          Optional: Add intermediate stops to pick up more passengers along the way.
        </p>
      </div>

      {form.stops.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 flex items-center gap-2">
            <span className="text-amber-500">📍</span> {s}
          </div>
          <button
            onClick={() => update('stops', form.stops.filter((_, j) => j !== i))}
            className="w-8 h-8 rounded-xl bg-red-50 text-sr-red flex items-center justify-center"
          >✕</button>
        </div>
      ))}

      <div className="flex gap-2">
        <input
          type="text"
          value={stopInput}
          onChange={(e) => setStopInput(e.target.value)}
          placeholder="e.g. Ameerpet, Begumpet..."
          className="flex-1 border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm outline-none focus:border-sr-blue transition-all"
          style={{ fontFamily: "'Inter', sans-serif" }}
        />
        <button
          onClick={() => { if (stopInput) { update('stops', [...form.stops, stopInput]); setStopInput('') } }}
          className="w-11 h-11 bg-sr-blue rounded-xl flex items-center justify-center text-white font-bold text-xl"
        >+</button>
      </div>

      <p className="text-xs text-slate-400 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        Skip this step if you don't have any intermediate stops
      </p>
    </div>
  )
}

function StepSchedule({ form, update, isDriver }: { form: FormState; update: UpdateFn; isDriver: boolean }) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>{isDriver ? 'Departure Date' : 'Travel Date'}</FieldLabel>
        <input
          type="date"
          value={form.date}
          onChange={(e) => update('date', e.target.value)}
          className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-sr-blue transition-all"
          style={{ fontFamily: "'Inter', sans-serif" }}
        />
      </div>
      <div>
        <FieldLabel>{isDriver ? 'Departure Time' : 'Preferred Time'}</FieldLabel>
        <input
          type="time"
          value={form.time}
          onChange={(e) => update('time', e.target.value)}
          className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-sr-blue transition-all"
          style={{ fontFamily: "'Inter', sans-serif" }}
        />
      </div>

      <div>
        <FieldLabel>Quick Select</FieldLabel>
        <div className="flex gap-2 flex-wrap">
          {['Today', 'Tomorrow', 'Sat, 22 Aug', 'Sun, 23 Aug'].map((d) => (
            <button
              key={d}
              onClick={() => update('date', d)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
              style={{
                fontFamily: "'Outfit', sans-serif",
                background: form.date === d ? '#2563EB' : 'white',
                color: form.date === d ? 'white' : '#475569',
                borderColor: form.date === d ? '#2563EB' : '#E2E8F0',
              }}
            >{d}</button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Common Times</FieldLabel>
        <div className="grid grid-cols-4 gap-2">
          {['07:00', '07:30', '08:00', '09:00', '10:00', '12:00', '17:00', '19:00'].map((t) => (
            <button
              key={t}
              onClick={() => update('time', t)}
              className="py-2 rounded-xl text-xs font-semibold border transition-all"
              style={{
                fontFamily: "'Outfit', sans-serif",
                background: form.time === t ? '#2563EB' : 'white',
                color: form.time === t ? 'white' : '#475569',
                borderColor: form.time === t ? '#2563EB' : '#E2E8F0',
              }}
            >{t}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepPreferences({ form, update, isDriver }: { form: FormState; update: UpdateFn; isDriver: boolean }) {
  return (
    <div className="space-y-6">
      {isDriver && (
        <div>
          <FieldLabel>Price Per Person (₹)</FieldLabel>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-lg">₹</span>
            <input
              type="number"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              placeholder="0"
              className="w-full border border-slate-200 bg-slate-50 rounded-xl pl-10 pr-4 py-3 text-xl font-bold text-slate-900 outline-none focus:border-sr-blue transition-all"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            />
          </div>
          <div className="flex gap-2 mt-2">
            {['80', '120', '150', '200'].map((p) => (
              <button
                key={p}
                onClick={() => update('price', p)}
                className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  background: form.price === p ? '#2563EB' : 'white',
                  color: form.price === p ? 'white' : '#475569',
                  borderColor: form.price === p ? '#2563EB' : '#E2E8F0',
                }}
              >₹{p}</button>
            ))}
          </div>
        </div>
      )}

      <div>
        <FieldLabel>Preferences</FieldLabel>
        {isDriver ? (
          <>
            <Toggle checked={form.instantBook} onChange={(v) => update('instantBook', v)} label="⚡ Instant match (auto-confirm requests)" />
            <Toggle checked={form.womenOnly} onChange={(v) => update('womenOnly', v)} label="👩 Women passengers only" />
            <Toggle checked={form.ac} onChange={(v) => update('ac', v)} label="❄️ AC available" />
            <Toggle checked={form.petsOk} onChange={(v) => update('petsOk', v)} label="🐾 Pets allowed (in carrier)" />
            <Toggle checked={form.luggage} onChange={(v) => update('luggage', v)} label="🧳 Luggage space available" />
          </>
        ) : (
          <>
            <Toggle checked={form.womenOnly} onChange={(v) => update('womenOnly', v)} label="👩 Women driver preferred" />
            <Toggle checked={form.ac} onChange={(v) => update('ac', v)} label="❄️ AC preferred" />
            <Toggle checked={form.silentRide} onChange={(v) => update('silentRide', v)} label="🤫 Silent ride preferred" />
            <Toggle checked={form.petsOk} onChange={(v) => update('petsOk', v)} label="🐾 Travelling with a pet" />
            <Toggle checked={form.luggage} onChange={(v) => update('luggage', v)} label="🧳 Need luggage space" />
          </>
        )}
      </div>
    </div>
  )
}

function StepVehicle({ form, update }: { form: FormState; update: UpdateFn }) {
  const vehicles = [
    { id: 'v1', name: 'Honda City ZX', type: 'Sedan', year: '2022', fuel: 'Petrol', verified: true },
    { id: 'v2', name: 'Maruti Swift Dzire', type: 'Sedan', year: '2021', fuel: 'CNG', verified: true },
  ]

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-blue-100">
        <span className="text-2xl">🚗</span>
        <p className="text-sm text-blue-700 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
          Choose which vehicle you're driving for this ride.
        </p>
      </div>

      {vehicles.map((v) => (
        <button
          key={v.id}
          onClick={() => update('vehicle', v.id)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left"
          style={{ borderColor: form.vehicle === v.id ? '#2563EB' : '#E2E8F0', background: form.vehicle === v.id ? '#EFF6FF' : 'white' }}
        >
          <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">🚗</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>{v.name}</span>
              {v.verified && (
                <span className="text-[9px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-semibold border border-green-100">✓ Verified</span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{v.type} · {v.year} · {v.fuel}</div>
          </div>
          <div
            className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
            style={{ borderColor: form.vehicle === v.id ? '#2563EB' : '#CBD5E1', background: form.vehicle === v.id ? '#2563EB' : 'white' }}
          >
            {form.vehicle === v.id && <div className="w-2 h-2 bg-white rounded-full" />}
          </div>
        </button>
      ))}

      <button className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-sr-blue hover:text-sr-blue transition-all">
        <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-2xl">+</div>
        <span className="text-sm font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Add a new vehicle</span>
      </button>
    </div>
  )
}

function StepNote({ form, update }: { form: FormState; update: UpdateFn }) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-2xl px-4 py-3 flex items-center gap-3 border border-slate-100">
        <span className="text-2xl">📝</span>
        <p className="text-sm text-slate-600" style={{ fontFamily: "'Inter', sans-serif" }}>
          Optional: Add a note for the driver or passenger about pickup details, luggage, or anything else.
        </p>
      </div>
      <textarea
        value={form.notes}
        onChange={(e) => update('notes', e.target.value)}
        placeholder="e.g. I'll be waiting near the main gate. Can carry one medium bag."
        rows={5}
        className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-sr-blue transition-all resize-none"
        style={{ fontFamily: "'Inter', sans-serif" }}
      />
      <p className="text-xs text-slate-400 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        This note will be visible to matched drivers/passengers
      </p>
    </div>
  )
}

function StepReview({ form, isDriver }: { form: FormState; isDriver: boolean }) {
  const rows = isDriver
    ? [
        { label: 'Route', value: `${form.from || 'Madhapur'} → ${form.to || 'Gachibowli'}` },
        { label: 'Stops', value: form.stops.length > 0 ? form.stops.join(', ') : 'None' },
        { label: 'Date & Time', value: `${form.date || 'Tomorrow'} at ${form.time || '08:00 AM'}` },
        { label: 'Price Per Person', value: form.price ? `₹${form.price}` : 'Not set' },
        { label: 'Vehicle', value: form.vehicle ? 'Honda City ZX (2022)' : 'Not selected' },
        { label: 'Instant Match', value: form.instantBook ? 'Yes' : 'Requires approval' },
      ]
    : [
        { label: 'Route', value: `${form.from || 'Gachibowli'} → ${form.to || 'Madhapur'}` },
        { label: 'Date & Time', value: `${form.date || 'Tomorrow'} at ${form.time || '08:30 AM'}` },
        { label: 'AC Preferred', value: form.ac ? 'Yes' : 'No' },
        { label: 'Women Driver', value: form.womenOnly ? 'Yes' : 'No preference' },
        { label: 'Note', value: form.notes || 'None' },
      ]

  return (
    <div className="space-y-4">
      <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
        <span className="text-2xl">✅</span>
        <p className="text-sm text-green-700 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
          {isDriver ? "Review and publish your offered ride." : "Review and post your ride request."}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0">
            <span className="text-xs text-slate-500 font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>{label}</span>
            <span className="text-sm font-semibold text-slate-800 text-right max-w-[60%]" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</span>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
        <p className="text-xs text-blue-600 leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
          {isDriver
            ? '📢 Your ride will be visible to passengers on matching routes immediately after publishing.'
            : '📢 Your request will be visible to matching drivers. You will be notified when a driver sends a match.'}
        </p>
      </div>
    </div>
  )
}
