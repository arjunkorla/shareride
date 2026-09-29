import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { colors, radii } from '../../lib/theme'
import { api } from '../../lib/api'
import { ChevronLeftIcon, CloseIcon } from '../../components/icons'

// Real EmergencyContact CRUD (Phase 10), replacing the Phase 3 fixture.
// Two fixture features dropped, not carried over: `notifyOnTrip` (no
// schema column, and no SMS/push provider exists to actually act on it)
// and the device-contacts picker (would need a new native dependency —
// expo-contacts — for a convenience feature manual entry already covers).
export default function EmergencyContactsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', relation: '' })

  const contactsQuery = useQuery({ queryKey: ['emergency-contacts'], queryFn: () => api.safety.emergencyContacts.list() })

  const createMutation = useMutation({
    mutationFn: () => api.safety.emergencyContacts.create({ name: form.name, phone: form.phone, relation: form.relation || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] })
      setForm({ name: '', phone: '', relation: '' })
      setAdding(false)
    },
  })
  const removeMutation = useMutation({
    mutationFn: (id: string) => api.safety.emergencyContacts.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] }),
  })

  const canSubmit = form.name.trim().length > 0 && form.phone.trim().length > 0
  const contacts = contactsQuery.data ?? []

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <Pressable style={styles.addButton} onPress={() => setAdding((v) => !v)}>
          <Text style={styles.addButtonText}>{adding ? 'Close' : '+ Add'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View style={styles.infoBanner}>
          <Text style={{ fontSize: 18, marginTop: 2 }}>🆘</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Why Emergency Contacts?</Text>
            <Text style={styles.infoText}>Keep people you trust on file so you can reach them quickly from the SOS screen during a trip.</Text>
          </View>
        </View>

        {contactsQuery.isLoading && (
          <View style={styles.centerState}><ActivityIndicator color={colors.blue} /></View>
        )}
        {contactsQuery.isError && (
          <View style={styles.centerState}>
            <Text style={styles.emptyText}>Can't reach ShareRide right now</Text>
            <Pressable style={styles.retryButton} onPress={() => contactsQuery.refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {contactsQuery.isSuccess && contacts.length === 0 && !adding && (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>👥</Text>
            <Text style={styles.emptyText}>No emergency contacts added yet</Text>
          </View>
        )}

        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Text style={{ fontSize: 18 }}>👤</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.contactNameRow}>
                <Text style={styles.contactName}>{contact.name}</Text>
                {contact.relation && (
                  <View style={styles.relationBadge}>
                    <Text style={styles.relationBadgeText}>{contact.relation}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            </View>
            <Pressable
              style={styles.removeButton}
              disabled={removeMutation.isPending && removeMutation.variables === contact.id}
              onPress={() => removeMutation.mutate(contact.id)}
            >
              <CloseIcon size={13} color={colors.red} />
            </Pressable>
          </View>
        ))}

        {adding && (
          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>New Emergency Contact</Text>
            <View>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="Meera Sharma" />
            </View>
            <View>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput style={styles.input} value={form.phone} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="+91 98765 43210" keyboardType="phone-pad" />
            </View>
            <View>
              <Text style={styles.fieldLabel}>Relationship (optional)</Text>
              <TextInput style={styles.input} value={form.relation} onChangeText={(v) => setForm((f) => ({ ...f, relation: v }))} placeholder="e.g. Spouse, Parent, Friend" />
            </View>
            {createMutation.isError && <Text style={styles.errorText}>Couldn't save that contact — please try again.</Text>}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable style={styles.cancelButton} onPress={() => setAdding(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.submitButton, (!canSubmit || createMutation.isPending) && styles.disabledButton]}
                disabled={!canSubmit || createMutation.isPending}
                onPress={() => createMutation.mutate()}
              >
                <Text style={styles.submitButtonText}>{createMutation.isPending ? 'Saving…' : 'Add Contact'}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'white', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.slate900 },
  addButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: radii.md, backgroundColor: colors.blue },
  addButtonText: { fontSize: 10, fontWeight: '700', color: 'white' },
  infoBanner: { flexDirection: 'row', gap: 12, backgroundColor: colors.redSoft, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.redBorder },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#B91C1C', marginBottom: 4 },
  infoText: { fontSize: 11, color: colors.red, lineHeight: 16 },
  centerState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 13, color: colors.slate500 },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.md, borderWidth: 1, borderColor: colors.blueBorder },
  retryButtonText: { fontSize: 12, fontWeight: '700', color: colors.blue },
  contactCard: { flexDirection: 'row', gap: 12, backgroundColor: 'white', borderRadius: radii.lg, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  contactIcon: { width: 44, height: 44, borderRadius: radii.lg, backgroundColor: colors.slate100, alignItems: 'center', justifyContent: 'center' },
  contactNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactName: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  relationBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill, backgroundColor: colors.slate100 },
  relationBadgeText: { fontSize: 10, fontWeight: '500', color: colors.slate500 },
  contactPhone: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  removeButton: { width: 32, height: 32, borderRadius: radii.md, backgroundColor: colors.redSoft, alignItems: 'center', justifyContent: 'center' },
  addForm: { backgroundColor: 'white', borderRadius: radii.lg, borderWidth: 2, borderColor: colors.blue, padding: 16, gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  addFormTitle: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  errorText: { fontSize: 11, color: colors.red },
  cancelButton: { flex: 1, paddingVertical: 10, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center' },
  cancelButtonText: { fontSize: 12, fontWeight: '700', color: colors.slate600 },
  submitButton: { flex: 1, paddingVertical: 10, borderRadius: radii.md, backgroundColor: colors.blue, alignItems: 'center' },
  submitButtonText: { fontSize: 12, fontWeight: '700', color: 'white' },
  disabledButton: { opacity: 0.6 },
})
