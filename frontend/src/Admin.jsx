import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { clinicService, userService } from './services/api';
import './admin.css';

// Configuration de l'URL de l'API depuis les variables d'environnement
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export function Admin() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // Force le rendu avec les nouvelles modifications
  useEffect(() => {
    console.log('🔄 Admin component loaded - Version 2.0');
  }, []);
  const [users, setUsers] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalReceptionists: 0,
    totalPatients: 0,
    recentUsers: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showCreateClinic, setShowCreateClinic] = useState(false);
  const [showAssignUserModal, setShowAssignUserModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

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

  const [newClinic, setNewClinic] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    isActive: true
  });

  useEffect(() => {
    if (activeSection === 'users') {
      fetchUsers();
    } else if (activeSection === 'dashboard') {
      fetchStatistics();
    } else if (activeSection === 'clinics') {
      fetchClinics();
      fetchUsers();
    }
  }, [activeSection]);

  const fetchUsers = async () => {
    if (!token) {
      setError('Token d\'authentification manquant');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || data || []);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        setError(`Erreur ${response.status}: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      setError('Impossible de se connecter au serveur. Assurez-vous que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/statistics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      } else {
        // Si les statistiques ne sont pas disponibles, utiliser des données simulées
        console.log('Statistiques non disponibles, utilisation de données simulées');
        setStatistics({
          totalUsers: users.length,
          totalDoctors: 0,
          totalReceptionists: 0,
          totalPatients: 0,
          recentUsers: []
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      // Utiliser des données simulées en cas d'erreur
      setStatistics({
        totalUsers: 0,
        totalDoctors: 0,
        totalReceptionists: 0,
        totalPatients: 0,
        recentUsers: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Token d\'authentification manquant');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newUser,
          consultationFee: newUser.consultationFee ? parseFloat(newUser.consultationFee) : undefined,
          confirmPassword: newUser.password
        }),
      });

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
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        setError(`Erreur: ${errorData.message || 'Impossible de créer l\'utilisateur'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion. Vérifiez que le backend est démarré.');
    } finally {
      setLoading(false);
    }
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
      setError('Token d\'authentification manquant');
      return;
    }

    setLoading(true);
    setError(null);

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
      if (newUser.password) {
        updateData.password = newUser.password;
      }

      const response = await fetch(`${API_BASE_URL}/admin/users/${selectedUser.id}`, {
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
        setError(`Erreur: ${errorData.message || 'Impossible de modifier l\'utilisateur'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion. Vérifiez que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    if (!token) {
      setError('Token d\'authentification manquant');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchUsers();
        alert('Utilisateur supprimé avec succès');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        setError(`Erreur: ${errorData.message || 'Impossible de supprimer l\'utilisateur'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion. Vérifiez que le backend est démarré.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clinicService.getAll();
      setClinics(data.clinics || []);
    } catch (error) {
      console.error('Erreur lors du chargement des cliniques:', error);
      setError('Impossible de charger les cliniques');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClinic = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await clinicService.create(newClinic);
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
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la création de la clinique');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUserToClinic = async (userId, clinicId) => {
    setLoading(true);
    setError(null);
    
    try {
      await clinicService.assignUser(clinicId, userId);
      setShowAssignUserModal(false);
      setSelectedClinic(null);
      fetchClinics();
      alert('Utilisateur affecté avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de l\'affectation');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignUser = async (userId) => {
    if (!confirm('Voulez-vous vraiment désaffecter cet utilisateur ?')) return;
    
    setLoading(true);
    try {
      await clinicService.unassignUser(userId);
      fetchClinics();
      fetchUsers();
      alert('Utilisateur désaffecté avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la désaffectation');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
    { id: 'users', label: 'Gestion utilisateurs', icon: '👥' },
    { id: 'clinics', label: 'Gestion cliniques', icon: '🏥' }
  ];
  
  console.log('🔍 DEBUG: menuItems =', menuItems);
  console.log('👤 DEBUG: User role =', user?.role);

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="welcome-section">
        <h1>Tableau de bord administrateur</h1>
        <p>Bienvenue, {user?.firstName || 'Administrateur'} {user?.lastName || ''}</p>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h5>Total Utilisateurs</h5>
            <div className="stat-number">{statistics?.totalUsers || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍⚕️</div>
          <div className="stat-info">
            <h5>Médecins</h5>
            <div className="stat-number">{statistics?.totalDoctors || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏥</div>
          <div className="stat-info">
            <h5>Réceptionnistes</h5>
            <div className="stat-number">{statistics?.totalReceptionists || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">😷</div>
          <div className="stat-info">
            <h5>Patients</h5>
            <div className="stat-number">{statistics?.totalPatients || 0}</div>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h2>Activité récente</h2>
        {statistics?.recentUsers?.length > 0 ? (
          <div className="activity-list">
            {statistics.recentUsers.map(user => (
              <div key={user.id} className="activity-item">
                <div className="activity-avatar">{getRoleIcon(user.role)}</div>
                <div className="activity-details">
                  <div className="activity-title">
                    Nouvel utilisateur: {user.firstName} {user.lastName}
                  </div>
                  <div className="activity-subtitle">
                    {user.role} • {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-activity">
            Aucune activité récente disponible
          </p>
        )}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="users-content">
      <div className="users-header">
        <h1>Gestion des utilisateurs</h1>
        <button 
          className="create-user-btn"
          onClick={() => setShowCreateUser(true)}
        >
          + Ajouter un utilisateur
        </button>
      </div>

      {error && (
        <div className="alert-error">
          ⚠️ {error}
        </div>
      )}

      {loading && <div className="loading">Chargement des utilisateurs...</div>}

      {!loading && users.length === 0 && !error && (
        <div className="alert-warning">
          Aucun utilisateur trouvé. Assurez-vous que le backend est démarré.
        </div>
      )}

      {users.length > 0 && (
        <div className="users-table">
          <div className="table-header">
            <div>Nom</div>
            <div>Email</div>
            <div>Rôle</div>
            <div>Date d'inscription</div>
            <div>Actions</div>
          </div>
          {users.map(user => (
            <div key={user.id} className="table-row">
              <div className="user-name">
                <div className="user-avatar">{getRoleIcon(user.role)}</div>
                <div className="user-name-text">{user.firstName} {user.lastName}</div>
              </div>
              <div className="user-email">{user.email}</div>
              <div className={`role-badge ${user.role}`}>{user.role}</div>
              <div className="user-date">{new Date(user.createdAt).toLocaleDateString()}</div>
              <div className="actions">
                <button 
                  className="edit-btn"
                  onClick={() => handleEditUser(user)}
                >
                  Modifier
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteUser(user.id)}
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
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Créer un nouvel utilisateur</h2>
              <button 
                className="close-btn"
                onClick={() => setShowCreateUser(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom *</label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Rôle *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    required
                  >
                    <option value="doctor">Médecin</option>
                    <option value="receptionist">Réceptionniste</option>
                    <option value="admin">Administrateur</option>
                  </select>
                  <small>Note: Les patients s'inscrivent eux-mêmes via le formulaire d'inscription</small>
                </div>
                <div className="form-group">
                  <label>Mot de passe *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Champs spécifiques aux médecins */}
              {newUser.role === 'doctor' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Spécialité *</label>
                      <input
                        type="text"
                        value={newUser.specialty}
                        onChange={(e) => setNewUser({...newUser, specialty: e.target.value})}
                        required={newUser.role === 'doctor'}
                      />
                    </div>
                    <div className="form-group">
                      <label>Numéro de licence *</label>
                      <input
                        type="text"
                        value={newUser.licenseNumber}
                        onChange={(e) => setNewUser({...newUser, licenseNumber: e.target.value})}
                        required={newUser.role === 'doctor'}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tarif consultation *</label>
                      <input
                        type="number"
                        value={newUser.consultationFee}
                        onChange={(e) => setNewUser({...newUser, consultationFee: e.target.value})}
                        required={newUser.role === 'doctor'}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="form-group">
                      <label>Département</label>
                      <input
                        type="text"
                        value={newUser.department}
                        onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowCreateUser(false)}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Création...' : 'Créer l\'utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de modification d'utilisateur */}
      {showEditUser && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Modifier l'utilisateur</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowEditUser(false);
                  setSelectedUser(null);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom *</label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email (non modifiable)</label>
                <input
                  type="email"
                  value={newUser.email}
                  disabled
                  style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Rôle *</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    required
                  >
                    <option value="doctor">Médecin</option>
                    <option value="receptionist">Réceptionniste</option>
                    <option value="patient">Patient</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Laisser vide pour ne pas modifier"
                />
              </div>

              {newUser.role === 'doctor' && (
                <>
                  <div className="form-group">
                    <label>Spécialité</label>
                    <input
                      type="text"
                      value={newUser.specialty}
                      onChange={(e) => setNewUser({...newUser, specialty: e.target.value})}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Numéro de licence</label>
                      <input
                        type="text"
                        value={newUser.licenseNumber}
                        onChange={(e) => setNewUser({...newUser, licenseNumber: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Frais de consultation (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newUser.consultationFee}
                        onChange={(e) => setNewUser({...newUser, consultationFee: e.target.value})}
                      />
                    </div>
                  </div>
                </>
              )}

              {newUser.role === 'receptionist' && (
                <div className="form-group">
                  <label>Département</label>
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  />
                </div>
              )}

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowEditUser(false);
                    setSelectedUser(null);
                  }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Modification...' : 'Modifier l\'utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderClinics = () => (
    <div className="users-content">
      <div className="users-header">
        <h1>Gestion des cliniques</h1>
        <button 
          className="create-user-btn"
          onClick={() => setShowCreateClinic(true)}
        >
          + Créer une clinique
        </button>
      </div>

      {error && (
        <div className="alert-error">
          ⚠️ {error}
        </div>
      )}

      {loading && <div className="loading">Chargement...</div>}

      <div className="clinics-grid">
        {clinics.map(clinic => (
          <div key={clinic.id} className="clinic-card">
            <div className="clinic-header">
              <h3>🏥 {clinic.name}</h3>
              <span className={clinic.isActive ? 'badge-active' : 'badge-inactive'}>
                {clinic.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div className="clinic-info">
              <p><strong>TenantID:</strong> <code>{clinic.tenantId}</code></p>
              {clinic.address && <p>📍 {clinic.address}</p>}
              {clinic.phone && <p>📞 {clinic.phone}</p>}
              {clinic.email && <p>📧 {clinic.email}</p>}
            </div>
            <div className="clinic-stats">
              <div className="clinic-stat">
                <span className="stat-label">Utilisateurs</span>
                <span className="stat-value">{clinic.users?.length || 0}</span>
              </div>
            </div>
            <div className="clinic-actions">
              <button 
                className="btn-assign"
                onClick={() => {
                  setSelectedClinic(clinic);
                  setShowAssignUserModal(true);
                }}
              >
                Affecter un utilisateur
              </button>
              {clinic.users && clinic.users.length > 0 && (
                <div className="clinic-users-list">
                  <h4>Utilisateurs affectés:</h4>
                  {clinic.users.map(u => (
                    <div key={u.id} className="clinic-user-item">
                      <span>{getRoleIcon(u.role)} {u.firstName} {u.lastName} ({u.role})</span>
                      <button 
                        className="btn-unassign"
                        onClick={() => handleUnassignUser(u.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal création clinique */}
      {showCreateClinic && (
        <div className="modal-overlay" onClick={() => setShowCreateClinic(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Créer une nouvelle clinique</h2>
            <form onSubmit={handleCreateClinic}>
              <div className="form-group">
                <label>Nom de la clinique *</label>
                <input
                  type="text"
                  value={newClinic.name}
                  onChange={(e) => setNewClinic({...newClinic, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Adresse</label>
                <input
                  type="text"
                  value={newClinic.address}
                  onChange={(e) => setNewClinic({...newClinic, address: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={newClinic.phone}
                    onChange={(e) => setNewClinic({...newClinic, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newClinic.email}
                    onChange={(e) => setNewClinic({...newClinic, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowCreateClinic(false)}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
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
        <div className="modal-overlay" onClick={() => setShowAssignUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Affecter un utilisateur à {selectedClinic.name}</h2>
            <div className="assign-user-list">
              {users
                .filter(u => !u.clinicId && (u.role === 'doctor' || u.role === 'receptionist'))
                .map(u => (
                  <div key={u.id} className="assign-user-item">
                    <span>{getRoleIcon(u.role)} {u.firstName} {u.lastName} ({u.role})</span>
                    <button
                      className="btn-assign-small"
                      onClick={() => handleAssignUserToClinic(u.id, selectedClinic.id)}
                    >
                      Affecter
                    </button>
                  </div>
                ))}
              {users.filter(u => !u.clinicId && (u.role === 'doctor' || u.role === 'receptionist')).length === 0 && (
                <p style={{ textAlign: 'center', color: '#64748b' }}>
                  Aucun utilisateur disponible (docteur ou réceptionniste non affecté)
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setShowAssignUserModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Settings section removed — not used in the current interface

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo">🏥 MedFlow</div>
          <div className="subtitle">Administration</div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={activeSection === 'dashboard' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveSection('dashboard')}
          >
            📊 Tableau de bord
          </button>
          
          <button 
            className={activeSection === 'users' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveSection('users')}
          >
            👥 Gestion utilisateurs
          </button>
          
          <button 
            className={activeSection === 'clinics' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveSection('clinics')}
          >
            🏥 Gestion cliniques
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👑</div>
            <div className="user-details">
              <div className="user-name">{user?.firstName || 'Admin'} {user?.lastName || ''}</div>
              <div className="user-role">Administrateur</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="admin-main">
        <div className="main-header">
          <h2>
            {activeSection === 'dashboard' && '📊 Tableau de bord'}
            {activeSection === 'users' && '👥 Gestion des utilisateurs'}
            {activeSection === 'clinics' && '🏥 Gestion des cliniques'}
          </h2>
          <div className="header-info">
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        <div className="main-content">
          {activeSection === 'dashboard' && renderDashboard()}
          {activeSection === 'users' && renderUsers()}
          {activeSection === 'clinics' && renderClinics()}
        </div>
      </div>
    </div>
  );
}