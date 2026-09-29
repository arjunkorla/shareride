import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ApiRequestError } from '@shareride/api-client'
import { StarIcon, ChevronLeftIcon } from '../components/icons'
import { colors, radii } from '../lib/theme'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth-store'

const TAGS = ['Punctual', 'Clean Car', 'Safe Driver', 'Friendly', 'Good Music', 'Comfortable', 'Fast Route']
const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!']

// Real Trip/Review data (Phase 10), replacing the Phase 3 fixture version
// — star rating + optional tags/comment for a genuinely completed trip.
// Eligibility (participant, trip actually COMPLETED, one review per trip)
// is entirely server-enforced (apps/api/src/reviews); this screen just
// collects input and shows whatever error the server gives back if it
// isn't eligible (e.g. already reviewed).
export default function RateReviewScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { tripId } = useLocalSearchParams<{ tripId: string }>()
  const currentUserId = useAuthStore((s) => s.session?.user.id)

  const tripQuery = useQuery({ queryKey: ['trips', tripId], queryFn: () => api.trips.get(tripId), enabled: Boolean(tripId) })

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const submitMutation = useMutation({
    mutationFn: () => api.reviews.create({ tripId, rating, comment: comment || undefined, categories: selectedTags }),
  })

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const trip = tripQuery.data
  const otherParty = trip ? (trip.driverId === currentUserId ? trip.passenger : trip.driver) : undefined
  const duplicateReview = submitMutation.error instanceof ApiRequestError && submitMutation.error.error.statusCode === 409

  if (submitMutation.isSuccess) {
    return (
      <View style={styles.thankYouScreen}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>🎉</Text>
        <Text style={styles.thankYouTitle}>Thank you!</Text>
        <Text style={styles.thankYouSub}>
          Your review helps the community. {otherParty?.fullName ?? 'They'} will appreciate it!
        </Text>
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 20 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <StarIcon key={s} size={24} filled={s <= rating} />
          ))}
        </View>
        <Pressable style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Rate Your Ride</Text>
      </View>

      {tripQuery.isLoading && (
        <View style={styles.centerState}><ActivityIndicator color={colors.blue} /></View>
      )}

      {tripQuery.isError && (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>Can't load this trip</Text>
          <Pressable style={styles.retryButton} onPress={() => tripQuery.refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {trip && otherParty && (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.driverCard}>
              <View style={styles.driverAvatarFallback}><Text style={styles.driverAvatarFallbackText}>{otherParty.fullName.charAt(0)}</Text></View>
              <Text style={styles.driverName}>{otherParty.fullName}</Text>
              {trip.route && (
                <Text style={styles.routeText}>{trip.route.origin} → {trip.route.destination}</Text>
              )}

              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Pressable key={s} onPress={() => setRating(s)} hitSlop={6}>
                    <StarIcon size={34} filled={s <= rating} />
                  </Pressable>
                ))}
              </View>
              {rating > 0 && <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>}
            </View>

            <View>
              <Text style={styles.sectionLabel}>What stood out? (optional)</Text>
              <View style={styles.tagWrap}>
                {TAGS.map((t) => {
                  const active = selectedTags.includes(t)
                  return (
                    <Pressable key={t} style={[styles.tag, active && styles.tagActive]} onPress={() => toggleTag(t)}>
                      <Text style={[styles.tagText, active && styles.tagTextActive]}>{active ? '✓ ' : ''}{t}</Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            <View>
              <Text style={styles.sectionLabel}>Write a review (optional)</Text>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Share your experience with the community..."
                placeholderTextColor={colors.slate400}
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />
            </View>

            {submitMutation.isError && (
              <Text style={styles.errorText}>
                {duplicateReview ? 'You already reviewed this trip.' : "Couldn't submit your review — please try again."}
              </Text>
            )}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              style={[styles.submitButton, rating > 0 && styles.submitButtonActive]}
              onPress={() => submitMutation.mutate()}
              disabled={rating === 0 || submitMutation.isPending || duplicateReview}
            >
              <Text style={[styles.submitButtonText, rating > 0 && styles.submitButtonTextActive]}>
                {submitMutation.isPending ? 'Submitting…' : rating === 0 ? 'Tap stars to rate' : 'Submit Review'}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.slate900 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.slate700 },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.md, borderWidth: 1, borderColor: colors.blueBorder },
  retryButtonText: { fontSize: 12, fontWeight: '700', color: colors.blue },
  scrollContent: { padding: 16, gap: 20 },
  driverCard: {
    backgroundColor: 'white', borderRadius: radii.xl, padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  driverAvatarFallback: { width: 80, height: 80, borderRadius: radii.xl, marginBottom: 12, borderWidth: 2, borderColor: colors.slate100, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  driverAvatarFallbackText: { fontSize: 28, fontWeight: '800', color: colors.blue },
  driverName: { fontSize: 18, fontWeight: '800', color: colors.slate900 },
  routeText: { fontSize: 12, color: colors.slate500, marginTop: 4 },
  starRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
  ratingLabel: { fontSize: 14, fontWeight: '700', color: '#F59E0B', marginTop: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, backgroundColor: 'white' },
  tagActive: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  tagText: { fontSize: 12, fontWeight: '600', color: colors.slate600 },
  tagTextActive: { color: colors.blue },
  textArea: {
    backgroundColor: 'white', borderWidth: 1, borderColor: colors.slate200, borderRadius: radii.lg,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: colors.slate900, textAlignVertical: 'top', minHeight: 84,
  },
  errorText: { fontSize: 12, color: colors.red, textAlign: 'center' },
  footer: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: colors.slate100 },
  submitButton: { paddingVertical: 16, borderRadius: radii.lg, alignItems: 'center', backgroundColor: colors.slate200 },
  submitButtonActive: { backgroundColor: colors.blue },
  submitButtonText: { fontSize: 15, fontWeight: '700', color: colors.slate400 },
  submitButtonTextActive: { color: 'white' },
  thankYouScreen: { flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  thankYouTitle: { fontSize: 24, fontWeight: '800', color: colors.slate900, marginBottom: 8 },
  thankYouSub: { fontSize: 13, color: colors.slate500, textAlign: 'center', lineHeight: 19 },
  doneButton: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: radii.lg, backgroundColor: colors.blue },
  doneButtonText: { fontSize: 14, fontWeight: '700', color: 'white' },
})
