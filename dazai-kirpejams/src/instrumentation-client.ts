import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  sendDefaultPii: false,

  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Non-Error promise rejection captured",
    "NetworkError when attempting to fetch resource",
    "Failed to fetch",
    "Load failed",
    /AbortError/,
    /^Script error\.?$/,
    // Hydration mismatches production'e beveik visada atsiranda dėl
    // browser extensions (Grammarly, Dashlane, DeepL, Kaspersky),
    // kurie mutuoja DOM prieš React hydratuoja. React auto-recover'ina,
    // user'iui problema nematoma, bet Sentry gauna triukšmą.
    /Hydration failed/i,
    /Text content does not match server-rendered HTML/i,
    /There was an error while hydrating/i,
    /Minified React error #(418|419|421|422|423|425)/,
  ],

  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    /^safari-extension:\/\//i,
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
