import type { RazorpayCheckoutOptions, RazorpayCheckoutSuccess } from 'react-native-razorpay'

export type CheckoutResult =
  | { outcome: 'success'; data: RazorpayCheckoutSuccess }
  | { outcome: 'cancelled' }
  | { outcome: 'unavailable' }
  | { outcome: 'error'; message: string }

// react-native-razorpay is a native module — it doesn't exist in Expo Go
// (only first-party Expo SDK modules are bundled there). The installed SDK
// constructs a NativeEventEmitter at module-LOAD time (not when .open() is
// called), and React Native 0.76.5 throws immediately if that native
// module argument is missing — so a top-level `import` of this package can
// throw before this function's own try/catch even exists, crashing
// whatever screen imports lib/razorpay.ts instead of surfacing the
// documented 'unavailable' outcome below. Requiring it lazily, inside the
// try block, is what actually makes that outcome reachable. See
// docs/agent-handoff.md finding C21.
export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<CheckoutResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberately lazy, see comment above
    const RazorpayCheckout = (require('react-native-razorpay') as { default: { open(options: RazorpayCheckoutOptions): Promise<RazorpayCheckoutSuccess> } }).default
    const data = await RazorpayCheckout.open(options)
    return { outcome: 'success', data }
  } catch (error) {
    if (isNativeModuleMissing(error)) {
      return { outcome: 'unavailable' }
    }
    if (isUserCancellation(error)) {
      return { outcome: 'cancelled' }
    }
    return { outcome: 'error', message: extractMessage(error) }
  }
}

function isNativeModuleMissing(error: unknown): boolean {
  const message = extractMessage(error)
  // Widened to also match the exact message React Native 0.76.5's
  // NativeEventEmitter constructor throws on iOS when the native module
  // argument is null (confirmed against the installed
  // react-native/Libraries/EventEmitter/NativeEventEmitter.js) — the
  // original patterns here were written against what .open() itself
  // rejects with, not what the SDK's own module-load-time
  // `new NativeEventEmitter(...)` call throws. See docs/agent-handoff.md
  // finding C21.
  return /native module|NativeModule|NativeEventEmitter|non-null argument|RazorpayCheckout.*null|cannot read propert.*open/i.test(message)
}

// The SDK rejects a user-dismissed checkout sheet with code 0 /
// "Payment Cancelled" (or an equivalent description depending on
// platform) — distinguished from a real provider/network failure so the
// UI doesn't show an alarming error for someone who just closed the sheet.
function isUserCancellation(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: number; description?: string; error?: { code?: number; description?: string } }
    const code = err.code ?? err.error?.code
    const description = err.description ?? err.error?.description ?? ''
    if (code === 0) return true
    if (/cancel/i.test(description)) return true
  }
  return false
}

function extractMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as { description?: string; error?: { description?: string }; message?: string }
    return err.description ?? err.error?.description ?? err.message ?? 'Something went wrong'
  }
  return String(error)
}
