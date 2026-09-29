import { useEffect, useRef, useState } from 'react'
import { Alert, Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CloseIcon, SosIcon } from '../components/icons'
import { radii } from '../lib/theme'

interface EmergencyAction {
  id: string
  icon: string
  label: string
  sub: string
}

const ACTIONS: EmergencyAction[] = [
  { id: 'police', icon: '🚔', label: 'Call Police', sub: '100' },
  { id: 'ambulance', icon: '🚑', label: 'Call Ambulance', sub: '108' },
  { id: 'helpline', icon: '📞', label: "Women's Helpline", sub: '1091' },
]

// Ported from src/screens/SOSScreen.tsx as a full-screen safety overlay.
// The prototype's CSS gradient/keyframe pulse becomes a solid emergency-red
// background plus a native Animated pulse ring (no expo-linear-gradient
// dependency added).
//
// Calling is REAL: `Linking.openURL('tel:...')` hands off to the OS
// dialer, which needs no backend and no new native dependency. There is
// no live-location tracking or emergency-contact delivery backend in this
// product (no GPS capture, no SMS/notification delivery path) — this
// screen must never claim either happened. See the audit that flagged the
// previous version fabricating "Your location is being tracked" /
// "Sent to your emergency contacts" with no capability behind either
// claim (docs/agent-handoff.md, finding C02).
export default function SOSScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [callingId, setCallingId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  useEffect(() => () => {
    if (countdownTimer.current) clearInterval(countdownTimer.current)
  }, [])

  const dial = async (action: EmergencyAction) => {
    const url = `tel:${action.sub}`
    const supported = await Linking.canOpenURL(url)
    if (!supported) {
      Alert.alert('Unable to call', `This device can't place a call to ${action.sub} directly. Please dial it manually.`)
      setCallingId(null)
      setCountdown(null)
      return
    }
    await Linking.openURL(url)
    setCallingId(null)
    setCountdown(null)
  }

  const startCall = (id: string) => {
    const action = ACTIONS.find((a) => a.id === id)
    if (!action) return
    setCallingId(id)
    setCountdown(3)
    countdownTimer.current = setInterval(() => {
      setCountdown((c) => {
        if (c === null || c <= 1) {
          if (countdownTimer.current) clearInterval(countdownTimer.current)
          void dial(action)
          return null
        }
        return c - 1
      })
    }, 1000)
  }

  const cancelCall = () => {
    if (countdownTimer.current) clearInterval(countdownTimer.current)
    setCallingId(null)
    setCountdown(null)
  }

  const pulseStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.closeRow, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <CloseIcon color="white" size={16} />
        </Pressable>
      </View>

      <View style={styles.center}>
        <View style={styles.badgeWrap}>
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
          <View style={styles.badge}>
            <SosIcon size={40} />
          </View>
        </View>

        <Text style={styles.title}>Emergency SOS</Text>
        <Text style={styles.subtitle}>Choose an action below.</Text>

        <View style={{ width: '100%', gap: 12 }}>
          {ACTIONS.map((action) => {
            const isCalling = callingId === action.id
            return (
              <Pressable
                key={action.id}
                style={[styles.actionRow, isCalling && styles.actionRowActive]}
                onPress={() => (isCalling ? cancelCall() : startCall(action.id))}
              >
                <Text style={{ fontSize: 28 }}>{action.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Text style={styles.actionSub}>
                    {isCalling && countdown !== null ? `Calling in ${countdown}s... (tap to cancel)` : `Dial ${action.sub}`}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            )
          })}
        </View>

        {/* No live-location tracking or emergency-contact delivery backend
            exists in this product yet (no GPS capture, no SMS/push
            delivery path) — this is disabled and honestly labelled rather
            than faking a "shared" success state. See sos.tsx's top
            comment. */}
        <Pressable
          style={[styles.shareRow, styles.shareRowDisabled]}
          onPress={() => Alert.alert('Not available yet', 'Live location sharing with emergency contacts is not available in this version of the app.')}
        >
          <Text style={{ fontSize: 22 }}>📡</Text>
          <View>
            <Text style={styles.shareLabel}>Share Live Location</Text>
            <Text style={styles.shareSub}>Not available yet</Text>
          </View>
        </Pressable>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable style={styles.dismissButton} onPress={() => router.back()}>
          <Text style={styles.dismissText}>I am Safe — Dismiss</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#991B1B' },
  closeRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20 },
  closeButton: {
    width: 40, height: 40, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  badgeWrap: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  pulseRing: { position: 'absolute', width: 112, height: 112, borderRadius: 56, backgroundColor: 'rgba(255,255,255,0.2)' },
  badge: { width: 112, height: 112, borderRadius: 56, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: 'white', textAlign: 'center' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 24, lineHeight: 19 },
  actionRow: {
    width: '100%', flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 18, paddingVertical: 16,
    borderRadius: radii.xl, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  actionRowActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  actionLabel: { fontSize: 15, fontWeight: '700', color: 'white' },
  actionSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  chevron: { fontSize: 22, color: 'white', fontWeight: '300' },
  shareRow: {
    width: '100%', marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 16,
    borderRadius: radii.xl, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  shareRowDisabled: { opacity: 0.5 },
  shareLabel: { fontSize: 13, fontWeight: '700', color: 'white' },
  shareSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  footer: { paddingHorizontal: 20 },
  dismissButton: {
    paddingVertical: 16, borderRadius: radii.xl, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  dismissText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
})
