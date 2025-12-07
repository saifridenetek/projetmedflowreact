import { useAuth } from './contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Doctor from './Doctor';
import Receptionist from './Receptionist';
import Patient from './Patient';

export default function Home() {
  const { 
    user, 
    logout, 
    isAdmin, 
    isDoctor, 
    isReceptionist, 
    isPatient, 
    userRole,
    isStaff,
    isMedicalProfessional
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [welcomeMessage, setWelcomeMessage] = useState('');

  useEffect(() => {
    if (location.state?.message) {
      setWelcomeMessage(location.state.message);
      // Effacer le message après 5 secondes
      setTimeout(() => setWelcomeMessage(''), 5000);
    }
  }, [location.state]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return '🔧';
      case 'doctor': return '👨‍⚕️';
      case 'receptionist': return '👩‍💼';
      case 'patient': return '🤒';
      default: return '👤';
    }
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'doctor': return 'Médecin';
      case 'receptionist': return 'Réceptionniste';
      case 'patient': return 'Patient';
      default: return 'Utilisateur';
    }
  };

  // Redirection vers les composants spécialisés selon le rôle
  if (isDoctor) {
    return <Doctor />;
  }

  if (isReceptionist) {
    return <Receptionist />;
  }

  if (isPatient) {
    return <Patient />;
  }

  // Interface normale centrée pour les admins uniquement
  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '20px auto', 
      padding: '30px',
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Message de bienvenue */}
      {welcomeMessage && (
        <div style={{ 
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
          border: '1px solid #c3e6cb'
        }}>
          {welcomeMessage}
        </div>
      )}

      {/* En-tête avec déconnexion */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          margin: 0,
          color: '#2c3e50',
          fontSize: '2.5em'
        }}>
          🏥 MedFlow
        </h1>
        <button 
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.3s'
          }}
        >
          🚪 Se déconnecter
        </button>
      </div>
      
      {user && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '25px', 
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h2 style={{ color: '#495057', marginBottom: '20px' }}>👋 Bienvenue, {user.firstName} {user.lastName}</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div>
              <p><strong>📧 Email:</strong> {user.email}</p>
              <p><strong>🎭 Rôle:</strong> {getRoleIcon(userRole)} {getRoleDisplay(userRole)}</p>
            </div>
            <div>
              {user.phone && <p><strong>📞 Téléphone:</strong> {user.phone}</p>}
              <p><strong>📅 Membre depuis:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Dashboard admin uniquement */}
      {isAdmin && (
        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7',
          padding: '25px', 
          borderRadius: '10px',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#d68910', marginBottom: '15px' }}>🔧 Panneau d'Administration</h3>
          <p>Gérez les utilisateurs, les paramètres système et supervisez l'activité de la plateforme.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
            <Link 
              to="/admin"
              style={{
                display: 'block',
                padding: '15px',
                backgroundColor: '#e74c3c',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}
            >
              👑 Administration
            </Link>
            
            <button style={{
              padding: '15px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              📊 Statistiques
            </button>
            
            <button style={{
              padding: '15px',
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              ⚙️ Paramètres
            </button>
          </div>
        </div>
      )}
    </div>
  );
}