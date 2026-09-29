// react-native-razorpay ships no TypeScript definitions (confirmed against
// its published package.json — no "types"/"typings" field) — this
// declares only the surface this app actually calls. A native module: it
// requires a custom development build (EAS Build with expo-dev-client, or
// `expo prebuild`), not Expo Go, since Expo Go only bundles first-party
// Expo SDK native modules. See lib/razorpay.ts for where this is used.
declare module 'react-native-razorpay' {
  export interface RazorpayCheckoutOptions {
    key: string
    order_id: string
    amount: number
    currency: string
    name: string
    description?: string
    prefill?: { email?: string; contact?: string; name?: string }
    theme?: { color?: string }
  }

  export interface RazorpayCheckoutSuccess {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }

  const RazorpayCheckout: {
    open(options: RazorpayCheckoutOptions): Promise<RazorpayCheckoutSuccess>
  }

  export default RazorpayCheckout
}
