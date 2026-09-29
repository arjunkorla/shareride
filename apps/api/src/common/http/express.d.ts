// Declaration merging: adds `requestId` to Express's Request type so every
// handler/filter/interceptor can read `req.requestId` without a cast.
// Set by RequestIdMiddleware, which runs before anything else.
import 'express'

declare module 'express' {
  interface Request {
    requestId: string
  }
}
