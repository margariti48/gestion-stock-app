// Service Worker : Installation
self.addEventListener('install', function(event) {
  console.log('✅ Service Worker installé');
});

// Service Worker : Interception des requêtes
self.addEventListener('fetch', function(event) {
  // Plus tard, on pourra mettre en cache les fichiers ici
});
