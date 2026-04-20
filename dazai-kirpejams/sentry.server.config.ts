import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://60aed64c02ce09cc1197372d9100e7bc@o4511250944294912.ingest.de.sentry.io/4511250958712912",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
  sendDefaultPii: false,
  ignoreErrors: [
    "NEXT_REDIRECT",
    "NEXT_NOT_FOUND",
  ],
});
