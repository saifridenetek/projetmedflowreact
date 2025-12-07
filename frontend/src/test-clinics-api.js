// Test de l'API Cliniques
// Ouvrez la console du navigateur (F12) et exécutez ce code

const token = localStorage.getItem('token');
console.log('Token:', token);

// Test 1: Récupérer toutes les cliniques
fetch('http://localhost:3002/clinics', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('✅ Cliniques:', data);
})
.catch(err => {
  console.error('❌ Erreur cliniques:', err);
});

// Test 2: Créer une clinique de test
const newClinic = {
  name: 'Clinique Test',
  address: '123 Rue Test',
  phone: '01 23 45 67 89',
  email: 'test@clinic.com',
  isActive: true
};

fetch('http://localhost:3002/clinics', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newClinic)
})
.then(res => res.json())
.then(data => {
  console.log('✅ Clinique créée:', data);
})
.catch(err => {
  console.error('❌ Erreur création:', err);
});

// Test 3: Vérifier le rôle de l'utilisateur
const tokenParts = token.split('.');
const payload = JSON.parse(atob(tokenParts[1]));
console.log('🔐 Payload du token:', payload);
console.log('👤 Rôle:', payload.role);
console.log('✅ Est admin?', payload.role === 'admin');
