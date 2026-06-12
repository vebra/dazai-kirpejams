import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // 2% pakanka našumo tendencijoms; kiekviena transakcija kainuoja serverio
  // CPU laiką (Vercel Fluid Active CPU).
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.02 : 1,
  sendDefaultPii: false,
  ignoreErrors: [
    "NEXT_REDIRECT",
    "NEXT_NOT_FOUND",
  ],
});
