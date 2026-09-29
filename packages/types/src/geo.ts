export interface GeoPoint {
  lat: number
  lng: number
}

export interface NamedLocation {
  label: string
  address: string
  coordinates: GeoPoint
  cityId?: string
}
