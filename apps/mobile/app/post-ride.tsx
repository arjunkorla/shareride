import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Vehicle } from '@shareride/types'
import { ChevronLeftIcon } from '../components/icons'
import { colors, radii } from '../lib/theme'
import { api } from '../lib/api'
import { resolveCoordinates } from '../lib/geocoding'
import { addOneHour, toPreferredDateISO, toTime24 } from '../lib/schedule'

type Mode = 'passenger' | 'driver'

const PASSENGER_STEPS = ['Route', 'Schedule', 'Preferences', 'Note', 'Review']
const DRIVER_STEPS = ['Route', 'Stops', 'Schedule', 'Preferences', 'Vehicle', 'Review']

const PASSENGER_POPULAR_ROUTES: [string, string][] = [
  ['Gachibowli', 'Madhapur'],
  ['HITEC City', 'Kondapur'],
  ['Jubilee Hills', 'Ameerpet'],
]
const DRIVER_POPULAR_ROUTES: [string, string][] = [
  ['Madhapur', 'Gachibowli'],
  ['Kondapur', 'HITEC City'],
  ['Secunderabad', 'Financial District'],
]

const DATE_QUICK_OPTIONS = ['Today', 'Tomorrow']
const TIME_QUICK_OPTIONS = ['07:00 AM', '07:30 AM', '08:00 AM', '09:00 AM', '10:00 AM', '12:00 PM', '05:00 PM', '07:00 PM']
const PRICE_QUICK_OPTIONS = ['80', '120', '150', '200']

const NEW_VEHICLE_FORM = { make: '', model: '', year: '', color: '', registrationNumber: '' }

interface WizardForm {
  from: string
  to: string
  stops: string[]
  date: string
  time: string
  pricePerPerson: string
  vehicleId: string
  autoConfirm: boolean
  womenOnly: boolean
  petsOk: boolean
  acAvailable: boolean
  luggageSpace: boolean
  silentRide: boolean
  notes: string
}

const initialForm: WizardForm = {
  from: '',
  to: '',
  stops: [],
  date: '',
  time: '',
  pricePerPerson: '',
  vehicleId: '',
  autoConfirm: true,
  womenOnly: false,
  petsOk: false,
  acAvailable: true,
  luggageSpace: false,
  silentRide: false,
  notes: '',
}

type UpdateFn = <K extends keyof WizardForm>(key: K, value: WizardForm[K]) => void

// Ported from src/screens/PostRideScreen.tsx's two-mode wizard. There is no
// seat field anywhere in this form — a driver posts a RideOffer priced by
// pricePerPerson (flat, per match), a passenger posts a RideRequest with no
// price at all. RN has no native date/time input, so the Schedule step
// uses free-text fields plus quick-select pills, mirroring the pattern in
// components/DateTimeFields.tsx.
export default function PostRideScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<Mode | null>(null)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<WizardForm>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const update: UpdateFn = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const isDriver = mode === 'driver'
  const steps = isDriver ? DRIVER_STEPS : PASSENGER_STEPS

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.vehicles.list(),
    enabled: isDriver,
  })
  const addVehicleMutation = useMutation({
    mutationFn: (input: { make: string; model: string; year: number; color: string; registrationNumber: string; fuelType: Vehicle['fuelType']; ac: boolean }) =>
      api.vehicles.create(input),
    onSuccess: (vehicle) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      update('vehicleId', vehicle.id)
    },
  })

  const canNext = () => {
    if (!mode) return false
    if (step === 0) return form.from.length > 0 && form.to.length > 0
    if (isDriver) {
      if (step === 2) return form.date.length > 0 && form.time.length > 0
      if (step === 3) return Number(form.pricePerPerson) > 0
      if (step === 4) return form.vehicleId.length > 0
    } else {
      if (step === 1) return form.date.length > 0 && form.time.length > 0
    }
    return true
  }

  const selectMode = (m: Mode) => {
    setMode(m)
    setStep(0)
  }

  const goBack = () => {
    if (step === 0) {
      setMode(null)
    } else {
      setStep((s) => s - 1)
    }
  }

  const goNext = async () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1)
      return
    }
    setSubmitError(null)
    setSubmitting(true)
    try {
      if (isDriver) {
        await api.rideOffers.create({
          vehicleId: form.vehicleId,
          origin: form.from,
          destination: form.to,
          originCoordinates: resolveCoordinates(form.from),
          destinationCoordinates: resolveCoordinates(form.to),
          departureDate: toPreferredDateISO(form.date),
          departureTime: toTime24(form.time),
          stops: form.stops,
          pricePerPerson: Number(form.pricePerPerson),
          preferences: {
            womenOnly: form.womenOnly,
            acPreferred: form.acAvailable,
            petsOk: form.petsOk,
            luggageSpace: form.luggageSpace,
            autoConfirm: form.autoConfirm,
          },
          notes: form.notes || undefined,
        })
      } else {
        const preferredTimeStart = toTime24(form.time)
        await api.rideRequests.create({
          origin: form.from,
          destination: form.to,
          originCoordinates: resolveCoordinates(form.from),
          destinationCoordinates: resolveCoordinates(form.to),
          preferredDate: toPreferredDateISO(form.date),
          preferredTimeStart,
          preferredTimeEnd: addOneHour(preferredTimeStart),
          preferences: {
            womenOnly: form.womenOnly,
            acPreferred: form.acAvailable,
            petsOk: form.petsOk,
            luggageSpace: form.luggageSpace,
            silentRide: form.silentRide,
          },
          notes: form.notes || undefined,
        })
      }
      router.push('/success?type=published')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : `Could not ${isDriver ? 'publish your ride' : 'post your request'}. Please try again.`)
    } finally {
      setSubmitting(false)
    }
  }

  if (!mode) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeftIcon />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>What would you like to do?</Text>
            <Text style={styles.headerSub}>Tell us where you want to go, or share your route</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.modeContainer}>
          <View style={styles.tipBox}>
            <Text style={{ fontSize: 20 }}>💡</Text>
            <Text style={styles.tipText}>Tell us where you want to go, or where you're going. We'll find the right match.</Text>
          </View>

          <Pressable style={styles.modeCard} onPress={() => selectMode('passenger')}>
            <View style={[styles.modeIconWrap, { backgroundColor: colors.blueSoft }]}>
              <Text style={{ fontSize: 28 }}>🧳</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modeCardTitle}>Request a Ride</Text>
              <Text style={styles.modeCardBody}>
                Post where you want to go. Matching drivers on the same route will see your request and can confirm.
              </Text>
              <View style={styles.modeStepsRow}>
                {['Route', 'Schedule', 'Preferences', 'Post Request'].map((s) => (
                  <View key={s} style={styles.modeStepChipBlue}><Text style={styles.modeStepChipTextBlue}>{s}</Text></View>
                ))}
              </View>
            </View>
          </Pressable>

          <Pressable style={styles.modeCard} onPress={() => selectMode('driver')}>
            <View style={[styles.modeIconWrap, { backgroundColor: colors.greenSoft }]}>
              <Text style={{ fontSize: 28 }}>🚗</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modeCardTitle}>Offer a Ride</Text>
              <Text style={styles.modeCardBody}>
                Post your route and schedule. Passengers traveling the same way can send you a match request.
              </Text>
              <View style={styles.modeStepsRow}>
                {['Route', 'Stops', 'Schedule', 'Vehicle', 'Publish'].map((s) => (
                  <View key={s} style={styles.modeStepChipGreen}><Text style={styles.modeStepChipTextGreen}>{s}</Text></View>
                ))}
              </View>
            </View>
          </Pressable>
        </ScrollView>
      </View>
    )
  }

  const passengerStepIndex = { route: 0, schedule: 1, preferences: 2, note: 3, review: 4 }
  const driverStepIndex = { route: 0, stops: 1, schedule: 2, preferences: 3, vehicle: 4, review: 5 }
  const idx = isDriver ? driverStepIndex : passengerStepIndex

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={goBack}>
          <ChevronLeftIcon />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{isDriver ? '🚗 Offer a Ride' : '🧳 Request a Ride'}</Text>
          <Text style={styles.headerSub}>Step {step + 1} of {steps.length} · {steps[step]}</Text>
        </View>
        <Pressable style={styles.changeButton} onPress={() => setMode(null)}>
          <Text style={styles.changeButtonText}>Change</Text>
        </Pressable>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((step + 1) / steps.length) * 100}%`, backgroundColor: isDriver ? colors.green : colors.blue }]} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stepPillsRow}>
        {steps.map((s, i) => (
          <Pressable
            key={s}
            style={[
              styles.stepPill,
              i === step && { backgroundColor: isDriver ? colors.green : colors.blue },
              i < step && styles.stepPillDone,
            ]}
            onPress={() => i < step && setStep(i)}
          >
            <Text style={[
              styles.stepPillText,
              i === step && styles.stepPillTextActive,
              i < step && styles.stepPillTextDone,
            ]}>
              {i < step ? '✓' : `${i + 1}.`} {s}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.stepContent}>
        {step === idx.route && <StepRoute form={form} update={update} isDriver={isDriver} />}
        {isDriver && step === (idx as typeof driverStepIndex).stops && <StepStops form={form} update={update} />}
        {step === idx.schedule && <StepSchedule form={form} update={update} isDriver={isDriver} />}
        {step === idx.preferences && <StepPreferences form={form} update={update} isDriver={isDriver} />}
        {isDriver && step === (idx as typeof driverStepIndex).vehicle && (
          <StepVehicle form={form} update={update} vehiclesQuery={vehiclesQuery} addVehicleMutation={addVehicleMutation} />
        )}
        {!isDriver && step === (idx as typeof passengerStepIndex).note && <StepNote form={form} update={update} />}
        {step === idx.review && <StepReview form={form} isDriver={isDriver} vehicles={vehiclesQuery.data ?? []} />}
      </ScrollView>

      <View style={styles.footer}>
        {submitError && <Text style={styles.submitError}>{submitError}</Text>}
        <Pressable
          style={[styles.nextButton, { backgroundColor: step === steps.length - 1 ? colors.green : (isDriver ? colors.green : colors.blue) }, (!canNext() || submitting) && styles.nextButtonDisabled]}
          disabled={!canNext() || submitting}
          onPress={goNext}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.nextButtonText}>
              {step === steps.length - 1 ? (isDriver ? '🚀 Publish Ride' : '📩 Post Ride Request') : 'Continue →'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.fieldLabel}>{children}</Text>
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable style={styles.toggleRow} onPress={() => onChange(!checked)}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggleTrack, checked && styles.toggleTrackActive]}>
        <View style={[styles.toggleThumb, checked && styles.toggleThumbActive]} />
      </View>
    </Pressable>
  )
}

function StepRoute({ form, update, isDriver }: { form: WizardForm; update: UpdateFn; isDriver: boolean }) {
  const popularRoutes = isDriver ? DRIVER_POPULAR_ROUTES : PASSENGER_POPULAR_ROUTES

  return (
    <View style={{ gap: 20 }}>
      <View style={[styles.infoBanner, { backgroundColor: isDriver ? colors.greenSoft : colors.blueSoft, borderColor: isDriver ? colors.greenBorder : colors.blueBorder }]}>
        <Text style={{ fontSize: 22 }}>{isDriver ? '🗺️' : '📍'}</Text>
        <Text style={[styles.infoBannerText, { color: isDriver ? colors.greenDark : colors.blueDark }]}>
          {isDriver
            ? 'Set your pickup and destination so passengers on the same route can find you.'
            : 'Tell us where you want to go and we will find matching drivers for you.'}
        </Text>
      </View>

      <View>
        <FieldLabel>From (Pickup)</FieldLabel>
        <TextInput
          value={form.from}
          onChangeText={(v) => update('from', v)}
          placeholder="e.g. Madhapur, Hyderabad"
          style={styles.textInput}
          placeholderTextColor={colors.slate400}
        />
      </View>

      <View>
        <FieldLabel>To (Destination)</FieldLabel>
        <TextInput
          value={form.to}
          onChangeText={(v) => update('to', v)}
          placeholder="e.g. Gachibowli, Hyderabad"
          style={styles.textInput}
          placeholderTextColor={colors.slate400}
        />
      </View>

      <View>
        <FieldLabel>Popular Routes</FieldLabel>
        <View style={{ gap: 8 }}>
          {popularRoutes.map(([f, t]) => (
            <Pressable key={f + t} style={styles.popularRouteRow} onPress={() => { update('from', f); update('to', t) }}>
              <Text style={{ fontSize: 15 }}>🕐</Text>
              <Text style={styles.popularRouteText}>{f} → {t}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  )
}

function StepStops({ form, update }: { form: WizardForm; update: UpdateFn }) {
  const [stopInput, setStopInput] = useState('')
  return (
    <View style={{ gap: 20 }}>
      <View style={[styles.infoBanner, { backgroundColor: colors.amberSoft, borderColor: '#FDE68A' }]}>
        <Text style={{ fontSize: 22 }}>📍</Text>
        <Text style={[styles.infoBannerText, { color: colors.amber }]}>
          Optional: Add intermediate stops to pick up more passengers along the way.
        </Text>
      </View>

      {form.stops.map((s, i) => (
        <View key={`${s}-${i}`} style={styles.stopRow}>
          <View style={styles.stopBox}>
            <Text style={styles.stopBoxText}>📍 {s}</Text>
          </View>
          <Pressable style={styles.removeStopButton} onPress={() => update('stops', form.stops.filter((_, j) => j !== i))}>
            <Text style={{ color: colors.red, fontWeight: '700' }}>✕</Text>
          </Pressable>
        </View>
      ))}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={stopInput}
          onChangeText={setStopInput}
          placeholder="e.g. Ameerpet, Begumpet..."
          style={[styles.textInput, { flex: 1 }]}
          placeholderTextColor={colors.slate400}
        />
        <Pressable
          style={styles.addStopButton}
          onPress={() => { if (stopInput) { update('stops', [...form.stops, stopInput]); setStopInput('') } }}
        >
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 20 }}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.hintText}>Skip this step if you don't have any intermediate stops</Text>
    </View>
  )
}

function StepSchedule({ form, update, isDriver }: { form: WizardForm; update: UpdateFn; isDriver: boolean }) {
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [showCustomTime, setShowCustomTime] = useState(false)
  const isCustomDate = form.date.length > 0 && !DATE_QUICK_OPTIONS.includes(form.date)
  const isCustomTime = form.time.length > 0 && !TIME_QUICK_OPTIONS.includes(form.time)

  return (
    <View style={{ gap: 20 }}>
      <View>
        <FieldLabel>{isDriver ? 'Departure Date' : 'Travel Date'}</FieldLabel>
        <View style={styles.pillRow}>
          {DATE_QUICK_OPTIONS.map((d) => (
            <Pressable key={d} style={[styles.pill, form.date === d && styles.pillActive]} onPress={() => { update('date', d); setShowCustomDate(false) }}>
              <Text style={[styles.pillText, form.date === d && styles.pillTextActive]}>{d}</Text>
            </Pressable>
          ))}
          <Pressable style={[styles.pill, (isCustomDate || showCustomDate) && styles.pillActive]} onPress={() => setShowCustomDate((v) => !v)}>
            <Text style={[styles.pillText, (isCustomDate || showCustomDate) && styles.pillTextActive]}>
              📅 {isCustomDate ? form.date : 'Custom Date'}
            </Text>
          </Pressable>
        </View>
        {showCustomDate && (
          <TextInput
            autoFocus
            placeholder="e.g. Sat, 22 Aug"
            style={[styles.textInput, { marginTop: 8 }]}
            placeholderTextColor={colors.slate400}
            onSubmitEditing={(e) => {
              if (!e.nativeEvent.text) return
              update('date', e.nativeEvent.text)
              setShowCustomDate(false)
            }}
          />
        )}
      </View>

      <View>
        <FieldLabel>{isDriver ? 'Departure Time' : 'Preferred Time'}</FieldLabel>
        <View style={styles.timeGrid}>
          {TIME_QUICK_OPTIONS.map((t) => (
            <Pressable key={t} style={[styles.timeChip, form.time === t && styles.timeChipActive]} onPress={() => { update('time', t); setShowCustomTime(false) }}>
              <Text style={[styles.timeChipText, form.time === t && styles.timeChipTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={[styles.pill, { marginTop: 8, alignSelf: 'flex-start' }, (isCustomTime || showCustomTime) && styles.pillActive]} onPress={() => setShowCustomTime((v) => !v)}>
          <Text style={[styles.pillText, (isCustomTime || showCustomTime) && styles.pillTextActive]}>
            🕐 {isCustomTime ? form.time : 'Specific Time'}
          </Text>
        </Pressable>
        {showCustomTime && (
          <TextInput
            autoFocus
            placeholder="e.g. 7:15 PM"
            style={[styles.textInput, { marginTop: 8 }]}
            placeholderTextColor={colors.slate400}
            onSubmitEditing={(e) => {
              if (!e.nativeEvent.text) return
              update('time', e.nativeEvent.text)
              setShowCustomTime(false)
            }}
          />
        )}
      </View>
    </View>
  )
}

function StepPreferences({ form, update, isDriver }: { form: WizardForm; update: UpdateFn; isDriver: boolean }) {
  return (
    <View style={{ gap: 24 }}>
      {isDriver && (
        <View>
          <FieldLabel>Price Per Person (₹)</FieldLabel>
          <TextInput
            value={form.pricePerPerson}
            onChangeText={(v) => update('pricePerPerson', v)}
            placeholder="0"
            keyboardType="number-pad"
            style={[styles.textInput, styles.priceInput]}
            placeholderTextColor={colors.slate400}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {PRICE_QUICK_OPTIONS.map((p) => (
              <Pressable key={p} style={[styles.priceChip, form.pricePerPerson === p && styles.priceChipActive]} onPress={() => update('pricePerPerson', p)}>
                <Text style={[styles.priceChipText, form.pricePerPerson === p && styles.priceChipTextActive]}>₹{p}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View>
        <FieldLabel>Preferences</FieldLabel>
        {isDriver ? (
          <>
            <Toggle checked={form.autoConfirm} onChange={(v) => update('autoConfirm', v)} label="⚡ Auto-confirm requests" />
            <Toggle checked={form.womenOnly} onChange={(v) => update('womenOnly', v)} label="👩 Women passengers only" />
            <Toggle checked={form.acAvailable} onChange={(v) => update('acAvailable', v)} label="❄️ AC available" />
            <Toggle checked={form.petsOk} onChange={(v) => update('petsOk', v)} label="🐾 Pets allowed (in carrier)" />
            <Toggle checked={form.luggageSpace} onChange={(v) => update('luggageSpace', v)} label="🧳 Luggage space available" />
          </>
        ) : (
          <>
            <Toggle checked={form.womenOnly} onChange={(v) => update('womenOnly', v)} label="👩 Women driver preferred" />
            <Toggle checked={form.acAvailable} onChange={(v) => update('acAvailable', v)} label="❄️ AC preferred" />
            <Toggle checked={form.silentRide} onChange={(v) => update('silentRide', v)} label="🤫 Silent ride preferred" />
            <Toggle checked={form.petsOk} onChange={(v) => update('petsOk', v)} label="🐾 Travelling with a pet" />
            <Toggle checked={form.luggageSpace} onChange={(v) => update('luggageSpace', v)} label="🧳 Need luggage space" />
          </>
        )}
      </View>
    </View>
  )
}

interface VehiclesQuery {
  data?: Vehicle[]
  isLoading: boolean
  isError: boolean
}
interface AddVehicleMutation {
  mutate: (input: { make: string; model: string; year: number; color: string; registrationNumber: string; fuelType: Vehicle['fuelType']; ac: boolean }) => void
  isPending: boolean
  isError: boolean
}

function StepVehicle({ form, update, vehiclesQuery, addVehicleMutation }: {
  form: WizardForm
  update: UpdateFn
  vehiclesQuery: VehiclesQuery
  addVehicleMutation: AddVehicleMutation
}) {
  const [adding, setAdding] = useState(false)
  const [newVehicle, setNewVehicle] = useState(NEW_VEHICLE_FORM)
  const vehicles = vehiclesQuery.data ?? []

  const canSubmitVehicle = newVehicle.make && newVehicle.model && newVehicle.year && newVehicle.color && newVehicle.registrationNumber

  const submitVehicle = () => {
    if (!canSubmitVehicle) return
    addVehicleMutation.mutate({
      make: newVehicle.make,
      model: newVehicle.model,
      year: Number(newVehicle.year),
      color: newVehicle.color,
      registrationNumber: newVehicle.registrationNumber,
      fuelType: 'PETROL',
      ac: true,
    })
    setNewVehicle(NEW_VEHICLE_FORM)
    setAdding(false)
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.infoBanner, { backgroundColor: colors.blueSoft, borderColor: colors.blueBorder }]}>
        <Text style={{ fontSize: 22 }}>🚗</Text>
        <Text style={[styles.infoBannerText, { color: colors.blueDark }]}>Choose which vehicle you're driving for this ride.</Text>
      </View>

      {vehiclesQuery.isLoading && <ActivityIndicator color={colors.blue} />}
      {vehiclesQuery.isError && (
        <Text style={styles.hintText}>Couldn't load your vehicles. Check your connection and try again.</Text>
      )}

      {vehicles.map((v) => (
        <Pressable
          key={v.id}
          style={[styles.vehicleOption, form.vehicleId === v.id && styles.vehicleOptionActive]}
          onPress={() => update('vehicleId', v.id)}
        >
          <View style={styles.vehicleOptionIcon}><Text style={{ fontSize: 26 }}>🚗</Text></View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.vehicleOptionName}>{v.make} {v.model}</Text>
              {v.verificationStatus === 'APPROVED' && <Text style={styles.vehicleVerifiedBadge}>✓ Verified</Text>}
            </View>
            <Text style={styles.vehicleOptionMeta}>{v.year} · {v.color} · {v.fuelType}</Text>
          </View>
          <View style={[styles.radioOuter, form.vehicleId === v.id && styles.radioOuterActive]}>
            {form.vehicleId === v.id && <View style={styles.radioInner} />}
          </View>
        </Pressable>
      ))}

      {adding ? (
        <View style={styles.addVehicleForm}>
          {([
            ['make', 'Make (e.g. Honda)'],
            ['model', 'Model (e.g. City ZX)'],
            ['year', 'Year (e.g. 2022)'],
            ['color', 'Color'],
            ['registrationNumber', 'Registration Number'],
          ] as const).map(([key, placeholder]) => (
            <TextInput
              key={key}
              value={newVehicle[key]}
              onChangeText={(v) => setNewVehicle((f) => ({ ...f, [key]: v }))}
              placeholder={placeholder}
              placeholderTextColor={colors.slate400}
              keyboardType={key === 'year' ? 'number-pad' : 'default'}
              style={styles.textInput}
            />
          ))}
          {addVehicleMutation.isError && <Text style={styles.hintText}>Couldn't save that vehicle — check the registration number isn't already in use.</Text>}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={styles.vehicleCancelButton} onPress={() => setAdding(false)}>
              <Text style={styles.vehicleCancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.vehicleSaveButton, (!canSubmitVehicle || addVehicleMutation.isPending) && styles.nextButtonDisabled]}
              disabled={!canSubmitVehicle || addVehicleMutation.isPending}
              onPress={submitVehicle}
            >
              <Text style={styles.vehicleSaveButtonText}>{addVehicleMutation.isPending ? 'Saving…' : 'Save Vehicle'}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.addVehicleRow} onPress={() => setAdding(true)}>
          <View style={styles.addVehicleIcon}><Text style={{ fontSize: 20 }}>+</Text></View>
          <Text style={styles.addVehicleText}>Add a new vehicle</Text>
        </Pressable>
      )}
    </View>
  )
}

function StepNote({ form, update }: { form: WizardForm; update: UpdateFn }) {
  return (
    <View style={{ gap: 16 }}>
      <View style={[styles.infoBanner, { backgroundColor: colors.slate50, borderColor: colors.slate100 }]}>
        <Text style={{ fontSize: 22 }}>📝</Text>
        <Text style={[styles.infoBannerText, { color: colors.slate600 }]}>
          Optional: Add a note for the driver about pickup details, luggage, or anything else.
        </Text>
      </View>
      <TextInput
        value={form.notes}
        onChangeText={(v) => update('notes', v)}
        placeholder="e.g. I'll be waiting near the main gate. Can carry one medium bag."
        multiline
        numberOfLines={5}
        style={[styles.textInput, styles.textArea]}
        placeholderTextColor={colors.slate400}
      />
      <Text style={styles.hintText}>This note will be visible to matched drivers</Text>
    </View>
  )
}

function StepReview({ form, isDriver, vehicles }: { form: WizardForm; isDriver: boolean; vehicles: Vehicle[] }) {
  const vehicle = vehicles.find((v) => v.id === form.vehicleId)
  const rows = isDriver
    ? [
        { label: 'Route', value: `${form.from || 'Madhapur'} → ${form.to || 'Gachibowli'}` },
        { label: 'Stops', value: form.stops.length > 0 ? form.stops.join(', ') : 'None' },
        { label: 'Date & Time', value: `${form.date || 'Tomorrow'} at ${form.time || '08:00 AM'}` },
        { label: 'Price Per Person', value: form.pricePerPerson ? `₹${form.pricePerPerson}` : 'Not set' },
        { label: 'Vehicle', value: vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : 'Not selected' },
        { label: 'Auto-confirm', value: form.autoConfirm ? 'Yes' : 'Requires approval' },
      ]
    : [
        { label: 'Route', value: `${form.from || 'Gachibowli'} → ${form.to || 'Madhapur'}` },
        { label: 'Date & Time', value: `${form.date || 'Tomorrow'} at ${form.time || '08:30 AM'}` },
        { label: 'AC Preferred', value: form.acAvailable ? 'Yes' : 'No' },
        { label: 'Women Driver', value: form.womenOnly ? 'Yes' : 'No preference' },
        { label: 'Note', value: form.notes || 'None' },
      ]

  return (
    <View style={{ gap: 16 }}>
      <View style={[styles.infoBanner, { backgroundColor: colors.greenSoft, borderColor: colors.greenBorder }]}>
        <Text style={{ fontSize: 22 }}>✅</Text>
        <Text style={[styles.infoBannerText, { color: colors.greenDark }]}>
          {isDriver ? 'Review and publish your offered ride.' : 'Review and post your ride request.'}
        </Text>
      </View>

      <View style={styles.reviewCard}>
        {rows.map(({ label, value }) => (
          <View key={label} style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>{label}</Text>
            <Text style={styles.reviewValue}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.reviewFootnote}>
        <Text style={styles.reviewFootnoteText}>
          {isDriver
            ? '📢 Your ride will be visible to passengers on matching routes immediately after publishing.'
            : '📢 Your request will be visible to matching drivers. You will be notified when a driver sends a match.'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.slate900 },
  headerSub: { fontSize: 11, color: colors.slate400, marginTop: 2 },
  changeButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.md, backgroundColor: colors.slate50 },
  changeButtonText: { fontSize: 11, color: colors.slate400, fontWeight: '600' },
  modeContainer: { padding: 20, gap: 20 },
  tipBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.blueSoft, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.blueBorder, paddingHorizontal: 16, paddingVertical: 12 },
  tipText: { flex: 1, fontSize: 13, color: colors.blueDark, lineHeight: 18 },
  modeCard: { flexDirection: 'row', gap: 16, padding: 20, borderRadius: 24, borderWidth: 2, borderColor: colors.slate200, backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  modeIconWrap: { width: 56, height: 56, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  modeCardTitle: { fontSize: 16, fontWeight: '800', color: colors.slate900, marginBottom: 4 },
  modeCardBody: { fontSize: 13, color: colors.slate500, lineHeight: 18 },
  modeStepsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  modeStepChipBlue: { backgroundColor: colors.blueSoft, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  modeStepChipTextBlue: { fontSize: 10, fontWeight: '700', color: colors.blue },
  modeStepChipGreen: { backgroundColor: colors.greenSoft, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  modeStepChipTextGreen: { fontSize: 10, fontWeight: '700', color: colors.green },
  progressTrack: { height: 4, backgroundColor: colors.slate100 },
  progressFill: { height: '100%', borderRadius: 2 },
  stepPillsRow: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 6 },
  stepPill: { backgroundColor: colors.slate100, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 7 },
  stepPillDone: { backgroundColor: colors.greenSoft },
  stepPillText: { fontSize: 11, fontWeight: '700', color: colors.slate400 },
  stepPillTextActive: { color: 'white' },
  stepPillTextDone: { color: colors.green },
  stepContent: { paddingHorizontal: 20, paddingVertical: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, borderTopWidth: 1, borderTopColor: colors.slate100 },
  nextButton: { paddingVertical: 15, borderRadius: radii.xl, alignItems: 'center' },
  nextButtonDisabled: { opacity: 0.4 },
  nextButtonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  submitError: { color: colors.red, fontSize: 12, textAlign: 'center', marginBottom: 10 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  textInput: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: colors.slate900 },
  textArea: { height: 110, textAlignVertical: 'top' },
  priceInput: { fontSize: 20, fontWeight: '800' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radii.lg, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  infoBannerText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  popularRouteRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.slate50, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 12 },
  popularRouteText: { fontSize: 13, color: colors.slate700 },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stopBox: { flex: 1, backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate200, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 10 },
  stopBoxText: { fontSize: 13, color: colors.slate700 },
  removeStopButton: { width: 32, height: 32, borderRadius: radii.md, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  addStopButton: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  hintText: { fontSize: 11, color: colors.slate400, textAlign: 'center' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, backgroundColor: 'white' },
  pillActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.slate600 },
  pillTextActive: { color: 'white' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { width: '23%', paddingVertical: 10, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, backgroundColor: 'white', alignItems: 'center' },
  timeChipActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  timeChipText: { fontSize: 11, fontWeight: '700', color: colors.slate600 },
  timeChipTextActive: { color: 'white' },
  priceChip: { flex: 1, paddingVertical: 10, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center' },
  priceChipActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  priceChipText: { fontSize: 12, fontWeight: '700', color: colors.slate600 },
  priceChipTextActive: { color: 'white' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  toggleLabel: { fontSize: 13, color: colors.slate700, flex: 1, paddingRight: 12 },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.slate300, justifyContent: 'center' },
  toggleTrackActive: { backgroundColor: colors.blue },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', marginLeft: 2 },
  toggleThumbActive: { marginLeft: 22 },
  vehicleOption: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radii.lg, borderWidth: 2, borderColor: colors.slate200 },
  vehicleOptionActive: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  vehicleOptionIcon: { width: 52, height: 52, borderRadius: radii.md, backgroundColor: colors.slate100, alignItems: 'center', justifyContent: 'center' },
  vehicleOptionName: { fontSize: 13, fontWeight: '700', color: colors.slate900 },
  vehicleVerifiedBadge: { fontSize: 9, fontWeight: '700', color: colors.greenDark, backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: colors.greenBorder, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill, overflow: 'hidden' },
  vehicleOptionMeta: { fontSize: 11, color: colors.slate500, marginTop: 3 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.slate300, alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: colors.blue, backgroundColor: colors.blue },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
  addVehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radii.lg, borderWidth: 2, borderColor: colors.slate200, borderStyle: 'dashed' },
  addVehicleIcon: { width: 52, height: 52, borderRadius: radii.md, backgroundColor: colors.slate50, alignItems: 'center', justifyContent: 'center' },
  addVehicleText: { fontSize: 13, color: colors.slate500 },
  addVehicleForm: { gap: 10, padding: 14, borderRadius: radii.lg, borderWidth: 2, borderColor: colors.blue, backgroundColor: colors.blueSoft },
  vehicleCancelButton: { flex: 1, paddingVertical: 12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', backgroundColor: 'white' },
  vehicleCancelButtonText: { fontSize: 13, fontWeight: '700', color: colors.slate600 },
  vehicleSaveButton: { flex: 1, paddingVertical: 12, borderRadius: radii.md, backgroundColor: colors.blue, alignItems: 'center' },
  vehicleSaveButtonText: { fontSize: 13, fontWeight: '700', color: 'white' },
  reviewCard: { backgroundColor: 'white', borderRadius: radii.lg, borderWidth: 1, borderColor: colors.slate100, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  reviewLabel: { fontSize: 12, fontWeight: '500', color: colors.slate500 },
  reviewValue: { fontSize: 13, fontWeight: '600', color: colors.slate700, textAlign: 'right', flexShrink: 1 },
  reviewFootnote: { backgroundColor: colors.blueSoft, borderRadius: radii.md, borderWidth: 1, borderColor: colors.blueBorder, paddingHorizontal: 16, paddingVertical: 12 },
  reviewFootnoteText: { fontSize: 11, color: colors.blue, lineHeight: 16 },
})
