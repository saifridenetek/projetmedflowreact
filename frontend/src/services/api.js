// Configuration de base de l'API
// Le backend écoute sur le port 3002 (voir backend/src/main.ts)
// En production, utilise la variable d'environnement VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Log pour debug (sera supprimé en production par Vite)
console.log('🌐 API URL:', API_BASE_URL);

const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...options
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Service pour la gestion des profils
export const profileService = {
  // Obtenir le profil utilisateur (utilise l'endpoint d'auth)
  getProfile: () => apiCall('/auth/profile'),
  
  // Mettre à jour le profil
  updateProfile: (profileData) => apiCall('/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  }),
  
  // Upload photo de profil
  uploadPhoto: (photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/profile/photo`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    }).then(response => {
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    });
  }
};

// Service pour la gestion des rendez-vous
export const appointmentService = {
  // Obtenir tous les rendez-vous
  getAll: () => apiCall('/appointments'),
  // Obtenir les rendez-vous d'un médecin
  getByDoctor: (doctorId) => apiCall(`/appointments/doctor/${doctorId}`),
  
  // Obtenir les rendez-vous d'un utilisateur
  getByUser: (userId) => apiCall(`/appointments/user/${userId}`),
  
  // Créer un nouveau rendez-vous
  create: (appointmentData) => apiCall('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData)
  }),
  
  // Mettre à jour un rendez-vous
  update: (id, appointmentData) => apiCall(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(appointmentData)
  }),
  
  // Supprimer un rendez-vous
  delete: (id) => apiCall(`/appointments/${id}`, {
    method: 'DELETE'
  })
};

// Service pour la gestion des consultations
export const consultationService = {
  // Obtenir toutes les consultations
  getAll: () => apiCall('/consultations'),
  // Obtenir les consultations pour le médecin connecté
  getByDoctor: () => apiCall('/consultations/doctor'),
  
  // Obtenir les consultations d'un patient
  // Obtenir les consultations du patient connecté
  getByPatient: () => apiCall(`/consultations/patient`),
  // Obtenir les consultations d'un patient par id (admin/receptionist)
  getByPatientId: (patientId) => apiCall(`/consultations/patient/${patientId}`),
  
  // Créer une nouvelle consultation
  create: (consultationData) => apiCall('/consultations', {
    method: 'POST',
    body: JSON.stringify(consultationData)
  })
};

// Service pour la gestion des prescriptions
export const prescriptionService = {
  // Obtenir toutes les prescriptions
  getAll: () => apiCall('/prescriptions'),
  
  // Obtenir les prescriptions d'un patient
  // for authenticated patient
  getByPatient: () => apiCall(`/prescriptions/patient`),
  // for admin/receptionist/doctor: by patient id
  getByPatientId: (patientId) => apiCall(`/prescriptions/patient/${patientId}`),
  // for authenticated doctor
  getByDoctor: () => apiCall(`/prescriptions/doctor`),
  
  // Créer une nouvelle prescription
  create: (prescriptionData) => apiCall('/prescriptions', {
    method: 'POST',
    body: JSON.stringify(prescriptionData)
  }),
  
  // Générer PDF d'une prescription
  generatePDF: (prescriptionId) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_BASE_URL}/prescriptions/${prescriptionId}/pdf`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
  }
};

// Service pour la gestion des utilisateurs
export const userService = {
  // Obtenir tous les utilisateurs (pour admin/réceptionniste)
  getAll: () => apiCall('/auth/users'),
  
  // Obtenir les utilisateurs par rôle
  getByRole: (role) => apiCall(`/auth/users/role/${role}`)
};

// Service pour la facturation / paiements
export const paymentService = {
  // Create a Stripe Checkout session for an appointment
  createCheckoutSession: (appointmentId, amount, currency='eur') => apiCall('/payments/create-session', {
    method: 'POST',
    body: JSON.stringify({ appointmentId, amount, currency })
  })
};

// Service pour la gestion des cliniques
export const clinicService = {
  // Obtenir toutes les cliniques
  getAll: () => apiCall('/clinics'),
  
  // Obtenir une clinique par ID
  getById: (id) => apiCall(`/clinics/${id}`),
  
  // Créer une nouvelle clinique
  create: (clinicData) => apiCall('/clinics', {
    method: 'POST',
    body: JSON.stringify(clinicData)
  }),
  
  // Mettre à jour une clinique
  update: (id, clinicData) => apiCall(`/clinics/${id}`, {
    method: 'PUT',
    body: JSON.stringify(clinicData)
  }),
  
  // Supprimer une clinique
  delete: (id) => apiCall(`/clinics/${id}`, {
    method: 'DELETE'
  }),
  
  // Affecter un utilisateur à une clinique
  assignUser: (clinicId, userId) => apiCall(`/clinics/${clinicId}/assign-user/${userId}`, {
    method: 'POST'
  }),
  
  // Désaffecter un utilisateur d'une clinique
  unassignUser: (userId) => apiCall(`/clinics/unassign-user/${userId}`, {
    method: 'DELETE'
  }),
  
  // Obtenir les utilisateurs d'une clinique
  getUsers: (clinicId) => apiCall(`/clinics/${clinicId}/users`),
  
  // Obtenir les statistiques d'une clinique
  getStats: (clinicId) => apiCall(`/clinics/${clinicId}/stats`)
};