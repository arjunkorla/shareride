import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import type { SearchQuery } from '../lib/search-query'
import { colors, radii } from '../lib/theme'

interface Props {
  query: SearchQuery
  onChange: (patch: Partial<SearchQuery>) => void
}

const DATE_OPTIONS = ['Today', 'Tomorrow']
const TIME_OPTIONS: { label: string; range: string }[] = [
  { label: 'Any Time', range: 'Any Time' },
  { label: 'Morning', range: '6:00 AM - 11:00 AM' },
  { label: 'Afternoon', range: '11:00 AM - 4:00 PM' },
  { label: 'Evening', range: '4:00 PM - 9:00 PM' },
]

// Ported from src/components/DateTimeFields.tsx. The web version used
// native <input type="date"/"time"> for the custom option; RN has no
// equivalent without an extra native picker dependency, so "Custom" here
// is a free-text fallback (e.g. "Sat, 22 Aug" / "7:15 PM") rather than a
// calendar/clock UI — acceptable for Phase 3 since there's no real
// scheduling backend yet to validate against.
export default function DateTimeFields({ query, onChange }: Props) {
  const [showCustomDate, setShowCustomDate] = useState(false)
  const [showCustomTime, setShowCustomTime] = useState(false)

  const isCustomDate = !DATE_OPTIONS.includes(query.date)
  const isCustomTime = !TIME_OPTIONS.some((t) => t.range === query.timeLabel) && query.timeLabel !== 'Any Time'

  return (
    <View style={{ gap: 12 }}>
      <View>
        <Text style={styles.label}>Date</Text>
        <View style={styles.pillRow}>
          {DATE_OPTIONS.map((d) => (
            <Pill key={d} active={query.date === d} onPress={() => { onChange({ date: d }); setShowCustomDate(false) }}>{d}</Pill>
          ))}
          <Pill active={isCustomDate || showCustomDate} onPress={() => setShowCustomDate((v) => !v)}>
            📅 {isCustomDate ? query.date : 'Select Date'}
          </Pill>
        </View>
        {showCustomDate && (
          <TextInput
            autoFocus
            placeholder="e.g. Sat, 22 Aug"
            style={styles.input}
            onSubmitEditing={(e) => {
              if (!e.nativeEvent.text) return
              onChange({ date: e.nativeEvent.text })
              setShowCustomDate(false)
            }}
          />
        )}
      </View>

      <View>
        <Text style={styles.label}>Time</Text>
        <View style={styles.pillRow}>
          {TIME_OPTIONS.map((t) => (
            <Pill key={t.label} active={query.timeLabel === t.range} onPress={() => { onChange({ timeLabel: t.range }); setShowCustomTime(false) }}>{t.label}</Pill>
          ))}
          <Pill active={isCustomTime || showCustomTime} onPress={() => setShowCustomTime((v) => !v)}>
            🕐 {isCustomTime ? query.timeLabel : 'Specific Time'}
          </Pill>
        </View>
        {showCustomTime && (
          <TextInput
            autoFocus
            placeholder="e.g. 7:15 PM"
            style={styles.input}
            onSubmitEditing={(e) => {
              if (!e.nativeEvent.text) return
              onChange({ timeLabel: e.nativeEvent.text })
              setShowCustomTime(false)
            }}
          />
        )}
      </View>
    </View>
  )
}

function Pill({ active, onPress, children }: { active: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable style={[styles.pill, active && styles.pillActive]} onPress={onPress}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{children}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  label: { fontSize: 10, fontWeight: '700', color: colors.slate400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, backgroundColor: 'white' },
  pillActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.slate600 },
  pillTextActive: { color: 'white' },
  input: { marginTop: 8, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14 },
})
