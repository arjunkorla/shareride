import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation } from '@tanstack/react-query'
import { colors, radii } from '../../lib/theme'
import { api } from '../../lib/api'
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons'

// Ported from src/screens/profile/HelpSupportScreen.tsx.
//
// Stale-copy fix (docs/current-architecture.md §5): the original FAQ
// described a seat-selection / "Book Now"-"Request Seat" flow and a
// generic "6-step wizard... seats, pricing" that doesn't match the real
// PostRideScreen/post-ride.tsx wizard (Route -> Schedule -> Preferences ->
// Note -> Review for passengers; Route -> Stops -> Schedule -> Preferences
// -> Vehicle -> Review for drivers, no seats step anywhere). Rewritten
// below to describe that real flow.
const FAQS = [
  { q: 'How do I send a ride request?', a: 'Go to the Discover tab, enter your pickup and drop-off, choose a date and time, then browse matching offered rides and tap "Send Request" — or post your own request from the "+" button if nothing matches yet.' },
  { q: 'How do I post a ride as a driver?', a: 'Tap the "+" button in the bottom navigation and choose "Offer a Ride". Follow the wizard to set your route, any stops, your schedule, preferences, and vehicle, then publish — there is no seat count to configure, matching is by route and time.' },
  { q: 'How does payment work?', a: 'Once a driver and passenger are matched, payment is a flat per-person amount agreed for that ride — paid in-app via card, UPI, or wallet, or in cash directly to the driver, as agreed between you.' },
  { q: 'What if my driver cancels?', a: 'If a driver cancels a confirmed match, you will be notified immediately and any payment made is fully refunded within 24-48 hours. You can search for alternative rides right away.' },
  { q: 'How do I verify my account?', a: 'Go to Profile → Verification and upload the required documents. Verification typically takes 1-2 business days.' },
  { q: 'Is it safe to share a ride with strangers?', a: 'All users are ID-verified. Drivers undergo additional license and vehicle checks. You can also see ratings, reviews, and verified badges before sending or accepting a request.' },
]

export default function HelpSupportScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketText, setTicketText] = useState('')

  const createTicketMutation = useMutation({
    mutationFn: () => api.support.createTicket({ category: 'general', subject: ticketSubject || 'Support request', message: ticketText }),
  })

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={styles.contactRow}>
          {[
            { icon: '💬', label: 'Live Chat', sub: 'Online now', bg: colors.blueSoft, color: colors.blue },
            { icon: '📞', label: 'Call Us', sub: '1800-000-0000', bg: '#F0FDF4', color: colors.green },
            { icon: '✉️', label: 'Email', sub: 'Reply in 24h', bg: colors.amberSoft, color: colors.amber },
          ].map((c) => (
            <View key={c.label} style={[styles.contactCard, { backgroundColor: c.bg }]}>
              <Text style={{ fontSize: 20 }}>{c.icon}</Text>
              <Text style={[styles.contactLabel, { color: c.color }]}>{c.label}</Text>
              <Text style={styles.contactSub}>{c.sub}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.safetyBanner} onPress={() => router.push('/safety/report')}>
          <Text style={{ fontSize: 20 }}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyTitle}>Safety Center</Text>
            <Text style={styles.safetySub}>Report a safety issue to our team</Text>
          </View>
          <ChevronRightIcon color={colors.red} />
        </Pressable>

        <View>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.card}>
            {FAQS.map((faq, i) => (
              <View key={faq.q} style={i < FAQS.length - 1 ? styles.faqBorder : undefined}>
                <Pressable style={styles.faqRow} onPress={() => setOpenFaq(openFaq === i ? null : i)}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <ChevronRightIcon />
                </Pressable>
                {openFaq === i && (
                  <View style={styles.faqAnswerBox}>
                    <Text style={styles.faqAnswer}>{faq.a}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Raise a Ticket</Text>
          {!createTicketMutation.isSuccess ? (
            <View style={styles.ticketCard}>
              {!ticketOpen ? (
                <Pressable style={styles.ticketOpenRow} onPress={() => setTicketOpen(true)}>
                  <Text style={{ fontSize: 18 }}>🎫</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ticketOpenLabel}>Contact Support Team</Text>
                    <Text style={styles.ticketOpenSub}>Describe your issue in detail</Text>
                  </View>
                  <ChevronRightIcon />
                </Pressable>
              ) : (
                <View style={{ gap: 12 }}>
                  <TextInput
                    style={styles.subjectInput}
                    value={ticketSubject}
                    onChangeText={setTicketSubject}
                    placeholder="Subject"
                  />
                  <TextInput
                    style={styles.textarea}
                    value={ticketText}
                    onChangeText={setTicketText}
                    placeholder="Describe your issue in detail..."
                    multiline
                    numberOfLines={4}
                  />
                  {createTicketMutation.isError && <Text style={styles.ticketErrorText}>Couldn't submit — please try again.</Text>}
                  <Pressable
                    style={[styles.submitButton, (!ticketText || createTicketMutation.isPending) && styles.submitButtonDisabled]}
                    disabled={!ticketText || createTicketMutation.isPending}
                    onPress={() => createTicketMutation.mutate()}
                  >
                    <Text style={styles.submitButtonText}>{createTicketMutation.isPending ? 'Submitting…' : 'Submit Ticket'}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.ticketSentCard}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>✅</Text>
              <Text style={styles.ticketSentTitle}>Ticket Submitted!</Text>
              <Text style={styles.ticketSentSub}>Reference #{createTicketMutation.data?.id.slice(0, 8).toUpperCase()} · We'll respond soon</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.slate900 },
  contactRow: { flexDirection: 'row', gap: 12 },
  contactCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14, borderRadius: radii.lg },
  contactLabel: { fontSize: 11, fontWeight: '700' },
  contactSub: { fontSize: 9, color: colors.slate500 },
  safetyBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.redSoft, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.redBorder },
  safetyTitle: { fontSize: 13, fontWeight: '700', color: '#B91C1C' },
  safetySub: { fontSize: 11, color: colors.red, marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: 'white', borderRadius: radii.lg, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  faqBorder: { borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  faqRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  faqQuestion: { flex: 1, fontSize: 13, fontWeight: '500', color: colors.slate700 },
  faqAnswerBox: { paddingHorizontal: 16, paddingBottom: 16 },
  faqAnswer: { fontSize: 12, color: colors.slate500, lineHeight: 18 },
  ticketCard: { backgroundColor: 'white', borderRadius: radii.lg, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  ticketOpenRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ticketOpenLabel: { fontSize: 13, fontWeight: '500', color: colors.slate700 },
  ticketOpenSub: { fontSize: 11, color: colors.slate400 },
  subjectInput: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  ticketErrorText: { fontSize: 11, color: colors.red },
  textarea: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.slate50, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, minHeight: 90, textAlignVertical: 'top' },
  submitButton: { backgroundColor: colors.blue, borderRadius: radii.md, paddingVertical: 12, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: 'white', fontWeight: '700', fontSize: 13 },
  ticketSentCard: { backgroundColor: '#ECFDF5', borderRadius: radii.lg, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.greenBorder },
  ticketSentTitle: { fontSize: 14, fontWeight: '700', color: colors.greenDark, marginBottom: 4 },
  ticketSentSub: { fontSize: 11, color: colors.green, textAlign: 'center' },
})
