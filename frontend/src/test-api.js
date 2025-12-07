// Test rapide de l'API statistics
// Ouvrez ce fichier dans le navigateur à l'adresse: http://localhost:3002/admin/statistics
// Ou testez avec curl/Postman

console.log('Pour tester l API, utilisez:');
console.log('1. Démarrez le backend: npm run start');
console.log('2. Dans Postman ou curl:');
console.log('   GET http://localhost:3002/admin/statistics');
console.log('   Header: Authorization: Bearer [VOTRE_TOKEN_ADMIN]');
console.log('');
console.log('Ou testez directement les données utilisateur:');
console.log('   GET http://localhost:3002/admin/users');

// Test simple sans authentification pour vérifier que le serveur répond
fetch('http://localhost:3002/admin/statistics')
  .then(response => {
    console.log('Status:', response.status);
    if (response.status === 401) {
      console.log('✅ Serveur actif mais authentification requise (normal)');
    }
    return response.text();
  })
  .then(data => console.log('Réponse:', data))
  .catch(error => console.log('❌ Serveur non disponible:', error));