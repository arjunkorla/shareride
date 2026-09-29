import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../store/auth-store'
import { colors, radii } from '../lib/theme'
import { ChevronLeftIcon } from '../components/icons'

// Ported from src/screens/ForgotPasswordScreen.tsx. The prototype modeled a
// classic email/OTP/new-password reset flow, but ShareRide's real auth
// (store/auth-store.ts) is phone-OTP only — there is no password to reset.
// This keeps the flow structurally similar (enter phone -> verify code) but
// wires it to the same sendOtp/verifyOtp used by login: successfully
// verifying the code signs the user back in, so "reset" here just means
// re-establishing a session for a number you already own.
type Step = 'phone' | 'otp'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const sendOtp = useAuthStore((s) => s.sendOtp)
  const verifyOtp = useAuthStore((s) => s.verifyOtp)
  const error = useAuthStore((s) => s.error)

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('+91')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const goToLogin = () => router.replace('/login')

  const handleSendOtp = async () => {
    if (submitting || phone.replace(/\D/g, '').length < 10) return
    setSubmitting(true)
    const ok = await sendOtp(phone)
    setSubmitting(false)
    if (ok) setStep('otp')
  }

  const handleVerify = async () => {
    if (submitting) return
    setSubmitting(true)
    const ok = await verifyOtp(phone, code)
    setSubmitting(false)
    // Verifying the code signs the user in; login.tsx will redirect an
    // active session straight to the tabs, so replacing with /login here
    // both satisfies "success returns to login" and lands the user signed in.
    if (ok) goToLogin()
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable style={styles.backButton} onPress={goToLogin}>
        <ChevronLeftIcon />
      </Pressable>

      <Text style={styles.title}>Trouble Signing In?</Text>
      <Text style={styles.subtitle}>
        {step === 'phone'
          ? "Enter your registered mobile number and we'll text you a code to get back into your account."
          : `Enter the code sent to ${phone}`}
      </Text>

      {step === 'phone' ? (
        <View style={styles.form}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <Pressable
            style={[styles.button, (submitting || phone.replace(/\D/g, '').length < 10) && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={submitting || phone.replace(/\D/g, '').length < 10}
          >
            <Text style={styles.buttonText}>{submitting ? 'Sending…' : 'Send Reset Code'}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Reset Code</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
          />

          <Pressable style={styles.button} onPress={handleVerify} disabled={submitting}>
            <Text style={styles.buttonText}>{submitting ? 'Verifying…' : 'Verify & Continue'}</Text>
          </Pressable>

          <Pressable onPress={() => setStep('phone')}>
            <Text style={styles.linkText}>← Change mobile number</Text>
          </Pressable>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable onPress={goToLogin}>
        <Text style={styles.footerText}>← Back to Sign In</Text>
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
  button: { backgroundColor: colors.blue, borderRadius: radii.md, paddingVertical: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  linkText: { fontSize: 13, color: colors.slate500, textAlign: 'center' },
  error: { color: colors.red, fontSize: 13, textAlign: 'center', marginTop: 16 },
  footerText: { fontSize: 13, color: colors.slate500, textAlign: 'center', marginTop: 28, fontWeight: '600' },
})
