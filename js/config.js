/*
 * Site configuration. Loads in <head> before everything else.
 * Students normally never edit this file: use ?gtm=GTM-XXXXXXX or the demo panel instead.
 */
window.KL_CONFIG = {
  siteVersion: '1.0.0',

  // Default GTM container. The placeholder means "no container": the GTM snippet is skipped.
  gtmId: 'GTM-XXXXXXX',

  // Optional GTM environment parameters (chapter I6.3). Leave empty for the live container.
  gtmAuth: '',
  gtmPreview: '',

  // Separate-origin helpers. Relative paths work out of the box (same origin, handy for a quick look).
  // For the real cross-domain demo, host /gateway and /booking-widget elsewhere (or run them as their own
  // Live Server windows on other ports) and put the full URLs here or in the demo panel.
  gatewayUrl: 'gateway/index.html',
  bookingUrl: 'booking-widget/index.html',

  // Placeholder video for the brewing guide. Replace with a real YouTube video ID.
  youtubeId: 'M7lc1UVf-VE'
};
