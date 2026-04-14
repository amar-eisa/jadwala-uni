import * as amplitude from '@amplitude/analytics-browser';

const AMPLITUDE_API_KEY = import.meta.env.VITE_AMPLITUDE_API_KEY || '14a81d93f09ab5c90d60cbaba8336039';

export function initAmplitude() {
  if (!AMPLITUDE_API_KEY) {
    console.warn('Amplitude API key not configured');
    return;
  }
  amplitude.init(AMPLITUDE_API_KEY, {
    autocapture: { elementInteractions: false },
  });
}

export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (!AMPLITUDE_API_KEY) return;
  amplitude.setUserId(userId);
  if (properties) {
    const identify = new amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
      identify.set(key, value);
    });
    amplitude.identify(identify);
  }
}

export function resetUser() {
  if (!AMPLITUDE_API_KEY) return;
  amplitude.reset();
}

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (!AMPLITUDE_API_KEY) return;
  amplitude.track(eventName, properties);
}

// Auth events
export const trackLogin = (method = 'email') => trackEvent('user_login', { method });
export const trackSignup = (method = 'email') => trackEvent('user_signup', { method });
export const trackLogout = () => trackEvent('user_logout');

// Navigation
export const trackPageView = (path: string, pageName?: string) =>
  trackEvent('page_view', { path, page_name: pageName });

// Schedule events
export const trackScheduleCreated = (props?: Record<string, any>) =>
  trackEvent('schedule_created', props);
export const trackScheduleSaved = (props?: Record<string, any>) =>
  trackEvent('schedule_saved', props);
export const trackScheduleExported = (format?: string) =>
  trackEvent('schedule_exported', { format });
export const trackScheduleCleared = () => trackEvent('schedule_cleared');
export const trackScheduleEntryMoved = () => trackEvent('schedule_entry_moved');
