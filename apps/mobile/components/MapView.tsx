import { StyleSheet, View } from 'react-native'
import { MapView as RNMapView, Marker, PROVIDER_GOOGLE } from '../lib/native-shims'
import type { GeoPoint } from '@shareride/types'
import { HYDERABAD_CENTER, colors } from '../lib/theme'

export interface MapMarker {
  coordinate: GeoPoint
  kind: 'user' | 'offer' | 'destination'
  priceLabel?: string
}

interface Props {
  markers?: MapMarker[]
  height?: number
}

// Real Google Maps SDK view replacing the prototype's hand-drawn SVG fake
// map (src/components/MapView.tsx) per docs/migration-plan.md Phase 3 —
// starts with a static Hyderabad center and fixture markers, no live
// location/routing yet (that lands with Phase 7's matching engine).
// Requires a Google Maps API key in app.json (see apps/mobile/app.json's
// `android.config.googleMaps.apiKey` / `ios.config.googleMapsApiKey`) —
// unset in this environment, so the map renders but tiles won't load
// until a real key is added; not verified end-to-end here (no
// Android/iOS build tooling in this sandbox).
export default function MapView({ markers, height = 240 }: Props) {
  const defaultMarkers: MapMarker[] = [
    { coordinate: { lat: HYDERABAD_CENTER.latitude, lng: HYDERABAD_CENTER.longitude }, kind: 'user' },
  ]
  const activeMarkers = markers ?? defaultMarkers

  return (
    <View style={[styles.container, { height }]}>
      <RNMapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: HYDERABAD_CENTER.latitude,
          longitude: HYDERABAD_CENTER.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        {activeMarkers.map((m, i) => (
          <Marker
            key={i}
            coordinate={{ latitude: m.coordinate.lat, longitude: m.coordinate.lng }}
            pinColor={m.kind === 'destination' ? colors.red : colors.blue}
            title={m.priceLabel ? `₹${m.priceLabel}` : undefined}
          />
        ))}
      </RNMapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%', overflow: 'hidden', backgroundColor: colors.slate100 },
})
