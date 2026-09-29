import RazorpayCheckout from 'react-native-razorpay'
import { openRazorpayCheckout } from './razorpay'

const OPTIONS = {
  key: 'rzp_test_key',
  order_id: 'order_abc',
  amount: 15000,
  currency: 'INR',
  name: 'ShareRide',
}

// Every payment state this screen can actually be in, per the Phase 13
// brief: no real Razorpay call is ever made here — react-native-razorpay
// is mocked at the module level (jest.config.js's moduleNameMapper), and
// each test below controls exactly what the native module resolves/rejects
// with.
describe('openRazorpayCheckout', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns a success outcome with the checkout payload when the sheet completes', async () => {
    const success = { razorpay_payment_id: 'pay_abc', razorpay_order_id: 'order_abc', razorpay_signature: 'sig_abc' }
    ;(RazorpayCheckout.open as jest.Mock).mockResolvedValueOnce(success)

    const result = await openRazorpayCheckout(OPTIONS)

    expect(result).toEqual({ outcome: 'success', data: success })
  })

  it('returns an unavailable outcome when the native module is missing (Expo Go, no dev-client build)', async () => {
    ;(RazorpayCheckout.open as jest.Mock).mockRejectedValueOnce(new TypeError('Cannot read property open of null'))

    const result = await openRazorpayCheckout(OPTIONS)

    expect(result).toEqual({ outcome: 'unavailable' })
  })

  it('returns a cancelled outcome when the user dismisses the checkout sheet (code 0)', async () => {
    ;(RazorpayCheckout.open as jest.Mock).mockRejectedValueOnce({ code: 0, description: 'Payment Cancelled' })

    const result = await openRazorpayCheckout(OPTIONS)

    expect(result).toEqual({ outcome: 'cancelled' })
  })

  it('returns a cancelled outcome when the description says cancelled even without code 0', async () => {
    ;(RazorpayCheckout.open as jest.Mock).mockRejectedValueOnce({ error: { description: 'User cancelled the transaction' } })

    const result = await openRazorpayCheckout(OPTIONS)

    expect(result).toEqual({ outcome: 'cancelled' })
  })

  it('returns an error outcome with the provider message for a genuine failure', async () => {
    ;(RazorpayCheckout.open as jest.Mock).mockRejectedValueOnce({ error: { description: 'Card declined by issuer' } })

    const result = await openRazorpayCheckout(OPTIONS)

    expect(result).toEqual({ outcome: 'error', message: 'Card declined by issuer' })
  })

  it('falls back to a generic error message when the rejection carries none', async () => {
    ;(RazorpayCheckout.open as jest.Mock).mockRejectedValueOnce({})

    const result = await openRazorpayCheckout(OPTIONS)

    expect(result).toEqual({ outcome: 'error', message: 'Something went wrong' })
  })

  // docs/agent-handoff.md finding C21: the installed SDK constructs a
  // NativeEventEmitter at module-LOAD time, and RN 0.76.5's
  // `new NativeEventEmitter()` throws '`new NativeEventEmitter()` requires
  // a non-null argument.' on iOS when the native module isn't linked
  // (Expo Go, or any build without it) — before this function's own
  // try/catch existed at all, under the previous top-level `import`. The
  // require() is now lazy, inside the try block, specifically so this is
  // reachable instead of crashing the importing screen.
  it('returns an unavailable outcome when requiring the native module itself throws (module-load-time failure)', async () => {
    let freshOpenRazorpayCheckout!: typeof openRazorpayCheckout
    jest.isolateModules(() => {
      jest.doMock('react-native-razorpay', () => {
        throw new Error('`new NativeEventEmitter()` requires a non-null argument.')
      })
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolated re-require to pick up the throwing mock above
      freshOpenRazorpayCheckout = require('./razorpay').openRazorpayCheckout
    })

    const result = await freshOpenRazorpayCheckout(OPTIONS)

    expect(result).toEqual({ outcome: 'unavailable' })
  })
})
