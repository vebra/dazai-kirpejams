import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://60aed64c02ce09cc1197372d9100e7bc@o4511250944294912.ingest.de.sentry.io/4511250958712912",

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
