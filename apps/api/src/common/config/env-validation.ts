// class-validator's decorators need Reflect.getMetadata, which TypeScript's
// emitDecoratorMetadata only calls if a reflect-metadata polyfill has
// already been loaded. main.ts gets this for free (NestJS's own bootstrap
// imports it transitively before any decorated class loads), but this
// module can also be imported standalone (e.g. by its own unit test), so
// it can't rely on that — hence the explicit import here.
import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { IsIn, IsNotEmpty, IsOptional, IsString, validateSync } from 'class-validator'

// Required for the API to function at all — everything else in this file
// is an optional provider that degrades gracefully when unset (matching
// falls back to straight-line distance, payments fail closed with a clear
// 503 instead of a fake success, Sentry simply doesn't initialize). See
// apps/api/src/main.ts for where this runs and .env.example for what each
// variable is for.
class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string

  @IsString()
  @IsNotEmpty()
  SUPABASE_URL!: string

  @IsOptional() @IsString() REDIS_URL?: string
  @IsOptional() @IsString() RAZORPAY_KEY_ID?: string
  @IsOptional() @IsString() RAZORPAY_KEY_SECRET?: string
  @IsOptional() @IsString() RAZORPAY_WEBHOOK_SECRET?: string
  @IsOptional() @IsString() GOOGLE_MAPS_API_KEY?: string
  @IsOptional() @IsString() SENTRY_DSN?: string
  @IsOptional() @IsIn(['development', 'production', 'test']) NODE_ENV?: string
}

// Passed to ConfigModule.forRoot({ validate }) — Nest calls this once at
// startup with the raw process.env, before any provider can read from it.
// A misconfigured required variable now fails fast with a specific
// message instead of surfacing later as an opaque Prisma/JWKS error deep
// in a request handler.
export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true })
  const errors = validateSync(validated, { skipMissingProperties: false })

  if (errors.length > 0) {
    // Only ever the property name + constraint message (e.g. "should not
    // be empty") — never `error.value`, which would echo the actual
    // (possibly secret) configured value back into the startup log.
    const problems = errors.map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
    throw new Error(`Invalid environment configuration:\n${problems.join('\n')}`)
  }

  return validated
}
