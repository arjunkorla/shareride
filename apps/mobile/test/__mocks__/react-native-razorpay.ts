// Global jest module stub for the native-only react-native-razorpay
// package (see jest.config.js's moduleNameMapper and lib/razorpay.ts's own
// comment — real Razorpay Checkout only runs in a custom EAS/dev-client
// build, never in a test environment). `open` always rejects by default
// so a test that forgets to mock it explicitly fails loudly instead of
// silently "succeeding" a payment; individual specs override this with
// their own jest.mock('react-native-razorpay', ...) per scenario.
const RazorpayCheckout = {
  open: jest.fn().mockRejectedValue(new Error('react-native-razorpay: no test mock configured for this call')),
}

export default RazorpayCheckout
