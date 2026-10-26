// Browsers that require a service worker to offer "Install" get this one. It does not cache and answers nothing:
// every request goes to the network, so Cloudflare Access and the app always decide.
self.addEventListener('fetch', () => {});
