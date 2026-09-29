import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../store/auth-store'
import { colors, radii } from '../lib/theme'
import { ChevronLeftIcon } from '../components/icons'

// Ported from src/screens/RegisterScreen.tsx. The prototype was designed
// around an email/password sign-up form, but the real mobile auth (see
// store/auth-store.ts, wired into app/login.tsx) is phone-OTP only via
// Supabase — so this becomes "enter your name + phone" flowing into the
// same OTP verification step as login, rather than a fake password field.
type Step = 'form' | 'otp'

export default function RegisterScreen() {
  const router = useRouter()
  const sendOtp = useAuthStore((s) => s.sendOtp)
  const verifyOtp = useAuthStore((s) => s.verifyOtp)
  const error = useAuthStore((s) => s.error)

  const [step, setStep] = useState<Step>('form')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('+91')
  const [code, setCode] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = fullName.trim().length > 0 && phone.replace(/\D/g, '').length >= 10 && agreed

  const goToLogin = () => router.replace('/login')

  const handleSendOtp = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    const ok = await sendOtp(phone, { fullName: fullName.trim() })
    setSubmitting(false)
    if (ok) setStep('otp')
  }

  const handleVerify = async () => {
    if (submitting) return
    setSubmitting(true)
    const ok = await verifyOtp(phone, code)
    setSubmitting(false)
    if (ok) router.replace('/(tabs)')
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.backButton} onPress={goToLogin}>
        <ChevronLeftIcon />
      </Pressable>

      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>
        {step === 'form'
          ? 'Join ShareRide to request or offer rides across the city.'
          : `Enter the code sent to ${phone}`}
      </Text>

      {step === 'form' ? (
        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Rahul Verma"
            autoComplete="name"
          />

          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <Pressable style={styles.checkboxRow} onPress={() => setAgreed((a) => !a)}>
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkboxMark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              I agree to the Terms of Service and Privacy Policy, and consent to the processing of my personal
              data.
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, (!canSubmit || submitting) && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={!canSubmit || submitting}
          >
            <Text style={styles.buttonText}>{submitting ? 'Sending…' : 'Send Verification Code'}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
          />

          <Pressable style={styles.button} onPress={handleVerify} disabled={submitting}>
            <Text style={styles.buttonText}>{submitting ? 'Verifying…' : 'Verify & Create Account'}</Text>
          </Pressable>

          <Pressable onPress={() => setStep('form')}>
            <Text style={styles.linkText}>← Change mobile number</Text>
          </Pressable>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable onPress={goToLogin}>
        <Text style={styles.footerText}>
          Already have an account? <Text style={styles.footerLink}>Sign In</Text>
        </Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { flexGrow: 1, padding: 24, paddingTop: 56 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.slate900 },
  subtitle: { fontSize: 14, color: colors.slate500, marginTop: 6, marginBottom: 24, lineHeight: 20 },
  form: { gap: 16 },
  label: { fontSize: 12, fontWeight: '600', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.slate50,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.slate900,
    marginTop: -8,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.slate300,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: colors.blue, borderColor: colors.blue },
  checkboxMark: { color: 'white', fontSize: 12, fontWeight: '700' },
  checkboxLabel: { flex: 1, fontSize: 12, color: colors.slate500, lineHeight: 18 },
  button: { backgroundColor: colors.blue, borderRadius: radii.md, paddingVertical: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  linkText: { fontSize: 13, color: colors.slate500, textAlign: 'center' },
  error: { color: colors.red, fontSize: 13, textAlign: 'center', marginTop: 16 },
  footerText: { fontSize: 13, color: colors.slate500, textAlign: 'center', marginTop: 28 },
  footerLink: { color: colors.blue, fontWeight: '700' },
})
