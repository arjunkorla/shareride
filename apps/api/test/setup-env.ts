// Runs before any e2e test file (and therefore before its import of
// AppModule) — ConfigModule.forRoot({validate: validateEnv}) reads
// process.env synchronously the moment app.module.ts is evaluated, so
// these must exist before that first `import` resolves, not inside a
// beforeEach/test body. Values are fixed test doubles, never real
// credentials — nothing here talks to an actual Postgres/Supabase/Razorpay.
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test'
process.env.SUPABASE_URL ??= 'https://test.supabase.co'
process.env.RAZORPAY_WEBHOOK_SECRET ??= 'test-webhook-secret'
