import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './Home';
import { Login } from './Login';
import { Register } from './Register';
import { useState, useEffect } from 'react';
import './App.css';

// Configuration de l'URL de l'API depuis les variables d'environnement
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

// Composant Admin avec navigation et statistiques
function Admin() {
  const { user, token, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalReceptionists: 0,
    totalPatients: 0
  });
  const [users, setUsers] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateClinic, setShowCreateClinic] = useState(false);
  const [showAssignUserModal, setShowAssignUserModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  
  const [newClinic, setNewClinic] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    isActive: true
  });
  
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'doctor',
    phone: '',
    specialty: '',
    licenseNumber: '',
    consultationFee: '',
    department: ''
  });

  useEffect(() => {
    if (activeSection === 'dashboard') {
      fetchUsers(); // Récupère users et calcule les stats
    } else if (activeSection === 'users') {
      fetchUsers();
    } else if (activeSection === 'clinics') {
      fetchClinics();
      fetchUsers(); // Pour l'affectation
    }
  }, [activeSection]);

  const fetchStatistics = async () => {
    console.log('=== DEBUT fetchStatistics ===');
    console.log('Token présent:', !!token);
    console.log('Token:', token ? 'existe' : 'manquant');
    
    if (!token) {
      console.log('Pas de token, abandon fetchStatistics');
      return;
    }
    
    setLoading(true);
    console.log('Appel API /admin/statistics...');
    try {
      const response = await fetch('${API_BASE_URL}/admin/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('Réponse API status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('=== DEBUG STATISTIQUES ===');
        console.log('Données reçues:', data);
        console.log('totalUsers:', data.totalUsers);
        console.log('totalPatients:', data.totalPatients);
        console.log('totalDoctors:', data.totalDoctors);
        console.log('totalReceptionists:', data.totalReceptionists);
        setStatistics(data);
      } else {
        console.error('Erreur lors de la récupération des statistiques', response.status);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch('${API_BASE_URL}/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        const usersList = data.users || [];
        setUsers(usersList);
        
        // Calculer les statistiques directement depuis les utilisateurs
        const stats = {
          totalUsers: usersList.length,
          totalDoctors: usersList.filter(u => u.role === 'doctor').length,
          totalPatients: usersList.filter(u => u.role === 'patient').length,
          totalReceptionists: usersList.filter(u => u.role === 'receptionist').length,
          totalAdmins: usersList.filter(u => u.role === 'admin').length
        };
        
        console.log('=== CALCUL STATISTIQUES DEPUIS USERS ===');
        console.log('Users récupérés:', usersList.length);
        console.log('Rôles:', usersList.map(u => ({ email: u.email, role: u.role })));
        console.log('Stats calculées:', stats);
        
        setStatistics(stats);
      } else {
        console.error('Erreur lors de la récupération des utilisateurs');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!token) return;

    console.log('=== CREATION UTILISATEUR ===');
    console.log('Données à envoyer:', newUser);

    setLoading(true);
    try {
      const requestBody = {
        ...newUser,
        consultationFee: newUser.consultationFee ? parseFloat(newUser.consultationFee) : undefined,
        confirmPassword: newUser.password
      };
      
      console.log('Request body:', requestBody);

      const response = await fetch('${API_BASE_URL}/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        setShowCreateUser(false);
        setNewUser({
          email: '',
          firstName: '',
          lastName: '',
          password: '',
          role: 'doctor',
          phone: '',
          specialty: '',
          licenseNumber: '',
          consultationFee: '',
          department: ''
        });
        fetchUsers();
        alert('Utilisateur créé avec succès');
      } else {
        const errorData = await response.json();
        console.log('Erreur détaillée:', errorData);
        alert('Erreur: ' + (errorData.message || JSON.stringify(errorData) || 'Impossible de créer l\'utilisateur'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    logout();
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setNewUser({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: '',
      role: user.role,
      phone: user.phone || '',
      specialty: user.specialty || '',
      licenseNumber: user.licenseNumber || '',
      consultationFee: user.consultationFee || '',
      department: user.department || ''
    });
    setShowEditUser(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!token || !selectedUser) {
      alert('Erreur d\'authentification');
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        role: newUser.role,
      };

      // Ajouter les champs spécifiques selon le rôle
      if (newUser.role === 'doctor') {
        updateData.specialty = newUser.specialty;
        updateData.licenseNumber = newUser.licenseNumber;
        updateData.consultationFee = newUser.consultationFee ? parseFloat(newUser.consultationFee) : undefined;
      } else if (newUser.role === 'receptionist') {
        updateData.department = newUser.department;
      }

      // Si un nouveau mot de passe est fourni
      if (newUser.password && newUser.password.trim() !== '') {
        updateData.password = newUser.password;
      }

      const response = await fetch(`http://localhost:3002/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setShowEditUser(false);
        setSelectedUser(null);
        setNewUser({
          email: '',
          firstName: '',
          lastName: '',
          password: '',
          role: 'doctor',
          phone: '',
          specialty: '',
          licenseNumber: '',
          consultationFee: '',
          department: ''
        });
        fetchUsers();
        alert('Utilisateur modifié avec succès');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        alert(`Erreur: ${errorData.message || 'Impossible de modifier l\'utilisateur'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion. Vérifiez que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3002/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        alert('Utilisateur supprimé avec succès');
        fetchUsers(); // Recharger la liste et recalculer les stats
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    }
  };

  // ===== FONCTIONS CLINIQUES =====
  const fetchClinics = async () => {
    setLoading(true);
    try {
      const response = await fetch('${API_BASE_URL}/clinics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClinics(data.clinics || []);
      } else {
        console.error('Erreur lors du chargement des cliniques');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClinic = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('${API_BASE_URL}/clinics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newClinic),
      });

      if (response.ok) {
        setShowCreateClinic(false);
        setNewClinic({
          name: '',
          address: '',
          phone: '',
          email: '',
          isActive: true
        });
        fetchClinics();
        alert('Clinique créée avec succès');
      } else {
        alert('Erreur lors de la création de la clinique');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUserToClinic = async (userId, clinicId) => {
    setLoading(true);
    
    try {
      const response = await fetch(`http://localhost:3002/clinics/${clinicId}/assign-user/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setShowAssignUserModal(false);
        setSelectedClinic(null);
        fetchClinics();
        alert('Utilisateur affecté avec succès');
      } else {
        alert('Erreur lors de l\'affectation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignUser = async (userId) => {
    if (!confirm('Voulez-vous vraiment désaffecter cet utilisateur ?')) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3002/clinics/unassign-user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchClinics();
        fetchUsers();
        alert('Utilisateur désaffecté avec succès');
      } else {
        alert('Erreur lors de la désaffectation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '👑';
      case 'doctor': return '👨‍⚕️';
      case 'receptionist': return '🏥';
      case 'patient': return '😷';
      default: return '👤';
    }
  };

  const getRoleDisplayName = (role) => {
    return role; // Afficher le rôle tel quel
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#dc3545';
      case 'doctor': return '#28a745';
      case 'receptionist': return '#17a2b8';
      case 'patient': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        background: '#2c3e50',
        color: 'white',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h2 style={{ margin: '0 0 30px 0' }}>MedFlow Admin</h2>
        
        <nav style={{ flex: 1 }}>
          <button 
            onClick={() => setActiveSection('dashboard')}
            style={{ 
              width: '100%',
              padding: '15px 0', 
              borderBottom: '1px solid #34495e',
              marginBottom: '20px',
              background: activeSection === 'dashboard' ? '#34495e' : 'transparent',
              color: 'white',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
          >
            📊 Tableau de bord
          </button>
          <button 
            onClick={() => setActiveSection('users')}
            style={{ 
              width: '100%',
              padding: '15px 0', 
              borderBottom: '1px solid #34495e',
              marginBottom: '20px',
              background: activeSection === 'users' ? '#34495e' : 'transparent',
              color: 'white',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
          >
            👥 Utilisateurs
          </button>
          <button 
            onClick={() => setActiveSection('clinics')}
            style={{ 
              width: '100%',
              padding: '15px 0', 
              borderBottom: '1px solid #34495e',
              marginBottom: '20px',
              background: activeSection === 'clinics' ? '#34495e' : 'transparent',
              color: 'white',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
          >
            🏥 Gestion cliniques
          </button>
        </nav>

        <div style={{
          borderTop: '1px solid #34495e',
          paddingTop: '20px'
        }}>
          <p>👤 {user?.firstName} {user?.lastName}</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{user?.role}</p>
          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        padding: '30px',
        background: '#f8f9fa'
      }}>
        {activeSection === 'dashboard' && (
          <>
            <h1>Tableau de bord administrateur</h1>
            <p>Bienvenue, {user?.firstName} {user?.lastName}</p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginTop: '30px'
            }}>
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👥</div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>TOTAL UTILISATEURS</h3>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
                  {loading ? '...' : (statistics.totalUsers ?? 0)}
                </div>
              </div>
              
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>👨‍⚕️</div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>MÉDECINS</h3>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
                  {loading ? '...' : (statistics.totalDoctors ?? 0)}
                </div>
              </div>
              
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏥</div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>RÉCEPTIONNISTES</h3>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
                  {loading ? '...' : (statistics.totalReceptionists ?? 0)}
                </div>
              </div>
              
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>😷</div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666' }}>PATIENTS</h3>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>
                  {loading ? '...' : (statistics.totalPatients ?? 0)}
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h1>Gestion des utilisateurs</h1>
              <button 
                onClick={() => setShowCreateUser(true)}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                + Ajouter un utilisateur
              </button>
            </div>
            
            {loading && <p>Chargement des utilisateurs...</p>}
            
            {users.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr 1.5fr 1fr 1.5fr',
                  padding: '15px 20px',
                  background: '#f8f9fa',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #e9ecef'
                }}>
                  <div>Nom</div>
                  <div>Email</div>
                  <div>Rôle</div>
                  <div>Date</div>
                  <div>Actions</div>
                </div>
                {users.map(user => (
                  <div key={user.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 1.5fr 1fr 1.5fr',
                    padding: '15px 20px',
                    borderBottom: '1px solid #e9ecef',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '10px', fontSize: '1.2rem' }}>{getRoleIcon(user.role)}</span>
                      {user.firstName} {user.lastName}
                    </div>
                    <div>{user.email}</div>
                    <div>
                      <span style={{
                        background: getRoleColor(user.role),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </div>
                    <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleEditUser(user)}
                        style={{
                          background: '#6c757d',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Modifier
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '5px 10px',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal de création d'utilisateur */}
            {showCreateUser && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '10px',
                  width: '90%',
                  maxWidth: '600px',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>Créer un nouvel utilisateur</h2>
                    <button 
                      onClick={() => setShowCreateUser(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  </div>
                  
                  <form onSubmit={handleCreateUser}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénom *</label>
                        <input
                          type="text"
                          value={newUser.firstName}
                          onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom *</label>
                        <input
                          type="text"
                          value={newUser.lastName}
                          onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px'
                          }}
                          required
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email *</label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mot de passe *</label>
                        <input
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px'
                          }}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Rôle *</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ccc',
                          borderRadius: '5px'
                        }}
                        required
                      >
                        <option value="doctor">Médecin</option>
                        <option value="receptionist">Réceptionniste</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </div>

                    {/* Champs spécifiques aux médecins */}
                    {newUser.role === 'doctor' && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Spécialité *</label>
                            <input
                              type="text"
                              value={newUser.specialty}
                              onChange={(e) => setNewUser({...newUser, specialty: e.target.value})}
                              required
                              style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '5px'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Numéro de licence *</label>
                            <input
                              type="text"
                              value={newUser.licenseNumber}
                              onChange={(e) => setNewUser({...newUser, licenseNumber: e.target.value})}
                              required
                              style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '5px'
                              }}
                            />
                          </div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tarif consultation (€) *</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={newUser.consultationFee}
                              onChange={(e) => setNewUser({...newUser, consultationFee: e.target.value})}
                              required
                              style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '5px'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Département</label>
                            <input
                              type="text"
                              value={newUser.department}
                              onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                              style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '5px'
                              }}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                      <button 
                        type="button"
                        onClick={() => setShowCreateUser(false)}
                        style={{
                          background: '#6c757d',
                          color: 'white',
                          border: 'none',
                          padding: '12px 20px',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit"
                        disabled={loading}
                        style={{
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          padding: '12px 20px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          opacity: loading ? 0.5 : 1
                        }}
                      >
                        {loading ? 'Création...' : 'Créer l\'utilisateur'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal Modification Utilisateur */}
            {showEditUser && selectedUser && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '10px',
                  width: '90%',
                  maxWidth: '600px',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>Modifier l'utilisateur</h2>
                    <button 
                      onClick={() => {
                        setShowEditUser(false);
                        setSelectedUser(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  </div>
                  
                  <form onSubmit={handleUpdateUser}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prénom *</label>
                        <input
                          type="text"
                          value={newUser.firstName}
                          onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px'
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom *</label>
                        <input
                          type="text"
                          value={newUser.lastName}
                          onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px'
                          }}
                          required
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
                        <input
                          type="email"
                          value={newUser.email}
                          disabled
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px',
                            background: '#f0f0f0',
                            cursor: 'not-allowed'
                          }}
                        />
                        <small style={{ color: '#666', fontSize: '0.85rem' }}>L'email ne peut pas être modifié</small>
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nouveau mot de passe</label>
                        <input
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          placeholder="Laisser vide pour ne pas modifier"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px'
                          }}
                          minLength={6}
                        />
                        <small style={{ color: '#666', fontSize: '0.85rem' }}>Min. 6 caractères</small>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Téléphone</label>
                        <input
                          type="tel"
                          value={newUser.phone}
                          onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Rôle *</label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px'
                          }}
                          required
                        >
                          <option value="doctor">Médecin</option>
                          <option value="receptionist">Réceptionniste</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </div>
                    </div>

                    {/* Champs spécifiques aux médecins */}
                    {newUser.role === 'doctor' && (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Spécialité *</label>
                            <input
                              type="text"
                              value={newUser.specialty}
                              onChange={(e) => setNewUser({...newUser, specialty: e.target.value})}
                              required
                              style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '5px'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Numéro de licence *</label>
                            <input
                              type="text"
                              value={newUser.licenseNumber}
                              onChange={(e) => setNewUser({...newUser, licenseNumber: e.target.value})}
                              required
                              style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '5px'
                              }}
                            />
                          </div>
                        </div>
                        
                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tarif consultation (€) *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={newUser.consultationFee}
                            onChange={(e) => setNewUser({...newUser, consultationFee: e.target.value})}
                            required
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '1px solid #ccc',
                              borderRadius: '5px'
                            }}
                          />
                        </div>
                      </>
                    )}

                    {/* Champs spécifiques aux réceptionnistes */}
                    {newUser.role === 'receptionist' && (
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Département</label>
                        <input
                          type="text"
                          value={newUser.department}
                          onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px'
                          }}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
                      <button 
                        type="button"
                        onClick={() => {
                          setShowEditUser(false);
                          setSelectedUser(null);
                        }}
                        style={{
                          background: '#6c757d',
                          color: 'white',
                          border: 'none',
                          padding: '12px 20px',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit"
                        disabled={loading}
                        style={{
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '12px 20px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          opacity: loading ? 0.5 : 1
                        }}
                      >
                        {loading ? 'Modification...' : 'Enregistrer les modifications'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section Gestion des Cliniques */}
        {activeSection === 'clinics' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Gestion des cliniques</h2>
              <button 
                onClick={() => setShowCreateClinic(true)}
                style={{
                  background: '#007bff',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                + Créer une clinique
              </button>
            </div>

            {loading && <p>Chargement...</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {clinics.map(clinic => (
                <div key={clinic.id} style={{ 
                  background: 'white', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <h3>🏥 {clinic.name}</h3>
                    <span style={{ 
                      background: clinic.isActive ? '#28a745' : '#6c757d', 
                      color: 'white', 
                      padding: '4px 12px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem' 
                    }}>
                      {clinic.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <p style={{ marginBottom: '10px' }}>
                    <strong>TenantID:</strong> <code style={{ 
                      background: '#f1f5f9', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      color: '#2563eb' 
                    }}>{clinic.tenantId}</code>
                  </p>
                  {clinic.address && <p>📍 {clinic.address}</p>}
                  {clinic.phone && <p>📞 {clinic.phone}</p>}
                  {clinic.email && <p>📧 {clinic.email}</p>}
                  
                  <div style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '5px' }}>
                    <strong>Utilisateurs: {clinic.users?.length || 0}</strong>
                  </div>

                  <button 
                    onClick={() => {
                      setSelectedClinic(clinic);
                      setShowAssignUserModal(true);
                    }}
                    style={{
                      marginTop: '15px',
                      width: '100%',
                      background: '#007bff',
                      color: 'white',
                      padding: '10px',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Affecter un utilisateur
                  </button>

                  {clinic.users && clinic.users.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                      <h4>Utilisateurs affectés:</h4>
                      {clinic.users.map(u => (
                        <div key={u.id} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '8px',
                          background: '#f8f9fa',
                          marginTop: '5px',
                          borderRadius: '4px'
                        }}>
                          <span>{getRoleIcon(u.role)} {u.firstName} {u.lastName} ({u.role})</span>
                          <button 
                            onClick={() => handleUnassignUser(u.id)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal création clinique */}
            {showCreateClinic && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '10px',
                  width: '500px',
                  maxHeight: '80vh',
                  overflow: 'auto'
                }}>
                  <h2>Créer une nouvelle clinique</h2>
                  <form onSubmit={handleCreateClinic}>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom de la clinique *</label>
                      <input
                        type="text"
                        value={newClinic.name}
                        onChange={(e) => setNewClinic({...newClinic, name: e.target.value})}
                        required
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ccc',
                          borderRadius: '5px'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Adresse</label>
                      <input
                        type="text"
                        value={newClinic.address}
                        onChange={(e) => setNewClinic({...newClinic, address: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ccc',
                          borderRadius: '5px'
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Téléphone</label>
                        <input
                          type="tel"
                          value={newClinic.phone}
                          onChange={(e) => setNewClinic({...newClinic, phone: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
                        <input
                          type="email"
                          value={newClinic.email}
                          onChange={(e) => setNewClinic({...newClinic, email: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '5px'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        type="button" 
                        onClick={() => setShowCreateClinic(false)}
                        style={{
                          flex: 1,
                          background: '#6c757d',
                          color: 'white',
                          padding: '10px 20px',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit" 
                        disabled={loading}
                        style={{
                          flex: 1,
                          background: '#007bff',
                          color: 'white',
                          padding: '10px 20px',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          opacity: loading ? 0.5 : 1
                        }}
                      >
                        {loading ? 'Création...' : 'Créer la clinique'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal affectation utilisateur */}
            {showAssignUserModal && selectedClinic && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '10px',
                  width: '500px',
                  maxHeight: '80vh',
                  overflow: 'auto'
                }}>
                  <h2>Affecter un utilisateur à {selectedClinic.name}</h2>
                  <p style={{ color: '#6c757d', marginBottom: '20px' }}>Sélectionnez un médecin ou réceptionniste à affecter</p>
                  
                  <div>
                    {users.filter(u => (u.role === 'doctor' || u.role === 'receptionist') && !u.clinicId).map(u => (
                      <div key={u.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px',
                        background: '#f8f9fa',
                        marginBottom: '10px',
                        borderRadius: '5px'
                      }}>
                        <span>{getRoleIcon(u.role)} {u.firstName} {u.lastName} ({u.role})</span>
                        <button 
                          onClick={() => handleAssignUserToClinic(u.id, selectedClinic.id)}
                          style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '5px 15px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Affecter
                        </button>
                      </div>
                    ))}
                    {users.filter(u => (u.role === 'doctor' || u.role === 'receptionist') && !u.clinicId).length === 0 && (
                      <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
                        Aucun utilisateur disponible à affecter
                      </p>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      setShowAssignUserModal(false);
                      setSelectedClinic(null);
                    }}
                    style={{
                      marginTop: '20px',
                      width: '100%',
                      background: '#6c757d',
                      color: 'white',
                      padding: '10px',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings section removed */}
      </div>
    </div>
  );
}

// Composant pour gérer la redirection automatique
function HomeRedirect() {
  const { user } = useAuth();
  
  // Si l'utilisateur est admin, rediriger vers /admin
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  // Sinon, afficher la page d'accueil normale
  return <Home />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <HomeRedirect />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
