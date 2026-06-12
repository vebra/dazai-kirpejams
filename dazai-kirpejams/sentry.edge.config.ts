import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // 2% pakanka našumo tendencijoms; žr. sentry.server.config.ts.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.02 : 1,
  sendDefaultPii: false,
});
