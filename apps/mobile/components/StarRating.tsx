import { View } from 'react-native'
import { StarIcon } from './icons'

export default function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <StarIcon key={s} size={size} filled={s <= Math.round(rating)} />
      ))}
    </View>
  )
}
