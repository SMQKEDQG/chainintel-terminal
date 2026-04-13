import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://ce3b32155569dadc55e3a6e301aebe35@o4511185623973888.ingest.us.sentry.io/4511213869334528',
  
  // Performance monitoring
  tracesSampleRate: 1.0,
  
  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // Environment
  environment: process.env.NODE_ENV,
  
  // Only send errors in production
  enabled: process.env.NODE_ENV === 'production',
});
