import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Fonction pour décoder le JWT et extraire le rôle
  const getUserRoleFromToken = (token) => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || 'user';
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  };

  useEffect(() => {
    // Afficher le token au chargement de l'application
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      console.log('🔄 TOKEN TROUVÉ AU CHARGEMENT:');
      console.log('Token depuis localStorage:', storedToken.substring(0, 50) + '...');
      console.log('Vérification du localStorage:', localStorage.getItem('token') ? 'Token présent' : 'Aucun token');
    } else {
      console.log('❌ Aucun token trouvé dans localStorage');
    }

    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      console.log('🔍 Tentative de récupération du profil utilisateur...');
      const response = await fetch('http://localhost:3002/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      console.log('⚠️ Backend probablement non démarré, continuons sans authentification');
      // Ne pas supprimer le token en cas d'erreur réseau
      // localStorage.removeItem('token');
      // setToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Expose a refresh function so components can re-fetch the current user
  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) return;
      const response = await fetch('http://localhost:3002/auth/profile', {
        headers: { 'Authorization': `Bearer ${storedToken}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (err) {
      console.error('Erreur lors du rafraîchissement du profil:', err);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:3002/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        
        // Afficher le token dans la console
        console.log('🔐 CONNEXION RÉUSSIE - TOKEN JWT STOCKÉ:');
        console.log('Utilisateur connecté:', data.user);
        console.log('Rôle:', data.user?.role);
        console.log('Token tronqué:', data.access_token.substring(0, 50) + '...');
        
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Erreur de connexion' };
      }
    } catch (error) {
      return { success: false, error: 'Erreur de connexion au serveur' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch('http://localhost:3002/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Connecter automatiquement l'utilisateur après l'inscription
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
        
        console.log('🔐 INSCRIPTION RÉUSSIE - TOKEN STOCKÉ:');
        console.log('Utilisateur:', data.user);
        console.log('Token:', data.access_token.substring(0, 50) + '...');
        
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Erreur lors de l\'inscription' };
      }
    } catch (error) {
      return { success: false, error: 'Erreur de connexion au serveur' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const userRole = getUserRoleFromToken(token);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!token && !!user,
    userRole,
    // Système médical à 4 rôles
    isAdmin: userRole === 'admin',
    isDoctor: userRole === 'doctor',
    isReceptionist: userRole === 'receptionist',
    isPatient: userRole === 'patient',
    // Helpers pour les rôles du personnel médical
    isStaff: ['admin', 'doctor', 'receptionist'].includes(userRole),
    isMedicalProfessional: ['doctor', 'admin'].includes(userRole),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};