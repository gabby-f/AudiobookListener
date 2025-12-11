// Service Worker registration for Google Drive streaming

let serviceWorkerReady = false;

// Check if service worker is ready to intercept requests
export function isServiceWorkerReady() {
  return serviceWorkerReady;
}

// Wait for service worker to be ready
export function waitForServiceWorker() {
  return new Promise((resolve, reject) => {
    if (serviceWorkerReady) {
      resolve();
      return;
    }
    
    if (!('serviceWorker' in navigator)) {
      reject(new Error('Service workers not supported'));
      return;
    }
    
    navigator.serviceWorker.ready.then(() => {
      serviceWorkerReady = true;
      console.log('✓ Service Worker is ready');
      resolve();
    }).catch(reject);
  });
}

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('✓ Service Worker registered:', registration.scope);
          
          // Check if already controlling
          if (navigator.serviceWorker.controller) {
            serviceWorkerReady = true;
            console.log('✓ Service Worker is controlling the page');
          }
          
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('New service worker available, refresh to update');
                  } else {
                    console.log('Service worker installed for first time');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('Service Worker unregistration failed:', error);
      });
  }
}
