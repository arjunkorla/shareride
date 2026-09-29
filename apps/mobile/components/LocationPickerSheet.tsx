import { useMemo, useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { hyderabadLocations, popularLocations, recentSearches, savedLocations, type LocationSuggestion } from '../lib/fixtures'
import { colors, radii } from '../lib/theme'
import { CloseIcon } from './icons'

interface Props {
  visible: boolean
  label: string
  onClose: () => void
  onSelect: (name: string, subtitle: string) => void
}

// Ported from src/components/LocationPickerSheet.tsx as a RN Modal bottom
// sheet — shared by Home's compact search card and Discover's Pickup/
// Drop-off fields so both stay on one implementation.
export default function LocationPickerSheet({ visible, label, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('')

  const suggestions = useMemo<LocationSuggestion[]>(() => {
    if (!query.trim()) return []
    const q = query.trim().toLowerCase()
    return hyderabadLocations.filter((l) => l.name.toLowerCase().includes(q)).slice(0, 5)
  }, [query])

  const recentLocations = useMemo<LocationSuggestion[]>(() => {
    const seen = new Set<string>()
    const out: LocationSuggestion[] = []
    for (const s of recentSearches) {
      for (const name of [s.from, s.to]) {
        if (!seen.has(name)) {
          seen.add(name)
          out.push({ name, subtitle: 'Recent location' })
        }
      }
    }
    return out
  }, [])

  const choose = (name: string, subtitle: string) => {
    onSelect(name, subtitle)
    setQuery('')
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grabber} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>{label}</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <CloseIcon />
            </Pressable>
          </View>

          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search for an area, landmark..."
            style={styles.input}
          />

          {query.trim() ? (
            <FlatList
              data={suggestions}
              keyExtractor={(s) => s.name + s.subtitle}
              ListEmptyComponent={<Text style={styles.emptyText}>No matches for "{query}"</Text>}
              renderItem={({ item }) => <SuggestionRow icon="📍" name={item.name} subtitle={item.subtitle} onPress={() => choose(item.name, item.subtitle)} />}
            />
          ) : (
            <FlatList
              data={[{ kind: 'current' as const }, { kind: 'saved' as const }, { kind: 'recent' as const }, { kind: 'popular' as const }]}
              keyExtractor={(s) => s.kind}
              renderItem={({ item }) => {
                if (item.kind === 'current') {
                  return (
                    <Pressable style={styles.currentLocationRow} onPress={() => choose('Current Location', 'Using GPS')}>
                      <View style={styles.currentLocationIcon}><Text>📡</Text></View>
                      <Text style={styles.currentLocationText}>Use current location</Text>
                    </Pressable>
                  )
                }
                if (item.kind === 'saved' && savedLocations.length > 0) {
                  return (
                    <Section title="Saved Places">
                      {savedLocations.map((s) => (
                        <SuggestionRow key={s.label} icon={s.label === 'Home' ? '🏠' : s.label === 'Work' ? '💼' : '📌'} name={s.label} subtitle={`${s.name} · ${s.subtitle}`} onPress={() => choose(s.name, s.subtitle)} />
                      ))}
                    </Section>
                  )
                }
                if (item.kind === 'recent' && recentLocations.length > 0) {
                  return (
                    <Section title="Recent">
                      {recentLocations.map((s) => (
                        <SuggestionRow key={s.name} icon="🕐" name={s.name} subtitle={s.subtitle} onPress={() => choose(s.name, s.subtitle)} />
                      ))}
                    </Section>
                  )
                }
                if (item.kind === 'popular') {
                  return (
                    <Section title="Popular Locations">
                      <View style={styles.chipRow}>
                        {popularLocations.map((s) => (
                          <Pressable key={s.name} style={styles.chip} onPress={() => choose(s.name, s.subtitle)}>
                            <Text style={styles.chipText}>{s.name}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </Section>
                  )
                }
                return null
              }}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function SuggestionRow({ icon, name, subtitle, onPress }: { icon: string; name: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={styles.suggestionRow} onPress={onPress}>
      <Text style={styles.suggestionIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.suggestionName}>{name}</Text>
        <Text style={styles.suggestionSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, maxHeight: '85%' },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.slate200, alignSelf: 'center', marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '800', color: colors.slate900 },
  closeButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.slate400, textAlign: 'center', paddingVertical: 16 },
  currentLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  currentLocationIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  currentLocationText: { fontSize: 14, fontWeight: '600', color: colors.blue },
  section: { paddingTop: 12 },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: colors.slate400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 4, paddingBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.md, backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate100 },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.slate700 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  suggestionIcon: { width: 32, textAlign: 'center', fontSize: 16 },
  suggestionName: { fontSize: 14, fontWeight: '600', color: colors.slate700 },
  suggestionSubtitle: { fontSize: 11, color: colors.slate400 },
})
