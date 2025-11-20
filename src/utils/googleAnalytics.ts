// Google Analytics 4 Integration

import type { AnalyticsEvent } from '../types/seo';

// GA4 Measurement ID
// To use your own GA4 property, create one at https://analytics.google.com
// and replace this with your Measurement ID (format: G-XXXXXXXXXX)
export const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX';

// Initialize Google Analytics 4
export const initGA4 = (measurementId: string = GA4_MEASUREMENT_ID): void => {
  if (typeof window === 'undefined') return;

  // Load GA4 script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}', {
      send_page_view: false,
      anonymize_ip: true,
    });
  `;
  document.head.appendChild(script2);
};

// Track page view
export const trackPageView = (path: string, title?: string): void => {
  if (typeof window === 'undefined' || !(window as any).gtag) return;

  (window as any).gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
};

// Track custom event
export const trackEvent = (event: AnalyticsEvent): void => {
  if (typeof window === 'undefined' || !(window as any).gtag) return;

  (window as any).gtag('event', event.action, {
    event_category: event.category,
    event_label: event.label,
    value: event.value,
  });
};

// Track user properties
export const setUserProperties = (properties: Record<string, any>): void => {
  if (typeof window === 'undefined' || !(window as any).gtag) return;

  (window as any).gtag('set', 'user_properties', properties);
};

// Track search
export const trackSearch = (searchTerm: string, resultsCount?: number): void => {
  trackEvent({
    category: 'Search',
    action: 'search',
    label: searchTerm,
    value: resultsCount,
  });
};

// Track form submission
export const trackFormSubmission = (formName: string, success: boolean): void => {
  trackEvent({
    category: 'Form',
    action: success ? 'submit_success' : 'submit_error',
    label: formName,
  });
};

// Track button click
export const trackButtonClick = (buttonName: string, location?: string): void => {
  trackEvent({
    category: 'Button',
    action: 'click',
    label: `${buttonName}${location ? ` - ${location}` : ''}`,
  });
};

// Track donation
export const trackDonation = (amount: number, currency: string = 'PKR'): void => {
  if (typeof window === 'undefined' || !(window as any).gtag) return;

  (window as any).gtag('event', 'purchase', {
    transaction_id: `donation_${Date.now()}`,
    value: amount,
    currency: currency,
    items: [{
      item_name: 'Donation',
      item_category: 'Donation',
      price: amount,
      quantity: 1,
    }],
  });
};

// Track volunteer application
export const trackVolunteerApplication = (projectId: string, projectTitle: string): void => {
  trackEvent({
    category: 'Volunteer',
    action: 'application_submit',
    label: projectTitle,
  });

  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'generate_lead', {
      value: 1,
      currency: 'PKR',
      item_id: projectId,
      item_name: projectTitle,
    });
  }
};

// Track registration
export const trackRegistration = (method: string, userType: string): void => {
  if (typeof window === 'undefined' || !(window as any).gtag) return;

  (window as any).gtag('event', 'sign_up', {
    method: method,
    user_type: userType,
  });
};

// Track login
export const trackLogin = (method: string): void => {
  if (typeof window === 'undefined' || !(window as any).gtag) return;

  (window as any).gtag('event', 'login', {
    method: method,
  });
};

// Track error
export const trackError = (errorMessage: string, errorLevel: 'warning' | 'error' | 'fatal' = 'error'): void => {
  trackEvent({
    category: 'Error',
    action: errorLevel,
    label: errorMessage,
  });
};

// Performance monitoring
export const trackPerformance = (metricName: string, value: number): void => {
  if (typeof window === 'undefined' || !(window as any).gtag) return;

  (window as any).gtag('event', 'timing_complete', {
    name: metricName,
    value: Math.round(value),
    event_category: 'Performance',
  });
};

// Get page load metrics
export const getPageLoadMetrics = (): void => {
  if (typeof window === 'undefined' || !window.performance) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const connectTime = perfData.responseEnd - perfData.requestStart;
      const renderTime = perfData.domComplete - perfData.domLoading;

      trackPerformance('page_load', pageLoadTime);
      trackPerformance('connect_time', connectTime);
      trackPerformance('render_time', renderTime);
    }, 0);
  });
};
