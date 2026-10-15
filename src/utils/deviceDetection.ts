/**
 * Device detection and media capability helpers for cross-platform support.
 */

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  const isTouchDevice =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0;

  return mobileRegex.test(userAgent) || (window.innerWidth <= 768 && isTouchDevice);
};

export const hasMediaDeviceSupport = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return Boolean(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
};
