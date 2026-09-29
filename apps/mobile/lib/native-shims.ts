import type { ComponentType, ReactNode } from 'react'
import RNSvg, {
  Circle as RNCircle,
  Line as RNLine,
  Path as RNPath,
  Rect as RNRect,
  type CircleProps,
  type LineProps,
  type PathProps,
  type RectProps,
  type SvgProps,
} from 'react-native-svg'
import RNMapView, { Marker as RNMarker, PROVIDER_GOOGLE as RNProviderGoogle, type MapMarkerProps, type MapViewProps } from 'react-native-maps'

// react-native-svg and react-native-maps import `Component` from the bare
// `react` module without declaring an @types/react dependency of their
// own. This workspace has two @types/react majors (the root Vite
// prototype pins React 19, apps/mobile pins React 18.3), and pnpm's
// module resolution for that bare `react` type import walks up past
// apps/mobile's own @types/react and lands on the root's — producing
// "cannot be used as a JSX component" / "Property 'refs' is missing"
// errors, since the two versions' `Component` classes are structurally
// incompatible. Re-typing these as plain function components against
// apps/mobile's own React types (rather than fighting pnpm's hoisting)
// sidesteps the mismatch without changing runtime behavior.
export const Svg = RNSvg as unknown as ComponentType<SvgProps>
export const Circle = RNCircle as unknown as ComponentType<CircleProps>
export const Line = RNLine as unknown as ComponentType<LineProps>
export const Path = RNPath as unknown as ComponentType<PathProps>
export const Rect = RNRect as unknown as ComponentType<RectProps>

export const MapView = RNMapView as unknown as ComponentType<MapViewProps & { children?: ReactNode }>
export const Marker = RNMarker as unknown as ComponentType<MapMarkerProps>
export const PROVIDER_GOOGLE = RNProviderGoogle
