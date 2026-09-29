import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { SearchQuery } from '../lib/search-query'
import { colors, radii } from '../lib/theme'
import LocationPickerSheet from './LocationPickerSheet'
import { SwapIcon } from './icons'

interface Props {
  query: SearchQuery
  onChange: (patch: Partial<SearchQuery>) => void
}

// Shared Pickup/Drop-off editor — ported from src/components/RouteFields.tsx.
// Used verbatim by Home's search card and Discover so the two never drift.
export default function RouteFields({ query, onChange }: Props) {
  const [activeField, setActiveField] = useState<'pickup' | 'dropoff' | null>(null)

  const swap = () => {
    onChange({
      pickup: query.dropoff,
      pickupSubtitle: query.dropoffSubtitle,
      dropoff: query.pickup,
      dropoffSubtitle: query.pickupSubtitle,
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.markerColumn}>
        <View style={styles.dot} />
        <View style={styles.line} />
        <View style={styles.square} />
      </View>

      <View style={styles.fields}>
        <Pressable style={styles.field} onPress={() => setActiveField('pickup')}>
          <Text style={styles.fieldLabel}>Pickup</Text>
          <Text style={[styles.fieldValue, !query.pickup && styles.fieldPlaceholder]} numberOfLines={1}>
            {query.pickup || 'Current location or search...'}
          </Text>
        </Pressable>
        <View style={styles.fieldDivider} />
        <Pressable style={styles.field} onPress={() => setActiveField('dropoff')}>
          <Text style={styles.fieldLabel}>Where are you going?</Text>
          <Text style={[styles.fieldValue, !query.dropoff && styles.fieldPlaceholder]} numberOfLines={1}>
            {query.dropoff || 'Search destination...'}
          </Text>
        </Pressable>
      </View>

      <Pressable style={styles.swapButton} onPress={swap}>
        <SwapIcon />
      </Pressable>

      <LocationPickerSheet
        visible={activeField === 'pickup'}
        label="Pickup location"
        onClose={() => setActiveField(null)}
        onSelect={(name, subtitle) => { onChange({ pickup: name, pickupSubtitle: subtitle }); setActiveField(null) }}
      />
      <LocationPickerSheet
        visible={activeField === 'dropoff'}
        label="Where are you going?"
        onClose={() => setActiveField(null)}
        onSelect={(name, subtitle) => { onChange({ dropoff: name, dropoffSubtitle: subtitle }); setActiveField(null) }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'stretch', gap: 12, backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate100, borderRadius: radii.lg, paddingHorizontal: 16, paddingVertical: 4 },
  markerColumn: { alignItems: 'center', paddingVertical: 14, flexShrink: 0 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue },
  line: { width: 2, flex: 1, minHeight: 20, backgroundColor: colors.slate300, marginVertical: 4 },
  square: { width: 10, height: 10, borderRadius: 2, borderWidth: 2, borderColor: colors.red, backgroundColor: 'white' },
  fields: { flex: 1 },
  field: { paddingVertical: 10, minHeight: 44, justifyContent: 'center' },
  fieldDivider: { height: 1, backgroundColor: colors.slate100 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: colors.slate400, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { fontSize: 14, fontWeight: '600', color: colors.slate900, marginTop: 2 },
  fieldPlaceholder: { color: colors.slate400, fontWeight: '400' },
  swapButton: { alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 18, backgroundColor: 'white', borderWidth: 1, borderColor: colors.slate200, alignSelf: 'center' },
})
