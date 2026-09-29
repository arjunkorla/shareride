import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radii } from '../../../lib/theme'
import { ChevronLeftIcon } from '../../../components/icons'

// Ported from src/screens/profile/LegalScreen.tsx.
//
// Stale-copy fix (docs/current-architecture.md §5): section 8's
// cancellation clause read "Passengers: Cancellations within 1 hour of
// departure may forfeit the seat amount" — rewritten to match the
// cancellation-record language already used in apps/mobile/app/(tabs)/
// my-rides.tsx, since there is no seat/booking model to forfeit against.
const TERMS_CONTENT = `Last updated: 1 August 2026

1. ACCEPTANCE OF TERMS
By accessing or using the ShareRide application ("Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.

2. ELIGIBILITY
You must be at least 18 years of age and hold a valid government-issued ID to register as a user. Drivers must additionally hold a valid driving licence and vehicle registration.

3. USER ACCOUNTS
You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, current and complete information. ShareRide reserves the right to suspend accounts for violations of these terms.

4. RIDE SHARING
ShareRide is a platform that connects drivers and passengers for shared transportation. We do not provide transportation services directly. Drivers and passengers enter into agreements directly with each other after being matched by the platform.

5. PAYMENTS
All payments processed through the platform are subject to our payment policy. Refunds for cancelled rides are governed by the cancellation policy detailed in Section 8.

6. SAFETY
All users must comply with our Community Safety Guidelines. We reserve the right to remove any user who poses a safety risk to others. SOS features and emergency contact sharing are provided as safety tools only.

7. VERIFICATION
Users who wish to drive must complete identity and vehicle verification. Verification is for platform safety only and does not constitute employment or endorsement.

8. CANCELLATION POLICY
Drivers: Cancellations within 2 hours of departure may affect your rating. Passengers: Cancellations within 1 hour of departure may affect your cancellation record per our policy.

9. LIABILITY LIMITATION
ShareRide is not liable for any direct, indirect, incidental, special or consequential damages arising from use of the Service or from any rides arranged through the platform.

10. GOVERNING LAW
These Terms shall be governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Hyderabad, Telangana.

11. CHANGES TO TERMS
We reserve the right to modify these terms at any time. Users will be notified of significant changes via the app. Continued use constitutes acceptance of the revised terms.

Contact us at legal@shareride.in for any questions regarding these Terms.`

const PRIVACY_CONTENT = `Last updated: 1 August 2026

PRIVACY POLICY

1. INFORMATION WE COLLECT
We collect information you provide directly (name, email, phone, profile photo, ID documents), information collected automatically (location data, device info, usage analytics), and information from third parties (Google sign-in, payment processors).

2. HOW WE USE YOUR INFORMATION
- Matching drivers and passengers for ride sharing
- Verifying your identity for safety purposes
- Processing payments and managing your wallet
- Sending notifications about rides and account activity
- Improving our services and personalising your experience
- Complying with legal obligations

3. LOCATION DATA
We collect your precise location when the app is in use to show nearby rides and drivers. You can disable location access via device settings, but this will limit core app functionality.

4. SHARING YOUR INFORMATION
We share limited information with matched ride partners (name, photo, rating, vehicle info), payment processors for transaction processing, identity verification providers, and law enforcement when legally required. We do NOT sell your personal data to advertisers.

5. DATA SECURITY
All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We employ regular security audits and penetration testing. Document uploads are stored in isolated, access-controlled environments.

6. DATA RETENTION
Active account data is retained for the duration of your account. After deletion, most data is purged within 30 days. Financial records are retained for 7 years as required by Indian law.

7. YOUR RIGHTS
You have the right to access your data, request corrections, request deletion, object to processing, and data portability. Contact privacy@shareride.in to exercise these rights.

8. COOKIES
We use essential cookies for session management and analytics cookies (with your consent) to improve the service.

9. CHILDREN'S PRIVACY
Our Service is not directed to individuals under 18. We do not knowingly collect data from minors.

10. CONTACT
Privacy Officer, ShareRide Technologies Pvt. Ltd.
privacy@shareride.in | +91 40 6800 0000`

export default function LegalScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { type } = useLocalSearchParams<{ type: string }>()
  const isTerms = type !== 'privacy'
  const content = isTerms ? TERMS_CONTENT : PRIVACY_CONTENT

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={styles.headerTitle}>{isTerms ? 'Terms of Service' : 'Privacy Policy'}</Text>
        <Text style={styles.version}>v2.4</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={[styles.banner, { backgroundColor: isTerms ? colors.blueSoft : '#F0FDF4', borderColor: isTerms ? colors.blueBorder : colors.greenBorder }]}>
          <Text style={{ fontSize: 26 }}>{isTerms ? '📋' : '🔒'}</Text>
          <View>
            <Text style={[styles.bannerTitle, { color: isTerms ? colors.blue : colors.green }]}>{isTerms ? 'Terms of Service' : 'Privacy Policy'}</Text>
            <Text style={[styles.bannerSub, { color: isTerms ? colors.blueDark : colors.greenDark }]}>
              {isTerms ? 'Rules governing your use of ShareRide' : 'How we collect, use and protect your data'}
            </Text>
          </View>
        </View>

        <View style={{ gap: 14, marginTop: 16 }}>
          {content.split('\n\n').map((para, i) => {
            const isHeading = /^\d+\.\s+[A-Z]/.test(para) || /^[A-Z\s]+$/.test(para.split('\n')[0])
            return (
              <Text key={i} style={isHeading ? styles.heading : styles.paragraph}>{para}</Text>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.slate900 },
  version: { fontSize: 11, color: colors.slate400, fontWeight: '500' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radii.lg, padding: 16, borderWidth: 1 },
  bannerTitle: { fontSize: 14, fontWeight: '700' },
  bannerSub: { fontSize: 11, marginTop: 2 },
  heading: { fontSize: 13, fontWeight: '700', color: colors.slate700 },
  paragraph: { fontSize: 12, color: colors.slate600, lineHeight: 18 },
})
