// Key names that must never appear in a log line, regardless of which
// object they show up on — checked case-insensitively so
// "Authorization"/"authorization"/"AUTHORIZATION" all match. Deliberately
// broad (better to over-redact an innocuous field than under-redact a
// real secret).
const SENSITIVE_KEY_PATTERN = /token|secret|signature|password|otp|authorization|apikey|api_key|private_key|privatekey/i

const MAX_DEPTH = 6

export function redact(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return '[redacted:max-depth]'
  if (value === null || typeof value !== 'object') return value

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1))
  }

  const output: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    output[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : redact(val, depth + 1)
  }
  return output
}
