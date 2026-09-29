import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { Redirect, useRouter } from 'expo-router'
import { useAuthStore } from '../store/auth-store'

// Functional placeholder for Phase 3's real port of src/screens/LoginScreen.tsx
// — same auth flow (phone OTP via Supabase), not yet the ported visual design.
export default function LoginScreen() {
  const router = useRouter()
  const session = useAuthStore((s) => s.session)
  const otpSentTo = useAuthStore((s) => s.otpSentTo)
  const error = useAuthStore((s) => s.error)
  const sendOtp = useAuthStore((s) => s.sendOtp)
  const verifyOtp = useAuthStore((s) => s.verifyOtp)

  const [phone, setPhone] = useState('+91')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (session) return <Redirect href="/(tabs)" />

  const handleSendOtp = async () => {
    setSubmitting(true)
    await sendOtp(phone)
    setSubmitting(false)
  }

  const handleVerify = async () => {
    setSubmitting(true)
    await verifyOtp(phone, code)
    setSubmitting(false)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ShareRide</Text>
      <Text style={styles.subtitle}>Sign in with your mobile number</Text>

      {!otpSentTo ? (
        <>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          <Pressable style={styles.button} onPress={handleSendOtp} disabled={submitting}>
            <Text style={styles.buttonText}>{submitting ? 'Sending…' : 'Send code'}</Text>
          </Pressable>

          <View style={styles.linksRow}>
            <Pressable onPress={() => router.push('/forgot-password')}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/register')}>
              <Text style={styles.linkText}>
                Don't have an account? <Text style={styles.linkTextBold}>Sign up</Text>
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.hint}>Enter the code sent to {otpSentTo}</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            keyboardType="number-pad"
          />
          <Pressable style={styles.button} onPress={handleVerify} disabled={submitting}>
            <Text style={styles.buttonText}>{submitting ? 'Verifying…' : 'Verify & continue'}</Text>
          </Pressable>
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 16 },
  hint: { fontSize: 13, color: '#64748B' },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  error: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  linksRow: { alignItems: 'center', gap: 10, marginTop: 4 },
  linkText: { fontSize: 13, color: '#64748B' },
  linkTextBold: { color: '#2563EB', fontWeight: '700' },
})
