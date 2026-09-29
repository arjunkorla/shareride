import { useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'

const PALETTE = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2']

// Deterministic (not random) so the same person always gets the same
// fallback color/initials across renders and sessions — ported from
// src/components/Avatar.tsx.
function colorForName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

interface Props {
  uri?: string
  name: string
  size?: number
}

export default function Avatar({ uri, name, size = 36 }: Props) {
  const [failed, setFailed] = useState(false)
  const showFallback = !uri || failed

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: showFallback ? colorForName(name) : '#E2E8F0' },
      ]}
    >
      {showFallback ? (
        <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initialsForName(name)}</Text>
      ) : (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  initials: { color: 'white', fontWeight: '700' },
})
