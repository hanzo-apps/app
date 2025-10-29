import { Workbox } from 'workbox-window';

declare global {
  interface Window {
    workbox: Workbox;
  }
}

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !__DEV__) {
    const wb = new Workbox('/service-worker.js');

    // Store workbox instance globally
    window.workbox = wb;

    // Add event listeners
    wb.addEventListener('installed', (event) => {
      if (!event.isUpdate) {
        console.log('Service Worker installed for the first time');
      }
    });

    wb.addEventListener('waiting', () => {
      // Show update prompt to user
      if (window.confirm('A new version is available! Click OK to update.')) {
        wb.addEventListener('controlling', () => {
          window.location.reload();
        });

        // Send skip waiting message
        wb.messageSkipWaiting();
      }
    });

    wb.addEventListener('activated', (event) => {
      if (event.isUpdate) {
        console.log('Service Worker updated');
      }
    });

    // Register the service worker
    wb.register().catch((error) => {
      console.error('Service Worker registration failed:', error);
    });

    return wb;
  }
  return null;
}

export function unregisterServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('Service Worker unregistration failed:', error);
      });
  }
}

// Helper to check if app is installable
export function isInstallable(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return false;
  }

  // Check if running in a browser that supports PWA
  return 'BeforeInstallPromptEvent' in window;
}

// Helper to trigger install prompt
let deferredPrompt: any;

export function setupInstallPrompt() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
  });
}

export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;

  // Clear the deferred prompt
  deferredPrompt = null;

  return outcome === 'accepted';
}

// Helper for offline detection
export function setupOfflineDetection(
  onOffline?: () => void,
  onOnline?: () => void
) {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    console.log('Back online');
    if (onOnline) onOnline();
  });

  window.addEventListener('offline', () => {
    console.log('Gone offline');
    if (onOffline) onOffline();
  });

  // Check initial state
  if (!navigator.onLine && onOffline) {
    onOffline();
  }
}

// Helper for background sync
export async function registerBackgroundSync(tag: string = 'sync-actions') {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    if ('sync' in registration) {
      await (registration as any).sync.register(tag);
      return true;
    }
  } catch (error) {
    console.error('Background sync registration failed:', error);
  }

  return false;
}

// Helper to check service worker support
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

// Helper to get service worker registration
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration ?? null;
  } catch (error) {
    console.error('Failed to get service worker registration:', error);
    return null;
  }
}

const __DEV__ = process.env.NODE_ENV !== 'production';