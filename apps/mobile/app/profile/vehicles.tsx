import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Vehicle } from '@shareride/types'
import { colors, radii } from '../../lib/theme'
import { api } from '../../lib/api'
import { ChevronLeftIcon } from '../../components/icons'

interface VehicleFormState {
  make: string
  model: string
  year: string
  color: string
  registrationNumber: string
}

const EMPTY_FORM: VehicleFormState = { make: '', model: '', year: '', color: '', registrationNumber: '' }

function toFormState(vehicle: Vehicle): VehicleFormState {
  return { make: vehicle.make, model: vehicle.model, year: String(vehicle.year), color: vehicle.color, registrationNumber: vehicle.registrationNumber }
}

function formatVerificationStatus(status: string): string {
  switch (status) {
    case 'NOT_STARTED': return 'Not yet reviewed'
    case 'SUBMITTED': return 'Submitted'
    case 'UNDER_REVIEW': return 'Under review'
    case 'APPROVED': return 'Verified'
    case 'REJECTED': return 'Rejected'
    case 'ACTION_REQUIRED': return 'Needs attention'
    default: return status
  }
}

// New Phase 10 screen — apps/api/src/vehicles gained PATCH/deactivate
// routes this phase; there was previously no standalone vehicle
// management UI (only the inline picker inside post-ride.tsx's driver
// wizard, which stays unchanged and still reads the same GET /vehicles).
export default function VehiclesScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()

  const [adding, setAdding] = useState(false)
  const [newVehicle, setNewVehicle] = useState<VehicleFormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<VehicleFormState>(EMPTY_FORM)

  const vehiclesQuery = useQuery({ queryKey: ['vehicles'], queryFn: () => api.vehicles.list() })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vehicles'] })

  const createMutation = useMutation({
    mutationFn: (input: { make: string; model: string; year: number; color: string; registrationNumber: string }) =>
      api.vehicles.create({ ...input, fuelType: 'PETROL', ac: true }),
    onSuccess: () => { invalidate(); setNewVehicle(EMPTY_FORM); setAdding(false) },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { make: string; model: string; year: number; color: string; registrationNumber: string } }) =>
      api.vehicles.update(id, input),
    onSuccess: () => { invalidate(); setEditingId(null) },
  })
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.vehicles.deactivate(id),
    onSuccess: invalidate,
  })

  const canSubmitNew = newVehicle.make && newVehicle.model && newVehicle.year && newVehicle.color && newVehicle.registrationNumber
  const submitNew = () => {
    if (!canSubmitNew) return
    createMutation.mutate({ make: newVehicle.make, model: newVehicle.model, year: Number(newVehicle.year), color: newVehicle.color, registrationNumber: newVehicle.registrationNumber })
  }

  const startEdit = (vehicle: Vehicle) => { setEditingId(vehicle.id); setEditForm(toFormState(vehicle)) }
  const submitEdit = (id: string) => {
    updateMutation.mutate({ id, input: { make: editForm.make, model: editForm.model, year: Number(editForm.year), color: editForm.color, registrationNumber: editForm.registrationNumber } })
  }

  const vehicles = vehiclesQuery.data ?? []
  const activeVehicles = vehicles.filter((v) => v.isActive)
  const inactiveVehicles = vehicles.filter((v) => !v.isActive)

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={styles.headerTitle}>My Vehicles</Text>
        <Pressable style={styles.addButton} onPress={() => setAdding((v) => !v)}>
          <Text style={styles.addButtonText}>{adding ? 'Close' : '+ Add'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {vehiclesQuery.isLoading && (
          <View style={styles.centerState}><ActivityIndicator color={colors.blue} /></View>
        )}
        {vehiclesQuery.isError && (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>Can't reach ShareRide right now</Text>
            <Pressable style={styles.retryButton} onPress={() => vehiclesQuery.refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {adding && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add a vehicle</Text>
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
            {createMutation.isError && <Text style={styles.errorText}>Couldn't save — check the registration number isn't already in use.</Text>}
            <Pressable
              style={[styles.saveButton, (!canSubmitNew || createMutation.isPending) && styles.disabledButton]}
              disabled={!canSubmitNew || createMutation.isPending}
              onPress={submitNew}
            >
              <Text style={styles.saveButtonText}>{createMutation.isPending ? 'Saving…' : 'Save Vehicle'}</Text>
            </Pressable>
          </View>
        )}

        {vehiclesQuery.isSuccess && activeVehicles.length === 0 && !adding && (
          <View style={styles.centerState}>
            <Text style={{ fontSize: 32 }}>🚗</Text>
            <Text style={styles.emptyTitle}>No vehicles yet</Text>
            <Text style={styles.emptySub}>Add a vehicle to start offering rides as a driver.</Text>
          </View>
        )}

        {activeVehicles.map((vehicle) => (
          <View key={vehicle.id} style={styles.vehicleCard}>
            {editingId === vehicle.id ? (
              <View style={{ gap: 10 }}>
                {([
                  ['make', 'Make'], ['model', 'Model'], ['year', 'Year'], ['color', 'Color'], ['registrationNumber', 'Registration Number'],
                ] as const).map(([key, placeholder]) => (
                  <TextInput
                    key={key}
                    value={editForm[key]}
                    onChangeText={(v) => setEditForm((f) => ({ ...f, [key]: v }))}
                    placeholder={placeholder}
                    placeholderTextColor={colors.slate400}
                    keyboardType={key === 'year' ? 'number-pad' : 'default'}
                    style={styles.textInput}
                  />
                ))}
                {updateMutation.isError && <Text style={styles.errorText}>Couldn't save that change.</Text>}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable style={styles.cancelButton} onPress={() => setEditingId(null)}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.saveButtonSmall, updateMutation.isPending && styles.disabledButton]}
                    disabled={updateMutation.isPending}
                    onPress={() => submitEdit(vehicle.id)}
                  >
                    <Text style={styles.saveButtonText}>{updateMutation.isPending ? 'Saving…' : 'Save'}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.vehicleTopRow}>
                  <Text style={{ fontSize: 26 }}>🚗</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>
                    <Text style={styles.vehicleMeta}>{vehicle.year} · {vehicle.color} · {vehicle.registrationNumber}</Text>
                  </View>
                  <View style={[styles.statusBadge, vehicle.verificationStatus === 'APPROVED' && styles.statusBadgeVerified]}>
                    <Text style={[styles.statusBadgeText, vehicle.verificationStatus === 'APPROVED' && styles.statusBadgeTextVerified]}>
                      {formatVerificationStatus(vehicle.verificationStatus)}
                    </Text>
                  </View>
                </View>
                {vehicle.verificationNote && <Text style={styles.noteText}>{vehicle.verificationNote}</Text>}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <Pressable style={styles.secondaryButton} onPress={() => startEdit(vehicle)}>
                    <Text style={styles.secondaryButtonText}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.secondaryButtonDanger, deactivateMutation.isPending && deactivateMutation.variables === vehicle.id && styles.disabledButton]}
                    disabled={deactivateMutation.isPending && deactivateMutation.variables === vehicle.id}
                    onPress={() => deactivateMutation.mutate(vehicle.id)}
                  >
                    <Text style={styles.secondaryButtonDangerText}>Deactivate</Text>
                  </Pressable>
                </View>
                {deactivateMutation.isError && deactivateMutation.variables === vehicle.id && (
                  <Text style={styles.errorText}>This vehicle has an active ride offer — cancel or complete it first.</Text>
                )}
              </>
            )}
          </View>
        ))}

        {inactiveVehicles.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.sectionLabel}>Deactivated</Text>
            {inactiveVehicles.map((vehicle) => (
              <View key={vehicle.id} style={[styles.vehicleCard, styles.vehicleCardInactive]}>
                <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>
                <Text style={styles.vehicleMeta}>{vehicle.year} · {vehicle.color} · {vehicle.registrationNumber}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.slate900 },
  addButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.md, backgroundColor: colors.blue },
  addButtonText: { fontSize: 12, fontWeight: '700', color: 'white' },
  centerState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.slate700 },
  emptySub: { fontSize: 13, color: colors.slate400, textAlign: 'center', maxWidth: 260, lineHeight: 18 },
  retryButton: { marginTop: 4, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.md, borderWidth: 1, borderColor: colors.blueBorder },
  retryButtonText: { fontSize: 12, fontWeight: '700', color: colors.blue },
  formCard: { backgroundColor: 'white', borderRadius: radii.lg, borderWidth: 2, borderColor: colors.blue, padding: 16, gap: 10 },
  formTitle: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  textInput: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.slate900 },
  errorText: { fontSize: 11, color: colors.red },
  saveButton: { backgroundColor: colors.blue, borderRadius: radii.md, paddingVertical: 12, alignItems: 'center' },
  saveButtonSmall: { flex: 1, backgroundColor: colors.blue, borderRadius: radii.md, paddingVertical: 10, alignItems: 'center' },
  saveButtonText: { color: 'white', fontWeight: '700', fontSize: 13 },
  cancelButton: { flex: 1, borderRadius: radii.md, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.slate200 },
  cancelButtonText: { color: colors.slate600, fontWeight: '700', fontSize: 13 },
  disabledButton: { opacity: 0.6 },
  vehicleCard: { backgroundColor: 'white', borderRadius: radii.lg, padding: 16, gap: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  vehicleCardInactive: { opacity: 0.6, marginBottom: 8 },
  vehicleTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleName: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  vehicleMeta: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: colors.slate100 },
  statusBadgeVerified: { backgroundColor: '#D1FAE5' },
  statusBadgeText: { fontSize: 10, fontWeight: '700', color: colors.slate600 },
  statusBadgeTextVerified: { color: colors.green },
  noteText: { fontSize: 11, color: colors.slate500, fontStyle: 'italic' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.slate400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  secondaryButton: { flex: 1, borderRadius: radii.md, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: colors.blueBorder, backgroundColor: colors.blueSoft },
  secondaryButtonText: { fontSize: 12, fontWeight: '700', color: colors.blue },
  secondaryButtonDanger: { flex: 1, borderRadius: radii.md, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: colors.redBorder, backgroundColor: colors.redSoft },
  secondaryButtonDangerText: { fontSize: 12, fontWeight: '700', color: colors.red },
})
